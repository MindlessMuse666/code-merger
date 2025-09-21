// Package config предоставляет функциональность для работы с конфигом приложения.
// Конфиг загружается из переменных окружения с значениями по умолчанию.
package config

import (
	"os"
	"strconv"
	"time"
)

// Config содержит все настраиваемые параметры приложения
type Config struct {
	Port            string        `json:"port"`             // Порт сервера
	MaxFileSize     int64         `json:"max_file_size"`    // Максимальный размер файла в байтах
	MaxTotalSize    int64         `json:"max_total_size"`   // Максимальный общий размер в байтах
	FileTTL         time.Duration `json:"file_ttl"`         // Время жизни файлов в хранилище
	CleanupInterval time.Duration `json:"cleanup_interval"` // Интервал очистки хранилища
}

// Load загружает конфиг из переменных окружения
func Load() (*Config, error) {
	port := getEnv("PORT", "8080")
	maxFileSizeStr := getEnv("MAX_FILE_SIZE", "10485760")   // 10MB
	maxTotalSizeStr := getEnv("MAX_TOTAL_SIZE", "52428800") // 50MB
	fileTTLStr := getEnv("FILE_TTL", "600")                 // 10 минут в секундах
	cleanupIntervalStr := getEnv("CLEANUP_INTERVAL", "300") // 5 минут в секундах

	maxFileSize, err := strconv.ParseInt(maxFileSizeStr, 10, 64)
	if err != nil {
		return nil, err
	}

	maxTotalSize, err := strconv.ParseInt(maxTotalSizeStr, 10, 64)
	if err != nil {
		return nil, err
	}

	fileTTL, err := strconv.ParseInt(fileTTLStr, 10, 64)
	if err != nil {
		return nil, err
	}

	cleanupInterval, err := strconv.ParseInt(cleanupIntervalStr, 10, 64)
	if err != nil {
		return nil, err
	}

	return &Config{
		Port:            port,
		MaxFileSize:     maxFileSize,
		MaxTotalSize:    maxTotalSize,
		FileTTL:         time.Duration(fileTTL) * time.Second,
		CleanupInterval: time.Duration(cleanupInterval) * time.Second,
	}, nil
}

// getEnv возвращает значение переменной окружения или значение по умолчанию
func getEnv(key string, defaultValue string) string {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	return value
}
