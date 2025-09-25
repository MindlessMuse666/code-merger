/**
 * Компонент карточки файла
 * Отображает информацию о файле и предоставляет элементы управления
 * @class FileCard
 */

import { CONFIG, getFileIcon, formatFileSize } from '../config.js';
import Notification from './Notification.js';

class FileCard {
    /**
     * Создает экземпляр карточки файла
     * @param {Object} config - Конфигурация карточки
     * @param {string} config.fileId - Уникальный идентификатор файла
     * @param {string} config.fileName - Отображаемое имя файла
     * @param {string} config.fileSize - Размер файла
     * @param {string} config.originalName - Оригинальное имя файла
     * @param {Function} config.onRename - Колбэк для переименования
     * @param {Function} config.onRemove - Колбэк для удаления
     * @param {Function} config.onPreview - Колбэк для предпросмотра
     */
    constructor({ fileId, fileName, originalName, fileSize, onRename, onRemove, onPreview }) {
        this.fileId = fileId;
        this.fileName = fileName;
        this.originalName = originalName;
        this.fileSize = fileSize;
        this.onRename = onRename;
        this.onRemove = onRemove;
        this.onPreview = onPreview;
        this.isEditing = false;
        this.isPreviewExpanded = false;
        this.previewContent = '';
    }

    /**
     * Рендерит карточку файла
     * @returns {HTMLElement} DOM-элемент карточки
     */
    render() {
        const card = document.createElement('div');
        card.className = 'file-card p-4 smooth-transition cursor-move';
        card.dataset.fileId = this.fileId;

        card.innerHTML = `
            <div class="flex items-center justify-between">
                <div class="flex items-center space-x-4 flex-1 min-w-0">
                    <div class="text-3xl">${getFileIcon(this.fileName)}</div>
                    <div class="flex-1 min-w-0">
                        <div class="file-name text-lg font-semibold text-gray-900 truncate">${this.fileName}</div>
                        <div class="file-info flex items-center space-x-3 text-sm text-gray-600 mt-1">
                            <span class="bg-primary bg-opacity-20 px-2 py-1 rounded-full">${this.originalName}</span>
                            <span class="bg-secondary bg-opacity-20 px-2 py-1 rounded-full">${formatFileSize(this.fileSize)}</span>
                        </div>
                    </div>
                </div>
                <div class="file-actions flex items-center space-x-2">
                    <button class="preview-btn" title="Предпросмотр">
                        <span class="text-lg">👁️</span>
                    </button>
                    <button class="rename-btn" title="Переименовать">
                        <span class="text-lg">✏️</span>
                    </button>
                    <button class="remove-btn" title="Удалить">
                        <span class="text-lg">🗑️</span>
                    </button>
                </div>
            </div>
            
            <!-- Область предпросмотра -->
            <div class="preview-area hidden mt-4 smooth-transition">
                <div class="border-t pt-4">
                    <div class="preview-content text-sm text-gray-600 bg-gray-50 rounded-lg p-4 
                            max-h-40 overflow-y-auto font-mono text-left"></div>
                    <button class="load-preview-btn mt-3 px-4 py-2 bg-primary text-white 
                                rounded-lg hover:bg-primary-dark smooth-transition">
                        📖 Загрузить предпросмотр
                    </button>
                </div>
            </div>
            
            <!-- Редактирование имени -->
            <div class="edit-area hidden mt-4 smooth-transition">
                <div class="flex gap-2">
                    <input type="text" 
                        class="flex-1 px-3 py-2 border-2 border-primary rounded-lg 
                                focus:outline-none focus:ring-2 focus:ring-primary"
                        value="${this.fileName}">
                    <button class="save-edit-btn px-4 py-2 bg-success text-white rounded-lg 
                                hover:bg-opacity-90 smooth-transition">💾</button>
                    <button class="cancel-edit-btn px-4 py-2 bg-error text-white rounded-lg 
                                hover:bg-opacity-90 smooth-transition">✕</button>
                </div>
            </div>
        `;

        this.attachEventHandlers(card);
        return card;
    }

    /**
     * Возвращает иконку для типа файла
     * @returns {string} SVG иконка
     * @private
     */
    getFileIcon() {
        return `
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
            </svg>
        `;
    }

    /**
     * Назначает обработчики событий для карточки
     * @param {HTMLElement} card - DOM-элемент карточки
     * @private
     */
    attachEventHandlers(card) {
        // Предпросмотр
        card.querySelector('.preview-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            this.togglePreview(card);
        });

        // Переименование
        card.querySelector('.rename-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            this.startEditing(card);
        });

        // Удаление
        card.querySelector('.remove-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            this.onRemove();
        });

        // Загрузка предпросмотра
        card.querySelector('.load-preview-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            this.loadPreviewContent(card);
        });

        // Сохранение редактирования
        card.querySelector('.save-edit-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            this.finishEditing(card, true);
        });

        // Отмена редактирования
        card.querySelector('.cancel-edit-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            this.finishEditing(card, false);
        });

        // Enter/Escape при редактировании
        const input = card.querySelector('input');
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.finishEditing(card, true);
            } else if (e.key === 'Escape') {
                this.finishEditing(card, false);
            }
        });
    }

    togglePreview(card) {
        const previewArea = card.querySelector('.preview-area');
        const isHidden = previewArea.classList.contains('hidden');
        
        if (isHidden) {
            previewArea.classList.remove('hidden');
            this.isPreviewExpanded = true;
            // Автоматически загружаем предпросмотр при первом открытии
            if (!this.previewContent) {
                this.loadPreviewContent(card);
            }
        } else {
            previewArea.classList.add('hidden');
            this.isPreviewExpanded = false;
        }
    }

    async loadPreviewContent(card) {
        const contentElement = card.querySelector('.preview-content');
        const loadBtn = card.querySelector('.load-preview-btn');
        
        loadBtn.textContent = 'Загрузка...';
        loadBtn.disabled = true;

        try {
            // Здесь будет вызов API для получения содержимого файла
            // Пока используем заглушку
            this.previewContent = "Содержимое файла будет загружено здесь...";
            
            const preview = this.previewContent.length > CONFIG.LIMITS.maxPreviewChars
                ? this.previewContent.substring(0, CONFIG.LIMITS.maxPreviewChars) + '...'
                : this.previewContent;
                
            contentElement.textContent = preview;
            loadBtn.style.display = 'none';
            
        } catch (error) {
            Notification.show('Ошибка загрузки предпросмотра', 'error');
            console.error('Preview load error:', error);
        }
    }

    startEditing(card) {
        this.isEditing = true;
        card.querySelector('.edit-area').classList.remove('hidden');
        card.querySelector('input').select();
    }

    finishEditing(card, save = true) {
        this.isEditing = false;
        card.querySelector('.edit-area').classList.add('hidden');
        
        if (save) {
            const newName = card.querySelector('input').value.trim();
            if (newName && newName !== this.fileName) {
                this.fileName = newName;
                card.querySelector('.file-name').textContent = newName;
                this.onRename(newName);
                Notification.show('Файл переименован', 'success');
            }
        } else {
            // Восстанавливаем оригинальное имя
            card.querySelector('input').value = this.fileName;
        }
    }
}

export default FileCard;
