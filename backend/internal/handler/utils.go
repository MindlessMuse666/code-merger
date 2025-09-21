// Package handler объединяет утилиты (структуры и функции) для HTTP-обработчиков
package handler

import (
	"encoding/json"
	"net/http"
	"path/filepath"
	"strings"
	"unicode"

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

// getCommentPrefix возвращает префикс комментария для указанного расширения файла
func getCommentPrefix(filename string) string {
	ext := strings.ToLower(filepath.Ext(filename))
	base := strings.ToLower(filepath.Base(filename))

	switch {
	case base == "dockerfile" || base == "makefile":
		return "#"
	case ext == ".md" || ext == ".html":
		return "<!--"
	case ext == ".css":
		return "/*"
	case ext == ".js" || ext == ".go" || ext == ".cpp" || ext == ".java" || ext == ".json":
		return "//"
	default:
		return "#"
	}
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

// isTextContent валидирует, что содержимое является текстовым
func isTextContent(content string) bool {
	for _, r := range content {
		// Разрешаем печатные символы, пробелы и управляющие символы
		if !unicode.IsPrint(r) && !unicode.IsSpace(r) && r != '\t' && r != '\n' && r != '\r' {
			return false
		}
	}
	return true
}
