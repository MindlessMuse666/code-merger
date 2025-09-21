// Package handler предоставляет HTTP-обработчики для API-endpoints
// Содержит логику обработки запросов загрузки и объединения файлов
package handler

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"time"
	"unicode/utf8"

	"golang.org/x/text/encoding/charmap"
	"golang.org/x/text/transform"

	"github.com/MindlessMuse666/code-merger/internal/config"
	"github.com/MindlessMuse666/code-merger/internal/storage"
)

// UploadHandler обрабатывает загрузку файлов через multipart/form-data
// Отвечает за валидацию, обработку и временное хранение загруженных файлов
type UploadHandler struct {
	cfg     *config.Config
	storage *storage.MemoryStorage
}

// UploadResponse представляет успешный ответ на загрузку файлов
type UploadResponse struct {
	Message string   `json:"message"`  // Сообщение о результате операции
	FileIDs []string `json:"file_ids"` // Массив идентификаторов загруженных файлов
}

// NewUploadHandler создает новый экземпляр UploadHandler
// Принимает конфиг приложения и возвращает инициализированный обработчик
func NewUploadHandler(cfg *config.Config, storage *storage.MemoryStorage) *UploadHandler {
	return &UploadHandler{
		cfg:     cfg,
		storage: storage,
	}
}

// HandleUpload обрабатывает загрузку файлов через multipart/form-data
// @Summary Загрузка файлов для обработки
// @Description Принимает один или несколько файлов для последующего объединения. Проверяет расширения и размер файлов.
// @Tags Files
// @Summary Загрузка файлов для обработки
// @Description Эндпоинт принимает один или несколько текстовых файлов поддерживаемых форматов. Файлы временно сохраняются на сервере (в памяти) для последующего объединения. Возвращает уникальные идентификаторы файлов.
// @Accept multipart/form-data
// @Produce json
// @Param files formData file true "Массив файлов для загрузки. Можно выбрать несколько файлов, удерживая Ctrl (Cmd на Mac) при выборе в диалоговом окне." collectionFormat="multi"
// @Success 200 {object} UploadResponse
// @Failure 400 {object} ErrorResponse
// @Failure 413 {object} ErrorResponse
// @Failure 415 {object} ErrorResponse
// @Router /api/upload [post]
func (h *UploadHandler) HandleUpload(w http.ResponseWriter, r *http.Request) {
	// Лимит для всего запроса
	r.Body = http.MaxBytesReader(w, r.Body, h.cfg.MaxTotalSize)

	if err := r.ParseMultipartForm(h.cfg.MaxTotalSize); err != nil {
		sendError(w, http.StatusBadRequest, "failed to parse multipart form", err.Error())
		return
	}

	files := r.MultipartForm.File["files"]
	if len(files) == 0 {
		sendError(w, http.StatusBadRequest, "no files provided", "please provide at least one file")
		return
	}

	var fileIDs []string
	totalSize := int64(0)

	for _, fileHeader := range files {
		// Валидация: размер файла
		if fileHeader.Size > h.cfg.MaxFileSize {
			sendError(w, http.StatusRequestEntityTooLarge, "file too large", fmt.Sprintf("file %s exceeds maximum size limit", fileHeader.Filename))
			return
		}

		totalSize += fileHeader.Size
		if totalSize > h.cfg.MaxTotalSize {
			sendError(w, http.StatusRequestEntityTooLarge, "total size exceeded", "total size of all files exceeds limit")
			return
		}

		// Валидация: расширения файла
		if !isValidExtension(fileHeader.Filename) {
			sendError(w, http.StatusUnsupportedMediaType, "unsupported file type", fmt.Sprintf("file &s has unsupported extension", fileHeader.Filename))
			return
		}

		// Обработка файла
		fileId, err := h.processFile(fileHeader)
		if err != nil {
			sendError(w, http.StatusInternalServerError, "failed to process file", err.Error())
			return
		}

		fileIDs = append(fileIDs, fileId)
	}

	// Возврат успешного ответа
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(UploadResponse{
		Message: "files uploaded successfully",
		FileIDs: fileIDs,
	})
}

// processFile обрабатывает загруженный файл
// TODO(временная реализация): Сейчас возвращает UUID, в будущем может сохранять файл во временное хранилище
func (h *UploadHandler) processFile(fileHeader *multipart.FileHeader) (string, error) {
	file, err := fileHeader.Open()
	if err != nil {
		return "", fmt.Errorf("failed to open uploaded file: %v", err)
	}
	defer file.Close()

	// Чтение содержимого файла для валидации кодировки
	content, err := io.ReadAll(file)
	if err != nil {
		return "", fmt.Errorf("failed to read file content: %v", err)
	}

	// Конвертация в UTF-8
	utf8Content, err := convertToUTF8(content)
	if err != nil {
		return "", fmt.Errorf("failed to convert file to UTF-8: %v", err)
	}

	// Валидация: файл является текстовым
	if !isTextContent(utf8Content) {
		return "", fmt.Errorf("file appears to be binary: %s", fileHeader.Filename)
	}

	// TODO(временная реализация): Генерация уникального ID для файла
	fileID := generateFileID()

	h.storage.Store(fileID, storage.FileData{
		Content:  utf8Content,
		Filename: fileHeader.Filename,
		UploadAt: time.Now(),
	})

	return fileID, nil
}

// generateFileID гененирует уникальный ID для файла
// TODO(временная реализация): В prod использовать uuid
func generateFileID() string {
	return fmt.Sprintf("file_%d", time.Now().UnixNano())
}

func convertToUTF8(content []byte) (string, error) {
	// Попробуем декодировать из common encodings
	encodings := map[string]transform.Transformer{
		"windows-1251": charmap.Windows1251.NewDecoder(),
		"ISO-8859-1":   charmap.ISO8859_1.NewDecoder(),
		// Добавьте другие кодировки при необходимости
	}

	for _, decoder := range encodings {
		reader := transform.NewReader(bytes.NewReader(content), decoder)
		decoded, err := io.ReadAll(reader)
		if err == nil && isUTF8(decoded) {
			return string(decoded), nil
		}
	}

	// Если не удалось декодировать, проверяем UTF-8
	if isUTF8(content) {
		return string(content), nil
	}

	return "", fmt.Errorf("unable to convert to UTF-8")
}

func isUTF8(content []byte) bool {
	return utf8.Valid(content)
}
