# code-merger backend specification

![Go](https://img.shields.io/badge/go-%2300ADD8.svg?style=for-the-badge&logo=go&logoColor=white) ![Docker](https://img.shields.io/badge/docker-%230db7ed.svg?style=for-the-badge&logo=docker&logoColor=white) ![openapi initiative](https://img.shields.io/badge/openapiinitiative-%23000000.svg?style=for-the-badge&logo=openapiinitiative&logoColor=white)

Go-сервис для объединения текстовых файлов.

## 1. Архитектура проекта

```md
📁backend
└── 📁cmd
    └── 📁server     # Точка входа приложения
└── 📁internal       # Внутренние пакеты
    └── 📁app        # Логика инициализации приложения
    └── 📁config     # Конфиг приложения
    └── 📁handler    # HTTP-обработчики
    └── 📁service    # Бизнес-логика
    └── 📁server     # HTTP-сервер
└── 📁pkg            # Публичные пакеты
├── go.mod
├── go.sum
└── README.md
```

## 2. Инструкция по запуску

```bash
# Установка зависимостей
go mod download

# Запуск приложения
go run cmd/server/main.go
```

> В дальнейшнем запуск будет осуществляться через `docker-compose.yml`

## 3. API Endpoints

| Метод | Endpoint | Описание | Полная документация |
|-------|----------|----------| ------------------- |
| POST | `/api/upload` | Загрузка файлов для обработки | [upload-api.md](./api/upload-api.md) |
| POST | `/api/merge` | Объединение загруженных файлов | [merge-api.md](./api/merge-api.md) |

> В дальнейшнем будет добавлена спецификация `docker-compose.yml`
