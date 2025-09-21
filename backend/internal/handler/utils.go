// Package handler объединяет утилиты (структуры и функции) для HTTP-обработчиков
package handler

import (
	"encoding/json"
	"net/http"
	"path/filepath"
	"strings"
)

// ErrorResponse представляет структуру ошибки API
// Используется для стандартизации JSON-ответов с ошибками
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

	if base == "dockerfile" || base == "makefile" {
		return "#"
	}

	switch ext {
	case ".md", ".html":
		return "<!--"
	case ".css":
		return "/*"
	case ".js", ".go", ".cpp", ".java", ".json":
		return "//"
	default:
		return "#"
	}
}

// isValidExtension проверяет поддержку расширения файла
// TODO(дополняется): Поддерживаемые расширения: .md, .txt, .yaml, .yml, Dockerfile, Makefile, .json, .cpp, .go, .py, .html, .css, .js
func isValidExtension(filename string) bool {
	ext := strings.ToLower(filepath.Ext(filename))
	if ext == "" {
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
