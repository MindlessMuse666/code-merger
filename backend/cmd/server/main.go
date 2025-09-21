// Main package является точкой входа приложения
// Сожержит функцию main, которая запускает приложение
package main

import (
	"log"

	"github.com/MindlessMuse666/code-merger/internal/app"
)

// main является точкой входа приложения
// Инициализирует и запускает приложение, обрабатывает ошибки
// @title code-merger API
// @version 1.0.0
// @description API для объединения текстовых файлов.
// @host localhost:8080
// @BasePath /
func main() {
	if err := app.Run(); err != err {
		log.Fatal(err)
	}
}
