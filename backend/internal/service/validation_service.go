// Package service предоставляет сервисный слой для бизнес-логики приложения.
// Содержит методы для валидации файлов.
package service

import (
	"fmt"
	"mime"
	"path/filepath"
	"strings"
	"unicode"

	"github.com/MindlessMuse666/code-merger/internal/utils"
)

// ValidationService предоставляет методы для валидации файлов
type ValidationService struct{}

// NewValidationService создает новый экземпляр ValidationService
func NewValidationService() *ValidationService {
	return &ValidationService{}
}

// ValidateFile проверяет файл на соответствие требованиям
func (s *ValidationService) ValidateFile(filename string, content []byte, maxSize int64) error {
	// Проверка размера файла
	if int64(len(content)) > maxSize {
		return fmt.Errorf("file size exceeds limit: %d bytes", len(content))
	}

	// Проверка расширения файла
	if !s.isValidExtension(filename) {
		return fmt.Errorf("unsupported file extension: %s", filepath.Ext(filename))
	}

	// Проверка MIME-типа (дополнительная проверка)
	if !s.isValidMimeType(filename, content) {
		return fmt.Errorf("file appears to be binary or unsupported type: %s", filename)
	}

	return nil
}

// isValidExtension проверяет поддержку расширения файла
func (s *ValidationService) isValidExtension(filename string) bool {
	ext := strings.ToLower(filepath.Ext(filename))
	if ext == "" {
		base := strings.ToLower(filepath.Base(filename))
		return base == "dockerfile" || base == "makefile"
	}

	return utils.SupportedExtensions[ext]
}

// isValidMimeType проверяет MIME-тип файла
func (s *ValidationService) isValidMimeType(filename string, content []byte) bool {
	// Определяем MIME-тип по расширению и содержимому
	extType := mime.TypeByExtension(filepath.Ext(filename))

	// Для текстовых файлов ожидаем text/plain или подобные
	if strings.HasPrefix(extType, "text/") {
		return s.isTextContent(string(content))
	}

	// Для файлов без явного MIME-типа проверяем содержимое
	return s.isTextContent(string(content))
}

// isTextContent валидирует, что содержимое является текстовым
func (s *ValidationService) isTextContent(content string) bool {
	// Разрешаем только печатные символы, пробелы и управляющие символы
	for _, r := range content {
		if !unicode.IsPrint(r) && !unicode.IsSpace(r) &&
			r != '\t' && r != '\n' && r != '\r' && r != '\f' {
			return false
		}
	}

	// Дополнительная проверка: не должно быть слишком много нулевых байтов
	if strings.Contains(content, "\x00") {
		return false
	}

	return true
}

// GetCommentPrefix возвращает префикс комментария для указанного файла
func (s *ValidationService) GetCommentPrefix(filename string) string {
	ext := strings.ToLower(filepath.Ext(filename))
	base := strings.ToLower(filepath.Base(filename))

	// Проверяем специальные случаи (Dockerfile, Makefile)
	if base == "dockerfile" || base == "makefile" {
		if prefix, exists := utils.CommentPrefixes[base]; exists {
			return prefix
		}
	}

	// Проверяем расширение файла
	if prefix, exists := utils.CommentPrefixes[ext]; exists {
		return prefix
	}

	// Возвращаем префикс по умолчанию
	return utils.DefaultCommentPrefix
}
