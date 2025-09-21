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
dev:
	docker-compose up -d backend frontend-dev
	@echo "Бэкенд доступен по http://localhost:8080"
	@echo "Фронтенд с hot-reload доступен по http://localhost:3000"

# Запуск только бэка
be:
	docker-compose up -d backend
	@echo "Бэкенд доступен по http://localhost:8080"

# Запуск только фронтенда
fe:
	docker-compose up -d frontend-dev
	@echo "Фронтенд с hot-reload доступен по http://localhost:3000"


# ЗАПУСК ПРИЛОЖЕНИЯ (prod)

# Production сборка
prod-build:
	docker-compose build
	docker-compose run --rm frontend-dev npm run build

# Production запуск
prod:
	docker-compose up -d backend
	@echo "Production приложение доступно по http://localhost:8080"


# ПЕРЕЗАПУСК ПРИЛОЖЕНИЯ

# Пересборка и запуск
rebuild:
	docker-compose down
	docker-compose build
	docker-compose up -d

# Полная перезагрузка
restart:
	docker-compose down
	docker-compose up -d


# УПРАВЛЕНИЕ ПРИЛОЖЕНИЕМ

# Остановка всех сервисов
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

# Просмотр логов бэка
logs-be:
	docker-compose logs -f backend

# Просмотр логов фронта
logs-fe:
	docker-compose logs -f frontend-dev