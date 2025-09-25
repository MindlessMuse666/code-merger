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
        maxPreviewChars: 500,
        maxFileSize: 10 * 1024 * 1024,
        supportedExtensions: ['.md', '.txt', '.yaml', '.yml', '.json', '.cpp', '.go', '.py', '.html', '.css', '.js', '.sh']
    },
    TEXTS: {
        appName: 'Code Merger',
        appDescription: 'Объедините ваши кодовые файлы'
    }
};

export const UI_CONFIG = {
    ANIMATIONS: { duration: 300, easing: 'cubic-bezier(0.4, 0, 0.2, 1)' },
    LAYOUT: { maxWidth: '1024px', dropZoneWidth: '672px' }
};

/**
 * Выбирает иконки для файла по его расширению
 * @param {string} filename - расширение файла
 * @returns {string} emoji (иконка)
 */
export const getFileIcon = (filename) => {
    if (!filename || typeof filename !== 'string') return '📁';
    const lower = filename.toLowerCase();

    // Специальные имена
    if (lower === 'dockerfile' || lower.endsWith('/dockerfile')) return '🐳';
    if (lower.includes('docker-compose') || lower.includes('docker-compose.yml') || lower.includes('docker-compose.yaml')) return '🐳';
    if (lower === 'makefile') return '🔨';

    // Ищем расширение
    const lastDot = filename.lastIndexOf('.');
    const ext = lastDot === -1 ? '' : filename.substring(lastDot).toLowerCase();

    const iconMap = {
        '.md': '📝', '.txt': '📄', '.yaml': '⚙️', '.yml': '⚙️', '.json': '🔧',
        '.cpp': '💻', '.go': '🐹', '.py': '🐍', '.html': '🌐', '.css': '🎨',
        '.js': '📜', '.sh': '💻'
    };

    return iconMap[ext] || '📁';
};

export const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};
