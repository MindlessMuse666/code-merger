/**
 * Модуль для обработки drag-and-drop функциональности
 * @module DragDrop
 */

/**
 * Настраивает drag-and-drop зону для загрузки файлов
 * @param {Object} config - Конфигурация drag-and-drop
 * @param {HTMLElement} config.dropZone - DOM-элемент зоны перетаскивания
 * @param {Function} config.onDrop - Колбэк при успешном перетаскивании файлов
 */
export function setupDragAndDrop({ dropZone, onDrop }) {
    if (!dropZone) {
        console.error('Drop zone element not found');
        return;
    }

    /**
     * Обрабатывает событие перетаскивания над зоной
     * @param {DragEvent} e - Событие перетаскивания
     * @private
     */
    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.add('bg-blue-light', 'border-purple');
        dropZone.classList.remove('border-pink-light');
    };

    /**
     * Обрабатывает событие выхода перетаскивания из зоны
     * @param {DragEvent} e - Событие перетаскивания
     * @private
     */
    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.remove('bg-blue-light', 'border-purple');
        dropZone.classList.add('border-pink-light');
    };

    /**
     * Обрабатывает событие отпускания файлов в зоне
     * @param {DragEvent} e - Событие перетаскивания
     * @private
     */
    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();

        dropZone.classList.remove('bg-blue-light', 'border-purple');
        dropZone.classList.add('border-pink-light');

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            onDrop(files);
        }
    };

    // Назначаем обработчики событий
    dropZone.addEventListener('dragover', handleDragOver);
    dropZone.addEventListener('dragleave', handleDragLeave);
    dropZone.addEventListener('drop', handleDrop);

    // Обработчик клика по зоне для открытия диалога выбора файлов
    dropZone.addEventListener('click', () => {
        document.getElementById('fileInput').click();
    });

    // Визуальная обратная связь при наведении
    dropZone.addEventListener('mouseenter', () => {
        dropZone.classList.add('bg-blue-light');
    });

    dropZone.addEventListener('mouseleave', () => {
        if (!dropZone.classList.contains('border-purple')) {
            dropZone.classList.remove('bg-blue-light');
        }
    });
}

/**
 * Проверяет, являются ли перетаскиваемые элементы файлами
 * @param {DragEvent} e - Событие перетаскивания
 * @returns {boolean} True если перетаскиваются файлы
 */
export function isFileDrag(e) {
    if (!e.dataTransfer) return false;

    // Проверяем types на наличие файлов
    if (e.dataTransfer.types) {
        for (let i = 0; i < e.dataTransfer.types.length; i++) {
            if (e.dataTransfer.types[i] === 'Files') {
                return true;
            }
        }
    }

    return false;
}
