// Package handler предоставляет HTTP-обработчики для API-endpoints
// Содержит логику обработки запросов загрузки и объединения файлов
package handler

import (
	"encoding/json"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"path/filepath"
	"strings"
	"time"

	"github.com/MindlessMuse666/code-merger/internal/config"
)

// UploadHandler обрабатывает загрузку файлов через multipart/form-data
// Отвечает за валидацию, обработку и временное хранение загруженных файлов
type UploadHandler struct {
	cfg *config.Config
}

// UploadResponse представляет успешный ответ на загрузку файлов
type UploadResponse struct {
	Message string   `json:"message"`  // Сообщение о результате операции
	FileIDs []string `json:"file_ids"` // Массив идентификаторов загруженных файлов
}

// ErrorResponce представляет структуру ошибки API
// Используется для стандартизации JSON-ответов с ошибками
type ErrorResponce struct {
	Error   string `json:"error"`             // Описание ошибки
	Details string `json:"details,omitempty"` // Дополнительные детали ошибки
}

// NewUploadHandler создает новый экземпляр UploadHandler
// Принимает конфиг приложения и возвращает инициализированный обработчик
func NewUploadHandler(cfg *config.Config) *UploadHandler {
	return &UploadHandler{cfg: cfg}
}

// HandleUpload обрабатывает загрузку файлов через multipart/form-data
// @Summary Загрузка файлов для обработки
// @Description Принимает один или несколько файлов для последующего объединения
// @Tags Files
// @Accept multipart/form-data
// @Produce json
// @Param files formData file true "Файлы для загрузки"
// @Success 200 {object} UploadResponse
// @Failure 400 {object} ErrorResponse
// @Failure 413 {object} ErrorResponse
// @Failure 415 {object} ErrorResponse
// @Router /api/upload [post]
func (h *UploadHandler) HandleUpload(w http.ResponseWriter, r *http.Request) {
	// Лимит для всего запроса
	r.Body = http.MaxBytesReader(w, r.Body, h.cfg.MaxTotalSize)

	if err := r.ParseMultipartForm(h.cfg.MaxTotalSize); err != nil {
		h.sendError(w, http.StatusBadRequest, "failed to parse multipart form", err.Error())
		return
	}

	files := r.MultipartForm.File["files"]
	if len(files) == 0 {
		h.sendError(w, http.StatusBadRequest, "no files provided", "please provide at least one file")
		return
	}

	var fileIDs []string
	totalSize := int64(0)

	for _, fileHeader := range files {
		// Валидация: размер файлв
		if fileHeader.Size > h.cfg.MaxFileSize {
			h.sendError(w, http.StatusRequestEntityTooLarge, "file too large", fmt.Sprintf("file %s exceeds maximum size limit", fileHeader.Filename))
			return
		}

		totalSize += fileHeader.Size
		if totalSize > h.cfg.MaxTotalSize {
			h.sendError(w, http.StatusRequestEntityTooLarge, "total size exceeded", "total size of all files exceeds limit")
			return
		}

		// Валидация: расширения файла
		if !h.isValidExtension(fileHeader.Filename) {
			h.sendError(w, http.StatusUnsupportedMediaType, "unsupported file type", fmt.Sprintf("file &s has unsupported extension", fileHeader.Filename))
			return
		}

		// Обработка файла
		fileId, err := h.processFile(fileHeader)
		if err != nil {
			h.sendError(w, http.StatusInternalServerError, "failed to process file", err.Error())
			return
		}

		fileIDs = append(fileIDs, fileId)
	}
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

	// Валидация: файл является текстовым
	if !isTextContent(content) {
		return "", fmt.Errorf("file appears to be binary: %s", fileHeader.Filename)
	}

	// TODO(временная реализация): Генерация уникального ID для файла
	fileID := generateFileID()

	// TODO(будущая фича): Сохранить файл во временное хранилище или память (fileID как ключ)

	return fileID, nil
}

// isValidExtension проверяет поддерживается ли расширение файла
// TODO(дополняется): Поддерживаемые расширения: .md, .txt, .yaml, .yml, Dockerfile, Makefile, .json, .cpp, .go, .py, .html, .css, .js
func (h *UploadHandler) isValidExtension(filename string) bool {
	ext := strings.ToLower(filepath.Ext(filename))
	if ext == "" {
		// Валидация: специальные случаи без расширения
		base := strings.ToLower(filepath.Base(filename))
		return base == "dockerfile" || base == "makefile"
	}

	supported := map[string]bool{
		".md": true, ".txt": true, ".yaml": true, ".yml": true,
		".json": true, ".cpp": true, ".go": true, ".py": true,
		".html": true, ".css": true, ".js": true, ".sh": true,
	}

	return supported[ext]
}

// sendError отправляет ошибку в формате JSON
func (h *UploadHandler) sendError(w http.ResponseWriter, statusCode int, errorMsg string, details string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)

	response := ErrorResponce{
		Error:   errorMsg,
		Details: details,
	}

	json.NewEncoder(w).Encode(response)
}

// isTextContent валидирует, что содержимое является текстовым
// TODO(можно улучшить): Первичная реализация
func isTextContent(content []byte) bool {
	for _, b := range content {
		if b < 9 || (b > 13 && b < 32) && b != 27 {
			return false
		}
	}
	return true
}

// generateFileID гененирует уникальный ID для файла
// TODO(временная реализация): В prod использовать uuid
func generateFileID() string {
	return fmt.Sprintf("file_%d", time.Now().UnixNano())
}
