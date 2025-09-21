package storage

import (
	"sync"
	"time"
)

type FileData struct {
	Content  string
	Filename string
	UploadAt time.Time
}

type MemoryStorage struct {
	files sync.Map
}

func NewMemoryStorage() *MemoryStorage {
	return &MemoryStorage{}
}

func (s *MemoryStorage) Store(id string, data FileData) {
	s.files.Store(id, data)
}

func (s *MemoryStorage) Get(id string) (FileData, bool) {
	val, ok := s.files.Load(id)
	if !ok {
		return FileData{}, false
	}
	return val.(FileData), true
}

func (s *MemoryStorage) Delete(id string) {
	s.files.Delete(id)
}

func (s *MemoryStorage) Cleanup(maxAge time.Duration) {
	s.files.Range(func(key, value any) bool {
		if data, ok := value.(FileData); ok {
			if time.Since(data.UploadAt) > maxAge {
				s.files.Delete(key)
			}
		}
		return true
	})

}
