package config

import (
	"os"
	"strconv"
)

type Config struct {
	Port         string
	MaxFileSize  int64
	MaxTotalSize int64
}

// Загружает конфиг проекта
func Load() (*Config, error) {
	port := getEnv("PORT", "8080")
	maxFileSizeStr := getEnv("MAX_FILE_SIZE", "10485760")
	maxTotalSizeStr := getEnv("MAX_TOTAL_SIZE", "52428800")

	maxFileSize, err := strconv.ParseInt(maxFileSizeStr, 10, 64)
	if err != nil {
		return nil, err
	}

	maxTotalSize, err := strconv.ParseInt(maxTotalSizeStr, 10, 64)
	if err != nil {
		return nil, err
	}

	return &Config{
		Port:         port,
		MaxFileSize:  maxFileSize,
		MaxTotalSize: maxTotalSize,
	}, nil
}

func getEnv(key string, defaultValue string) string {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	return value
}
