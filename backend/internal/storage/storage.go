// Package storage предоставляет интефейсы и структуры данных для хранения файлов.
// Включает in-memory реализацию хранилища.
package storage

import "time"

// Storage определяет интерфейс для работы с хранилищем данных
type Storage interface {
	Store(id string, data FileData)
	Get(id string) (FileData, bool)
	Delete(id string)
	Cleanup(maxAge time.Duration)
}

// FileData представляет структуру данных файла
type FileData struct {
	Content    string    `json:"content"`     // Содержимое файла в UTF-8
	Filename   string    `json:"filename"`    // Оригинальное имя файла
	UploadedAt time.Time `json:"uploaded_at"` // Время загрузки файла
	Size       int64     `json:"size"`        // Размер файла в байтах
}
