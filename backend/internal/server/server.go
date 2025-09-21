// Package server предоставляет функциональность для создания и запуска HTTP-сервера
// Сервер использует Chi router с middleware для логирования, восстановления и CORS
package server

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	_ "github.com/MindlessMuse666/code-merger/docs"
	"github.com/MindlessMuse666/code-merger/internal/config"
	"github.com/MindlessMuse666/code-merger/internal/handler"
	"github.com/MindlessMuse666/code-merger/internal/storage"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	httpSwagger "github.com/swaggo/http-swagger"
)

// Server предоставляет HTTP-сервер приложения
type Server struct {
	cfg    *config.Config // Конфиг сервера
	router *chi.Mux       // HTTP-роутер
}

// NewServer создает новый экземпляр HTTP-сервера
// Принимает конфиг и возвращает сконфигурированный сервер
func NewServer(cfg *config.Config, storage *storage.MemoryStorage) *Server {
	r := chi.NewRouter()

	// Настройка middleware
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"*"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: false,
		MaxAge:           300,
	}))

	// Инициализация обработчиков
	uploadHandler := handler.NewUploadHandler(cfg, storage)
	mergeHandler := handler.NewMergeHandler(storage)

	// Маршрут для Swagger UI
	r.Mount("/swagger", httpSwagger.WrapHandler)

	// Регистрация маршрутов
	r.Post("/api/upload", uploadHandler.HandleUpload)
	r.Post("/api/merge", mergeHandler.HandleMerge)

	return &Server{
		cfg:    cfg,
		router: r,
	}
}

// Run запускает HTTP-сервер с поддержкой graceful shutdown
// Сервер будет обрабатывать запросы до получения сигнала завершения
// Возвращает ошибку в случае неудачного запуска или завершения
func (s *Server) Run() error {
	srv := &http.Server{
		Addr:         ":" + s.cfg.Port,
		Handler:      s.router,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 10 * time.Second,
	}

	stop := make(chan os.Signal, 1)
	signal.Notify(stop, os.Interrupt, syscall.SIGTERM)

	go func() {
		log.Printf("server started on port %s", s.cfg.Port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("ListenAndServe(): %v", err)
		}
	}()

	<-stop
	log.Println("shutting down server...")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := srv.Shutdown(ctx); err != nil {
		return fmt.Errorf("server shutdown failed: %v", err)
	}

	log.Println("server stopped")
	return nil
}
