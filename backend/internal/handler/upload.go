// Package handler предоставляет HTTP-обработчики для API-endpoints.
// Содержит логику обработки запросов загрузки и объединения файлов.
package handler

import (
	"encoding/json"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"

	"github.com/MindlessMuse666/code-merger/internal/config"
	"github.com/MindlessMuse666/code-merger/internal/service"
)

// UploadHandler обрабатывает загрузку файлов
type UploadHandler struct {
	cfg         *config.Config
	fileService *service.FileService
}

// UploadResponse представляет успешный ответ на загрузку файлов
type UploadResponse struct {
	Message string   `json:"message"`  // Сообщение о результате операции
	FileIDs []string `json:"file_ids"` // Массив идентификаторов загруженных файлов
}

// NewUploadHandler создает новый экземпляр UploadHandler
func NewUploadHandler(cfg *config.Config, fileService *service.FileService) *UploadHandler {
	return &UploadHandler{
		cfg:         cfg,
		fileService: fileService,
	}
}

// HandleUpload обрабатывает запрос на загрузку файлов
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
		if err.Error() == "http: request body too large" {
			sendError(w, http.StatusRequestEntityTooLarge, "request too large", "total request size exceeds limit")
		} else {
			sendError(w, http.StatusBadRequest, "failed to parse multipart form", err.Error())
		}
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
			sendError(w, http.StatusRequestEntityTooLarge, "file too large",
				fmt.Sprintf("file %s exceeds maximum size limit of %d bytes",
					fileHeader.Filename, h.cfg.MaxFileSize))
			return
		}

		totalSize += fileHeader.Size
		if totalSize > h.cfg.MaxTotalSize {
			sendError(w, http.StatusRequestEntityTooLarge, "total size exceeded",
				fmt.Sprintf("total size of all files exceeds limit of %d bytes", h.cfg.MaxTotalSize))
			return
		}

		// Валидация: расширения файла
		if !isValidExtension(fileHeader.Filename) {
			sendError(w, http.StatusUnsupportedMediaType, "unsupported file type",
				fmt.Sprintf("file %s has unsupported extension", fileHeader.Filename))
			return
		}

		// Обработка файла
		fileID, err := h.processFile(fileHeader)
		if err != nil {
			sendError(w, http.StatusInternalServerError, "failed to process file", err.Error())
			return
		}

		fileIDs = append(fileIDs, fileID)
	}

	// Возврат успешного ответа
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(UploadResponse{
		Message: fmt.Sprintf("%d files uploaded successfully", len(fileIDs)),
		FileIDs: fileIDs,
	})
}

// processFile обрабатывает загруженный файл
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

	return h.fileService.ProcessFile(fileHeader.Filename, content)
}
