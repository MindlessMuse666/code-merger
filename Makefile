# Скрипт автоматизации команд сборки и запуска


# СБОРКА ПРИЛОЖЕНИЯ

build: build-backend build-frontend

# Сборка бэка
build-be:
	docker compose build backend

# Сборка фронта
build-fe:
	docker compose run --rm frontend-dev npm install


# ЗАПУСК ПРИЛОЖЕНИЯ (dev)

# Полный запуск (бэк + фронт)
run-dev:
	docker-compose up -d

# Запуск бэкенда
run-dev-be:
	docker-compose up -d backend

# Запуск фронтенда (hot-reload)
run-dev-ft:
	docker-compose up -d frontend-dev


# ПЕРЕЗАПУСК ПРИЛОЖЕНИЯ

# Пересборка и запуск
rebuild:
	docker-compose down
	docker-compose build
	docker-compose up -d

# Перезапуск бэкенда
restart-be:
	docker-compose restart backend

# Перезапуск фронтенда
restart-fe:
	docker-compose restart frontend-dev


# УПРАВЛЕНИЕ ПРИЛОЖЕНИЕМ

# Остановка приложения
stop:
	docker-compose down


# УПРАВЛЕНИЕ КОНТЕЙНЕРАМИ

# Проверка состояния контейнеров
status:
	docker-compose ps

# Полная очистка (контейнеры, тома, образы)
clean:
	docker-compose down -v --rmi local


# УПРАВЛЕНИЕ ЛОГАМИ

# Просмотр логов бэкенда
logs-be:
	docker-compose logs -f backend

# Просмотр логов фронтенда
logs-fe:
	docker-compose logs -f frontend-dev