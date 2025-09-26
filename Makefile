# Скрипт автоматизации команд сборки и запуска


# УПРАВЛЕНИЕ ПРИЛОЖЕНИЕМ

# Пересборка и запуск {run}
run:
	docker-compose down
	docker-compose build --no-cache
	docker-compose up
	@echo "💙 backend is available at: http://localhost:8080"
	@echo "🧡 frontend is available at: http://localhost:3001"

# Пересборка фронта и запуск
runfe:
	docker-compose down
	docker-compose build frontend --no-cache
	docker-compose up
	@echo "💙 backend is available at: http://localhost:8080"
	@echo "🧡 frontend is available at: http://localhost:3001"

# Остановка всех сервисов
stop:
	docker-compose down

# Полная очистка (контейнеры, тома, образы)
clean:
	docker-compose down -v --rmi local

# Проверка состояния контейнеров
status:
	docker-compose ps


# УПРАВЛЕНИЕ ЛОГАМИ

# Просмотр логов бэка
logs-be:
	docker-compose logs -f backend

# Просмотр логов фронта
logs-fe:
	docker-compose logs -f frontend