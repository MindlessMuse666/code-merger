// Package handler предоставляет HTTP-обработчики для API-endpoints
// Содержит логику обработки запросов загрузки и объединения файлов
package handler

import "github.com/MindlessMuse666/code-merger/internal/config"

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
