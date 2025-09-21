// Package app предоставляет точку входу для приложения
// Содержит основную логику инициализации и запуска приложения
package app

import (
	"time"

	"github.com/MindlessMuse666/code-merger/internal/config"
	"github.com/MindlessMuse666/code-merger/internal/server"
	"github.com/MindlessMuse666/code-merger/internal/storage"
)

// Run инициализирует и запускает приложение
func Run() error {
	// Загрузка конфига
	cfg, err := config.Load()
	if err != nil {
		return err
	}

	// Создание хранилища
	storage := storage.NewMemoryStorage()

	// Запуск отчистки хранилища
	go func() {
		ticker := time.NewTicker(cfg.CleanupInterval)
		defer ticker.Stop()

		for range ticker.C {
			// Удаление файлов, которые старше заданного в конфиге времени
			storage.Cleanup(cfg.FileTTL)
		}
	}()

	// Создание сервера
	srv := server.NewServer(cfg)
	return srv.Run()
}
