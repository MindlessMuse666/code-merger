// Package service предоставляет сервисный слой для бизнес-логики приложения.
// Инкапсулирует логику обработки, валидации и преобразования файлов.
package service

import (
	"fmt"
	"strings"
	"time"

	"github.com/MindlessMuse666/code-merger/internal/config"
	"github.com/MindlessMuse666/code-merger/internal/storage"
)

// FileService предоставляет методы для работы с файлами
type FileService struct {
	cfg               *config.Config
	storage           storage.Storage
	encodingService   *EncodingService
	validationService *ValidationService
}

// FileContent представляет содержимое файла с именем
type FileContent struct {
	Filename string `json:"filename"`
	Content  string `json:"content"`
}

// NewFileService создает новый экземпляр FileService
func NewFileService(cfg *config.Config, storage storage.Storage) *FileService {
	return &FileService{
		cfg:               cfg,
		storage:           storage,
		encodingService:   NewEncodingService(),
		validationService: NewValidationService(),
	}
}

// ProcessFile обрабатывает загруженный файл
func (s *FileService) ProcessFile(filename string, content []byte) (string, error) {
	// Валидация файла
	if err := s.validationService.ValidateFile(filename, content, s.cfg.MaxFileSize); err != nil {
		return "", fmt.Errorf("file validation failed: %v", err)
	}

	// Конвертация в UTF-8
	utf8Content, err := s.encodingService.ConvertToUTF8(content)
	if err != nil {
		return "", fmt.Errorf("failed to convert file to UTF-8: %v", err)
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
		prefix := s.validationService.GetCommentPrefix(file.Filename)

		// Добавляем заголовок файла
		result.WriteString(s.formatFileHeader(prefix, file.Filename))

		// Добавляем содержимое файла
		result.WriteString(file.Content)

		// Добавляем разделитель между файлами (кроме последнего)
		if i < len(files)-1 {
			result.WriteString("\n\n\n")
		}
	}

	return result.String()
}

// formatFileHeader форматирует заголовок файла в соответствии с префиксом комментария
func (s *FileService) formatFileHeader(prefix, filename string) string {
	switch {
	case strings.Contains(prefix, "<!--"):
		return fmt.Sprintf("%s %s %s\n\n", prefix, filename, "-->")
	case strings.Contains(prefix, "/*"):
		return fmt.Sprintf("%s%s%s\n\n", prefix, filename, "*/")
	default:
		return fmt.Sprintf("%s %s\n\n", prefix, filename)
	}
}

// generateFileID генерирует уникальный ID для файла
func (s *FileService) generateFileID() string {
	return fmt.Sprintf("file_%d", time.Now().UnixNano())
}
