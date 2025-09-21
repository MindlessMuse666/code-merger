// Package service предоставляет сервисный слой для бизнес-логики приложения.
// Содержит методы для обработки файлов, их конвертации, валидации и объединения.
package service

import (
	"bytes"
	"fmt"
	"io"
	"path/filepath"
	"strings"
	"time"
	"unicode"
	"unicode/utf8"

	"github.com/MindlessMuse666/code-merger/internal/config"
	"github.com/MindlessMuse666/code-merger/internal/storage"
	"github.com/MindlessMuse666/code-merger/internal/utils"
	"golang.org/x/text/encoding/charmap"
	"golang.org/x/text/transform"
)

// FileService предоставляет методы для работы с файлами
type FileService struct {
	cfg     *config.Config
	storage storage.Storage
}

// FileContent представляет содержимое файла с именем
type FileContent struct {
	Filename string `json:"filename"`
	Content  string `json:"content"`
}

// NewFileService создает новый экземпляр FileService
func NewFileService(cfg *config.Config, storage storage.Storage) *FileService {
	return &FileService{
		cfg:     cfg,
		storage: storage,
	}
}

// ProcessFile обрабатывает загруженный файл
func (s *FileService) ProcessFile(filename string, content []byte) (string, error) {
	// Конвертация в UTF-8
	utf8Content, err := s.convertToUTF8(content)
	if err != nil {
		return "", fmt.Errorf("failed to convert file to UTF-8: %v", err)
	}

	// Валидация текстового содержимого
	if !s.isTextContent(utf8Content) {
		return "", fmt.Errorf("file appears to be binary: %s", filename)
	}

	// Генерация ID файла
	fileID := s.generateFileID()

	// Сохранение в хранилище
	s.storage.Store(fileID, storage.FileData{
		Content:    utf8Content,
		Filename:   filename,
		UploadedAt: time.Now(),
		Size:       int64(len(utf8Content)),
	})

	return fileID, nil
}

// GetFiles возвращает файлы по их ID
func (s *FileService) GetFiles(fileIDs []string, renames map[string]string) ([]FileContent, error) {
	var files []FileContent

	for _, id := range fileIDs {
		fileData, exists := s.storage.Get(id)
		if !exists {
			return nil, fmt.Errorf("file not found: %s", id)
		}

		// Применяем переименование
		filename := fileData.Filename
		if newName, exists := renames[filename]; exists {
			filename = newName
		}

		files = append(files, FileContent{
			Filename: filename,
			Content:  fileData.Content,
		})
	}

	return files, nil
}

// MergeFiles объединяет файлы с соблюдением правил форматирования
func (s *FileService) MergeFiles(files []FileContent) string {
	var result strings.Builder

	for i, file := range files {
		// Получаем префикс комментария для файла
		prefix := s.getCommentPrefix(file.Filename)

		// Добавляем заголовок файла
		if strings.Contains(prefix, "<!--") {
			result.WriteString(fmt.Sprintf("%s %s %s\n\n", prefix, file.Filename, "-->"))
		} else if strings.Contains(prefix, "/*") {
			result.WriteString(fmt.Sprintf("%s%s%s\n\n", prefix, file.Filename, "*/"))
		} else {
			result.WriteString(fmt.Sprintf("%s %s\n\n", prefix, file.Filename))
		}

		// Добавляем содержимое файла
		result.WriteString(file.Content)

		// Добавляем разделитель между файлами (кроме последнего)
		if i < len(files)-1 {
			result.WriteString("\n\n\n")
		}
	}

	return result.String()
}

// convertToUTF8 конвертирует содержимое файла в UTF-8
func (s *FileService) convertToUTF8(content []byte) (string, error) {
	// Попробуем декодировать из common encodings
	encodings := map[string]transform.Transformer{
		"windows-1251": charmap.Windows1251.NewDecoder(),
		"ISO-8859-1":   charmap.ISO8859_1.NewDecoder(),
	}

	for _, decoder := range encodings {
		reader := transform.NewReader(bytes.NewReader(content), decoder)
		decoded, err := io.ReadAll(reader)
		if err == nil && s.isUTF8(decoded) {
			return string(decoded), nil
		}
	}

	// Если не удалось декодировать, проверяем UTF-8
	if s.isUTF8(content) {
		return string(content), nil
	}

	return "", fmt.Errorf("unable to convert to UTF-8")
}

// isUTF8 проверяет, является ли содержимое валидным UTF-8
func (s *FileService) isUTF8(content []byte) bool {
	return utf8.Valid(content)
}

// isTextContent валидирует, что содержимое является текстовым
func (s *FileService) isTextContent(content string) bool {
	for _, r := range content {
		// Разрешаем печатные символы, пробелы и управляющие символы
		if !unicode.IsPrint(r) && !unicode.IsSpace(r) && r != '\t' && r != '\n' && r != '\r' {
			return false
		}
	}
	return true
}

// getCommentPrefix возвращает префикс комментария для указанного файла
func (s *FileService) getCommentPrefix(filename string) string {
	ext := strings.ToLower(filepath.Ext(filename))
	base := strings.ToLower(filepath.Base(filename))

	// Проверяем специальные случаи (Dockerfile, Makefile)
	if base == "dockerfile" || base == "makefile" {
		return utils.CommentPrefixes[base]
	}

	// Проверяем расширение файла
	if prefix, exists := utils.CommentPrefixes[ext]; exists {
		return prefix
	}

	// Возвращаем префикс по умолчанию
	return utils.DefaultCommentPrefix
}

// generateFileID генерирует уникальный ID для файла
func (s *FileService) generateFileID() string {
	return fmt.Sprintf("file_%d", time.Now().UnixNano())
}
