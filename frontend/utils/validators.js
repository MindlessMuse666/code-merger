/**
 * Модуль для валидации файлов
 * @module Validators
 */

// Поддерживаемые расширения файлов
const SUPPORTED_EXTENSIONS = {
    '.md': true, '.txt': true, '.yaml': true, '.yml': true, '.json': true,
    '.cpp': true, '.go': true, '.py': true, '.html': true, '.css': true,
    '.js': true, '.sh': true
};

// Максимальный размер файла (10 МБ)
const MAX_FILE_SIZE = 10 * 1024 * 1024;

/**
 * Проверяет, поддерживается ли расширение файла
 * @param {string} filename - Имя файла для проверки
 * @returns {boolean} True если расширение поддерживается
 */
export function isSupportedExtension(filename) {
    if (!filename) return false;

    const lower = filename.toLowerCase();

    if (lower === 'dockerfile' || lower === 'makefile') return true;
    if (lower.includes('docker-compose')) return true;

    const idx = filename.lastIndexOf('.');

    if (idx === -1) return false;

    const ext = filename.substring(idx).toLowerCase();

    return !!SUPPORTED_EXTENSIONS[ext];
}

/**
 * Проверяет, не превышает ли файл максимальный размер
 * @param {File} file - Файл для проверки
 * @returns {boolean} True если размер файла допустим
 */
export function isWithinSizeLimit(file) {
    return file.size <= MAX_FILE_SIZE;
}

/**
 * Проверяет файл на соответствие требованиям
 * @param {File} file - Файл для проверки
 * @returns {boolean} True если файл валиден
 */
export function validateFile(file) {
    if (!file || !file.name) {
        console.warn('Invalid file object:', file);
        return false;
    }

    return isSupportedExtension(file.name) && isWithinSizeLimit(file);
}

/**
 * Получает читаемое представление размера файла
 * @param {number} bytes - Размер в байтах
 * @returns {string} Человеко-читаемый размер файла
 */
export function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Получает иконку для типа файла
 * @param {string} filename - Имя файла
 * @returns {string} Название иконки или класс
 */
export function getFileIcon(filename) {
    if (!filename) return 'file';

    const lower = filename.toLowerCase();
    if (lower === 'dockerfile' || lower.includes('docker-compose')) return 'box';
    if (lower === 'makefile') return 'terminal';

    const idx = filename.lastIndexOf('.');
    const ext = idx === -1 ? '' : filename.substring(idx);
    const iconMap = {
        '.md': 'file-text', '.txt': 'file-text', '.yaml': 'file-code', '.yml': 'file-code', '.json': 'file-code',
        '.cpp': 'file-code', '.go': 'file-code', '.py': 'file-code', '.html': 'file-code', '.css': 'file-code',
        '.js': 'file-code', '.sh': 'terminal'
    };

    return iconMap[ext] || 'file';
}
