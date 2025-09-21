// Package utils предоставляет общие утилиты и константы для приложения.
package utils

// Поддерживаемые расширения файлов
var SupportedExtensions = map[string]bool{
	".md": true, ".txt": true, ".yaml": true, ".yml": true,
	".json": true, ".cpp": true, ".go": true, ".py": true,
	".html": true, ".css": true, ".js": true, ".sh": true,
}

// Префиксы комментариев для разных типов файлов
var CommentPrefixes = map[string]string{
	"dockerfile": "#",
	"makefile":   "#",
	".md":        "<!--",
	".html":      "<!--",
	".css":       "/*",
	".js":        "//",
	".go":        "//",
	".cpp":       "//",
	".java":      "//",
	".json":      "//",
}

// DefaultCommentPrefix префикс по умолчанию
const DefaultCommentPrefix = "#"
