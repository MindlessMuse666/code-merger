# Этап сборки
FROM golang:1.24.6-alpine AS builder

# Рабочая директория
WORKDIR /app

# Устанавливка зависимостей системы + swagger docs
RUN apk add --no-cache git
RUN go install github.com/swaggo/swag/cmd/swag@latest

# Копирование файлов модулей Go
COPY backend/go.mod backend/go.sum ./
# Загрузка зависимостей
RUN go mod download

# Копирование исходного кода
COPY backend/ ./

# Генерирация Swagger-документации из аннотаций в коде
RUN swag init -g cmd/server/main.go --output ./docs

# Сборка приложения
RUN CGO_ENABLED=0 GOOS=linux go build -o code-merger ./cmd/server

# Финальный этап
FROM alpine:latest

# Устанавливка HTTPS-сертификатов
RUN apk --no-cache add ca-certificates

WORKDIR /root/

# Копирование собранного бинарника из этапа сборки
COPY --from=builder /app/code-merger .
# Копирование сгенерированной Swagger-документации
COPY --from=builder /app/docs ./docs

# Создание директории для статических файлов
RUN mkdir -p static

# Открытие порта для веб-сервера
EXPOSE 8080

# Команда для запуска приложения
CMD ["./code-merger"]