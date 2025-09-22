// Package handler предоставляет HTTP-обработчики для API-endpoints.
// Содержит логику получения содержимого файла.
package handler

import (
	"net/http"

	"github.com/MindlessMuse666/code-merger/internal/service"
	"github.com/go-chi/chi/v5"
)

// FileHandler обрабатывает запросы к отдельным файлам
type FileHandler struct {
	fileService *service.FileService
}

// NewFileHandler создает новый экземпляр FileHandler
func NewFileHandler(fileService *service.FileService) *FileHandler {
	return &FileHandler{
		fileService: fileService,
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

	fileData, err := h.fileService.GetFileByID(fileID)
	if err != nil {
		sendError(w, http.StatusNotFound, "file not found", err.Error())
		return
	}

	w.Header().Set("Content-Type", "text/plain; charset=utf-8")
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(fileData.Content))
}
