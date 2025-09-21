// Package handler предоставляет HTTP-обработчики для API-endpoints.
// Содержит логику получения содержимого файла.
package handler

import (
	"net/http"

	"github.com/MindlessMuse666/code-merger/internal/storage"
	"github.com/go-chi/chi/v5"
)

// FileHandler обрабатывает запросы к отдельным файлам
type FileHandler struct {
	storage storage.Storage
}

// NewFileHandler создает новый экземпляр FileHandler
func NewFileHandler(storage storage.Storage) *FileHandler {
	return &FileHandler{
		storage: storage,
	}
}

// GetFileContent возвращает содержимое файла по ID
// @Summary Получение содержимого файла
// @Description Возвращает содержимое файла по его идентификатору для предпросмотра
// @Tags Files
// @Produce plain
// @Param fileId path string true "ID файла"
// @Success 200 {string} string "Содержимое файла"
// @Failure 404 {object} ErrorResponse
// @Router /api/file/{fileId} [get]
func (h *FileHandler) GetFileContent(w http.ResponseWriter, r *http.Request) {
	fileID := chi.URLParam(r, "fileId")

	fileData, exists := h.storage.Get(fileID)
	if !exists {
		sendError(w, http.StatusNotFound, "file not found", "file with the specified ID was not found")
		return
	}

	w.Header().Set("Content-Type", "text/plain; charset=utf-8")
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(fileData.Content))
}
