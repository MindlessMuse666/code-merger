# Этап сборки
FROM golang:1.24.6-alpine AS builder

# Рабочая директория
WORKDIR /app

# Устанавливаем зависимости системы
RUN apk add --no-cache git

# Копируем файлы модулей Go
COPY backend/go.mod backend/go.sum ./
# Загружаем зависимости
RUN go mod download

# Копируем исходный код
COPY backend/ ./

# Собираем приложение
RUN CGO_ENABLED=0 GOOS=linux go build -o code-merger ./cmd/server

# Финальный этап
FROM alpine:latest

# Устанавливаем сертификаты для HTTPS
RUN apk --no-cache add ca-certificates

WORKDIR /root/

# Копируем собранный бинарник из этапа сборки
COPY --from=builder /app/code-merger .

# Создаем директорию для статических файлов
RUN mkdir -p static

# Открываем порт для веб-сервера
EXPOSE 8080

# Команда для запуска приложения
CMD ["./code-merger"]