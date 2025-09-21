#!/bin/bash
echo "Проверка установки фронтенда..."
cd frontend

# Проверяем наличие node_modules
if [ ! -d "node_modules" ]; then
    echo "Установка зависимостей..."
    npm install
fi

# Проверяем наличие style.css
if [ ! -f "style.css" ]; then
    echo "Компиляция CSS..."
    npm run build
fi

echo "Фронтенд готов к работе!"
echo "Запустите: docker-compose up frontend-dev"