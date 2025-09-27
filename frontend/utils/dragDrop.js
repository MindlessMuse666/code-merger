/**
 * Модуль для обработки drag-and-drop функциональности
 * @module DragDrop
 */

import { activateDashedBorderAnimation, deactivateDashedBorderAnimation } from './animations.js';

/**
 * Настраивает drag-and-drop зону для загрузки файлов
 * @param {Object} config - Конфигурация drag-and-drop
 * @param {HTMLElement} config.dropZone - DOM-элемент зоны перетаскивания
 * @param {Function} config.onDrop - Колбэк при успешном перетаскивании файлов
 */
export function setupDragAndDrop({ dropZone, onDrop }) {
    if (!dropZone) return;

    /**
     * Обрабатывает событие перетаскивания над зоной
     * @param {DragEvent} e - Событие перетаскивания
     * @private
     */
    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.add('drag-over');
    };

    /**
     * Обрабатывает событие выхода перетаскивания из зоны
     * @param {DragEvent} e - Событие перетаскивания
     * @private
     */
    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!dropZone.contains(e.relatedTarget)) {
            dropZone.classList.remove('drag-over');
        }
    };

    /**
     * Обрабатывает событие отпускания файлов в зоне
     * @param {DragEvent} e - Событие перетаскивания
     * @private
     */
    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.remove('drag-over');

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            onDrop(files);
        }
    };

    // Обработчики событий
    dropZone.addEventListener('dragover', handleDragOver);
    dropZone.addEventListener('dragleave', handleDragLeave);
    dropZone.addEventListener('drop', handleDrop);
}
