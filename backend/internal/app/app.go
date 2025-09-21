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
// Загружает конфиг, создает сервер и запускает его
// Возвращает ошибку, если не удалось загрузить конфиг или запустить сервер
func Run() error {
	// Загрузка конфига
	cfg, err := config.Load()
	if err != nil {
		return err
	}

	// Создание хранилища
	storage := storage.NewMemoryStorage()

	// Запуск отчистки хранилища каждые 5 минут
	go func() {
		ticker := time.NewTicker(5 * time.Minute)
		defer ticker.Stop()

		for range ticker.C {
			// Удаление файлов, которые старше 10 минут
			storage.Cleanup(10 * time.Minute)
		}
	}()

	// Создание сервера
	srv := server.NewServer(cfg, storage)
	return srv.Run()
}
