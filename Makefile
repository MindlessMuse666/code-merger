# Скрипт автоматизации команд сборки и запуска

# Сборка всего проекта
build: build-backend build-frontend

# Сборка бэка
build-backend:
	docker compose build backend

# Сборка фронта (установка зависимостей)
build-frontend:
	docker compose run --rm frontend-dev npm install

# Запуск приложения
run:
	docker compose up -d backend

# Остановка приложения
stop:
	docker compose down

# Полная очистка (контейнеры, тома, образы)
clean:
	docker compose down -v --rmi local

# Запуск тестов бэка
test-backend:
	docker compose run --rm backend go test ./...

# Просмотр логов
logs:
	docker compose logs -f backend