// Package storage предоставляет реализацию in-memory хранилища данных
package storage

import (
	"sync"
	"time"
)

// MemoryStorage реализует Storage-интерфейс для хранения файлов в памяти
type MemoryStorage struct {
	files sync.Map
	mu    sync.RWMutex
}

// NewMemoryStorage создает новый экземпляр MemoryStorage
func NewMemoryStorage() *MemoryStorage {
	return &MemoryStorage{}
}

// Store сохраняет файл в хранилище
func (s *MemoryStorage) Store(id string, data FileData) {
	s.mu.Lock()
	defer s.mu.Unlock()

	s.files.Store(id, data)
}

// Get возвращает файл из хранилища по ID
func (s *MemoryStorage) Get(id string) (FileData, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	val, ok := s.files.Load(id)
	if !ok {
		return FileData{}, false
	}
	return val.(FileData), true
}

// Delete удаляет файл из хранилища
func (s *MemoryStorage) Delete(id string) {
	s.mu.Lock()
	defer s.mu.Unlock()

	s.files.Delete(id)
}

// Cleanup удаляет файлы, которые старше указанного возраста
func (s *MemoryStorage) Cleanup(maxAge time.Duration) {
	s.mu.Lock()
	defer s.mu.Unlock()

	s.files.Range(func(key, value any) bool {
		if data, ok := value.(FileData); ok {
			if time.Since(data.UploadedAt) > maxAge {
				s.files.Delete(key)
			}
		}
		return true
	})

}
