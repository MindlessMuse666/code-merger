#!/bin/bash

# Скрипт установки и настройки Tailwind CSS

# Устанавливаем Tailwind CSS и его зависимости
npm install -D tailwindcss postcss autoprefixer

# Инициализируем конфиг Tailwind
npx tailwindcss init -p

# Создаем основной CSS-файл
cat > frontend/input.css << 'EOL'
@tailwind base;
@tailwind components;
@tailwind utilities;
EOL

# Обновляем конфиг Tailwind
cat > frontend/tailwind.config.js << 'EOL'
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./*.html", "./js/*.js"],
  theme: {
    extend: {
      colors: {
        // Наша цветовая палитра
        'blue-light': '#a2d2ff',
        'blue-lighter': '#bee2ff',
        'pink': '#faaac7',
        'pink-light': '#ffc8dd',
        'purple': '#cdb4db',
      }
    },
  },
  plugins: [],
}
EOL

echo "Tailwind CSS установлен и настроен!"