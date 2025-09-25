/**
 * Конфигурация приложения
 * @module Config
 */

export const CONFIG = {
    // Цветовая палитра проекта
    COLORS: {
        primary: '#cdb4db',
        primaryDark: '#b399cc',
        secondary: '#a2d2ff',
        secondaryLight: '#bee2ff',
        accent: '#faaac7',
        accentLight: '#ffc8dd',
        text: '#000000',
        background: '#ffffff',
        error: '#ef4444',
        success: '#10b981',
        warning: '#f59e0b'
    },

    // Анимации
    ANIMATIONS: {
        duration: {
            fast: 150,
            normal: 300,
            slow: 500
        },
        easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
    },

    // Ограничения
    LIMITS: {
        maxPreviewChars: 500,
        maxFileSize: 10 * 1024 * 1024, // 10MB
        supportedExtensions: ['.md', '.txt', '.yaml', '.yml', '.json', '.cpp', '.go', '.py', '.html', '.css', '.js', '.sh']
    },

    // Тексты
    TEXTS: {
        appName: 'Code Merger',
        appDescription: 'Объедините ваши кодовые файлы',
        dropZone: {
            title: 'Перетащите файлы сюда',
            subtitle: 'или нажмите для выбора файлов',
            supported: 'Поддерживаются: .md, .txt, .yaml, .yml, .json, .cpp, .go, .py, .html, .css, .js'
        }
    }
};

export const UI_CONFIG = {
    ANIMATIONS: {
        duration: 300,
        easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
    },
    LAYOUT: {
        maxWidth: '1024px',
        dropZoneWidth: '672px'
    }
};

// Утилиты для работы с конфигом
export const getFileIcon = (filename) => {
    const extension = filename.toLowerCase().substring(filename.lastIndexOf('.'));
    const iconMap = {
        '.md': '📝', '.txt': '📄', '.yaml': '⚙️', '.yml': '⚙️', '.json': '🔧',
        '.cpp': '💻', '.go': '🐹', '.py': '🐍', '.html': '🌐', '.css': '🎨',
        '.js': '📜', '.sh': '💻', 'dockerfile': '🐳', 'makefile': '🔨'
    };

    if (filename.toLowerCase() === 'dockerfile') return iconMap.dockerfile;
    if (filename.toLowerCase() === 'makefile') return iconMap.makefile;

    return iconMap[extension] || '📁';
};

export const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};