// Package app предоставляет точку входу для приложения
// Содержит основную логику инициализации и запуска приложения
package app

import (
	"github.com/MindlessMuse666/code-merger/cmd/server"
	"github.com/MindlessMuse666/code-merger/internal/config"
)

// Run инициализирует и запускает приложение
// Загружает конфиг, создает сервер и запускает его
// Возвращает ошибку, если не удалось загрузить конфиг или запустить сервер
func Run() error {
	cfg, err := config.Load()
	if err != nil {
		return err
	}

	srv := server.NewServer(cfg)
	return srv.Run()
}
