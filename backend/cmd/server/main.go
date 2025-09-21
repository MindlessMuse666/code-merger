// Package main является точкой входа приложения.
package main

import (
	"log"

	"github.com/MindlessMuse666/code-merger/internal/app"
)

// main инициализирует и запускает приложение
// @title code-merger API
// @version 1.0.2
// @description Веб-сервис для объединения содержимого текстовых файлов в один файл с специальным форматированием.
// @contact.name MindlessMuse666
// @contact.email mindlessmuse.666@gmail.com
// @contact.url https://github.com/MindlessMuse666
// @host localhost:8080
// @BasePath /
// @schemes http
func main() {
	if err := app.Run(); err != err {
		log.Fatal(err)
	}
}
