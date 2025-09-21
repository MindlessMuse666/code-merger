// Package handler объединяет утилиты для HTTP-обработчиков.
package handler

import (
	"encoding/json"
	"net/http"
	"path/filepath"
	"strings"

	"github.com/MindlessMuse666/code-merger/internal/utils"
)

// ErrorResponse представляет структуру ошибки API
type ErrorResponse struct {
	Error   string `json:"error"`
	Details string `json:"details,omitempty"`
}

// sendError отправляет ошибку в формате JSON
func sendError(w http.ResponseWriter, statusCode int, errorMsg, details string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	json.NewEncoder(w).Encode(ErrorResponse{
		Error:   errorMsg,
		Details: details,
	})
}

// isValidExtension проверяет поддержку расширения файла
func isValidExtension(filename string) bool {
	ext := strings.ToLower(filepath.Ext(filename))
	if ext == "" {
		base := strings.ToLower(filepath.Base(filename))
		return base == "dockerfile" || base == "makefile"
	}

	return utils.SupportedExtensions[ext]
}
