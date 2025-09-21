/**
 * Модуль для работы с API бэкенда
 * @module API
 */

// Базовый URL API определяется в зависимости от окружения
const API_BASE_URL = window.location.hostname === 'localhost'
    ? 'http://localhost:8080/api'
    : '/api';

/**
 * Загружает файлы на сервер
 * @param {File[]} files - Массив файлов для загрузки
 * @returns {Promise<Array>} Результаты загрузки с fileId для каждого файла
 * @throws {Error} Если загрузка не удалась
 */
export async function uploadFiles(files) {
    const formData = new FormData();

    files.forEach(file => {
        formData.append('files', file);
    });

    try {
        const response = await fetch(`${API_BASE_URL}/upload`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.details || 'Ошибка загрузки файлов');
        }

        return await response.json();
    } catch (error) {
        console.error('Upload error:', error);
        throw new Error('Не удалось загрузить файлы. Проверьте подключение к серверу.');
    }
}

/**
 * Объединяет файлы на сервере
 * @param {Object} mergeData - Данные для объединения
 * @param {string[]} mergeData.file_ids - Массив идентификаторов файлов
 * @param {string} mergeData.output_filename - Имя выходного файла
 * @param {Object} mergeData.file_renames - Объект переименований
 * @returns {Promise<Blob>} Объединенный файл в виде Blob
 * @throws {Error} Если объединение не удалось
 */
export async function mergeFiles({ file_ids, output_filename, file_renames = {} }) {
    try {
        const response = await fetch(`${API_BASE_URL}/merge`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                file_ids,
                output_filename,
                file_renames
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.details || 'Ошибка объединения файлов');
        }

        return await response.blob();
    } catch (error) {
        console.error('Merge error:', error);
        throw new Error('Не удалось объединить файлы. Проверьте подключение к серверу.');
    }
}

/**
 * Получает содержимое файла для предпросмотра
 * @param {string} fileId - Идентификатор файла
 * @returns {Promise<string>} Содержимое файла
 * @throws {Error} Если получение не удалось
 */
export async function getFileContent(fileId) {
    try {
        const response = await fetch(`${API_BASE_URL}/file/${fileId}`);
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.details || 'Ошибка получения содержимого файла');
        }

        return await response.text();
    } catch (error) {
        console.error('Get file content error:', error);
        throw new Error('Не удалось получить содержимое файла. Проверьте подключение к серверу.');
    }
}