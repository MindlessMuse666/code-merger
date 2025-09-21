/** @type {import('tailwindcss').Config} */
export const content = ["./*.html", "./js/**/*.js"];
export const theme = {
    extend: {
        colors: {
            // Кастомная цветовая палитра из требований
            'blue-light': '#a2d2ff',
            'blue-lighter': '#bee2ff',
            'pink': '#faaac7',
            'pink-light': '#ffc8dd',
            'purple': '#cdb4db',
            'purple-dark': '#b399cc',
        },
        animation: {
            'spin-slow': 'spin 2s linear infinite',
        }
    },
};
export const plugins = [];
