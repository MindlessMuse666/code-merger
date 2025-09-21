# Этап сборки
FROM golang:1.24.6-alpine AS builder

# Рабочая директория
WORKDIR /app

# Установка зависимостей системы
RUN apk add --no-cache git
# Установка swag (инструмент для генерации swagger-docs)
RUN go install github.com/swaggo/swag/cmd/swag@latest

# Копирование файлов модулей Go
COPY backend/go.mod backend/go.sum ./
# Загрузка зависимостей
RUN go mod download

# Копирование исходного кода
COPY backend/ ./

# Генерация swagger-docs из аннотаций в коде
RUN swag init -g cmd/server/main.go --output ./docs

# Сборка приложения
RUN CGO_ENABLED=0 GOOS=linux go build -o code-merger ./cmd/server

# Финальный этап
FROM alpine:latest

# Установка HTTPS-сертификатов
RUN apk --no-cache add ca-certificates

WORKDIR /root/

# Копирование собранного бинарника из этапа сборки
COPY --from=builder /app/code-merger .
# Копирование сгенерированной Swagger-docs
COPY --from=builder /app/docs ./docs

# Создание директории для статических файлов
RUN mkdir -p static

# Копирование только собранных файлов фронта
COPY frontend/index.html frontend/style.css frontend/app.js ./static/
COPY frontend/utils/ ./static/utils/

# Открытие порта для веб-сервера
EXPOSE 8080

# Команда для запуска приложения
CMD ["./code-merger"]