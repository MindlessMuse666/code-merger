/**
 * Конфигурация приложения
 * @module Config
 */

export const CONFIG = {
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
    ANIMATIONS: {
        duration: { fast: 150, normal: 300, slow: 500 },
        easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
    },
    LIMITS: {
        maxPreviewChars: 1024,
        maxFileSize: 10 * 1024 * 1024,
        supportedExtensions: [
            '.md', '.txt', '.yaml', '.yml', '.json', '.cpp', '.go', '.py', '.html', '.css', '.js', '.sh'
        ]
    },
    TEXTS: {
        appName: 'Code Merger',
        appDescription: 'Объедините ваши кодовые файлы'
    }
};

export const UI_CONFIG = {
    ANIMATIONS: { duration: 300, easing: 'cubic-bezier(0.4, 0, 0.2, 1)' },
    LAYOUT: { maxWidth: '1024px' }
};

/**
 * Определяет иконку по имени файла
 * @param {string} filename - Расширение файла
 * @returns {string} Иконка (Emoji)
 */
export const getFileIcon = (filename) => {
    if (!filename || typeof filename !== 'string') return '📁';
    const lower = filename.toLowerCase();

    if (lower === 'dockerfile' || lower.endsWith('/dockerfile')) return '🐳';
    if (lower.includes('docker-compose')) return '🐳';
    if (lower === 'makefile') return '🔨';

    const ext = (filename.lastIndexOf('.') !== -1)
        ? filename.substring(filename.lastIndexOf('.')).toLowerCase()
        : '';

    const iconMap = {
        '.md': '📝', '.txt': '📄', '.yaml': '⚙️', '.yml': '⚙️', '.json': '🔧',
        '.cpp': '💻', '.go': '🐹', '.py': '🐍', '.html': '🌐', '.css': '🎨',
        '.js': '📜', '.sh': '💻'
    };

    return iconMap[ext] || '📁';
};

/**
 * Форматирует размер файла в читаемый вид
 * @param {number} bytes - Размер файла в байтах
 * @returns {string} - Удобочитаемая строка с размером файла
 */
export const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};
