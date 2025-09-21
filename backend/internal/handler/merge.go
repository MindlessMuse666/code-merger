// Package handler предоставляет HTTP-обработчики для API-endpoints.
// Содержит логику обработки запросов загрузки и объединения файлов.
package handler

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/MindlessMuse666/code-merger/internal/service"
)

// MergeHandler обрабатывает объединение файлов
type MergeHandler struct {
	fileService *service.FileService
}

// MergeRequest представляет запрос на объединение файлов
type MergeRequest struct {
	FileIDs        []string          `json:"file_ids"`
	OutputFilename string            `json:"output_filename"`
	FileRenames    map[string]string `json:"file_renames"`
}

// NewMergeHandler создает новый экземпляр MergeHandler
func NewMergeHandler(fileService *service.FileService) *MergeHandler {
	return &MergeHandler{
		fileService: fileService,
	}
}

// HandleMerge обрабатывает запрос на объединение файлов
// @Summary Объединение загруженных файлов
// @Description Объединяет ранее загруженные файлы в один текстовый файл с соблюдением правил форматирования
// @Tags Processing
// @Summary Объединение загруженных файлов
// @Description Эндпоинт принимает массив идентификаторов файлов, полученных от /api/upload, и объединяет их содержимое в один файл согласно правилам форматирования. Поддерживает переименование файлов в выходном результате.
// @Accept json
// @Produce octet-stream
// @Param request body MergeRequest true "Параметры объединения"
// @Success 200 {file} binary "Объединенный файл"
// @Failure 400 {object} ErrorResponse
// @Failure 404 {object} ErrorResponse
// @Router /api/merge [post]
func (h *MergeHandler) HandleMerge(w http.ResponseWriter, r *http.Request) {
	var request MergeRequest

	// Парсинг JSON тела запроса
	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		sendError(w, http.StatusBadRequest, "invalid json", err.Error())
		return
	}

	// Валидация: обязательные поля
	if len(request.FileIDs) == 0 {
		sendError(w, http.StatusBadRequest, "missing required field", "field 'file_ids' is required")
		return
	}
	if request.OutputFilename == "" {
		sendError(w, http.StatusBadRequest, "missing required field", "field 'output_filename' is required")
		return
	}

	// Получение файлов через сервис
	filesContent, err := h.fileService.GetFiles(request.FileIDs, request.FileRenames)
	if err != nil {
		sendError(w, http.StatusNotFound, "files not found", err.Error())
		return
	}

	// Объединяем файлы через сервис
	result := h.fileService.MergeFiles(filesContent)

	// Устанавливаем заголовки для скачивания файла
	w.Header().Set("Content-Type", "application/octet-stream")
	w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=\"%s\"", request.OutputFilename))
	w.WriteHeader(http.StatusOK)

	// Отправляем результат
	w.Write([]byte(result))
}
