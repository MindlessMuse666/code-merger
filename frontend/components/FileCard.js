/**
 * Компонент карточки файла
 * @class FileCard
 */

import { CONFIG, getFileIcon, formatFileSize } from '../config.js';
import { getFileContent } from '../utils/api.js';
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
     * Подбирает адаптивную длину отображаемого имени в зависимости от ширины экрана
     * @returns {int} длина отображаемого имени файла
     * @private
     */
    computeMaxChars() {
        const w = window.innerWidth;
        if (w >= 1280) return 30;
        if (w >= 1024) return 26;
        if (w >= 768) return 20;
        return 12;
    }

    /**
     * Обрезает отображаемое имя файла так, чтобы всегда оставалась первая буква и расширение
     * @param {string} name - название файла
     * @param {number} maxChars - максимальное количество символов (включая точки и расширение)
     * @returns {string} сокращённое отображаемое имя
     * @private 
     */
    truncateFilename(name, maxChars) {
        const dot = name.lastIndexOf('.');
        const ext = dot === -1 ? '' : name.substring(dot);
        const base = dot === -1 ? name : name.substring(0, dot);

        if (base.length + ext.length <= maxChars) {
            return base + ext;
        }

        if (maxChars <= ext.length + 5) {
            return `${base[0]}....${ext}`;
        }

        const keep = Math.max(1, Math.floor((maxChars - ext.length - 5) / 2));
        const left = base.substring(0, keep + 1);
        const right = base.substring(base.length - keep);

        return `${left}....${right}${ext}`;
    }

    /**
     * Рендерит карточку файла
     * @returns {HTMLElement} DOM-элемент карточки
     */
    render() {
        const card = document.createElement('div');
        card.className = 'file-card smooth-transition cursor-move';
        card.dataset.fileId = this.fileId;

        const displayName = this.truncateFilename(this.fileName, this.computeMaxChars());
        const displayOriginal = this.truncateFilename(this.originalName, 12);
        const icon = getFileIcon(this.fileName);

        card.innerHTML = `
            <div class="flex items-start w-full gap-4">
                <!-- Иконка -->
                <div class="flex-shrink-0">
                    <div class="text-3xl w-12 h-12 flex items-center justify-center">${icon}</div>
                </div>

                <!-- Инфо -->
                <div class="flex-1 min-w-0">
                    <div class="file-name text-lg font-semibold text-gray-900" title="${this.fileName}">${displayName}</div>
                    <div class="file-info flex items-center space-x-3 text-xs text-gray-600 mt-2">
                        <span class="bg-primary bg-opacity-20 px-2 py-1 rounded-full"
                            title="${this.originalName}">${displayOriginal}</span>
                        <span class="bg-secondary bg-opacity-20 px-2 py-1 rounded-full">${formatFileSize(this.fileSize)}</span>
                    </div>

                    <!-- Предпросмотр -->
                    <div class="preview-area hidden mt-3 smooth-transition">
                        <div
                            class="preview-content text-sm text-gray-600 bg-gray-50 rounded-lg p-3 max-h-48 overflow-y-auto font-mono whitespace-pre">
                        </div>
                    </div>

                    <!-- Редактирование -->
                    <div class="edit-area hidden mt-3 smooth-transition">
                        <div class="flex gap-2 items-center">
                            <input type="text"
                                class="edit-input flex-1 px-3 py-2 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary hover:ring-2 hover:ring-primary"
                                value="${this.fileName}">
                            <button
                                class="save-edit-btn px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600">💾</button>
                            <button class="cancel-edit-btn px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600">↺</button>
                        </div>
                    </div>
                </div>

                <!-- Действия -->
                <div class="file-actions flex-shrink-0 flex flex-col items-end gap-2">
                    <div class="flex space-x-2">
                        <button class="preview-btn action-btn" title="Предпросмотр"><span class="text-lg">👁️</span></button>
                        <button class="rename-btn action-btn" title="Переименовать"><span class="text-lg">✏️</span></button>
                        <button class="remove-btn action-btn" title="Удалить"><span class="text-lg">🗑️</span></button>
                    </div>
                </div>
            </div>
        `;

        // Привязка обработчиков событий
        this.attachEventHandlers(card);
        return card;
    }


    /**
     * Назначает обработчики событий для карточки
     * @param {HTMLElement} card - DOM-элемент карточки
     * @private
     */
    attachEventHandlers(card) {
        const previewBtn = card.querySelector('.preview-btn');
        const previewArea = card.querySelector('.preview-area');
        const contentElement = card.querySelector('.preview-content');

        previewBtn.addEventListener('click', async () => {
            if (previewArea.classList.contains('hidden')) {
                previewArea.classList.remove('hidden');
                previewBtn.classList.add('ring-2', 'ring-primary');
                if (!this.previewContent) {
                    await this.loadPreviewContent(contentElement);
                }
            } else {
                previewArea.classList.add('hidden');
                previewBtn.classList.remove('ring-2', 'ring-primary');
            }
        });

        // Редактирование
        const renameBtn = card.querySelector('.rename-btn');
        const editArea = card.querySelector('.edit-area');
        const input = card.querySelector('.edit-input');
        const saveBtn = card.querySelector('.save-edit-btn');
        const cancelBtn = card.querySelector('.cancel-edit-btn');

        renameBtn.addEventListener('click', () => {
            editArea.classList.remove('hidden');
            input.focus();
            input.select();
        });

        saveBtn.addEventListener('click', () => {
            const newVal = input.value.trim();
            if (!newVal) return Notification.show('Имя не может быть пустым', 'warning');

            this.fileName = newVal;
            card.querySelector('.file-name').textContent =
                this.truncateFilename(this.fileName, this.computeMaxChars());
            editArea.classList.add('hidden');
            this.onRename(this.fileName);

            Notification.show('Файл переименован', 'success');
        });

        cancelBtn.addEventListener('click', () => {
            input.value = this.originalName;
            this.fileName = this.originalName;

            card.querySelector('.file-name').textContent =
                this.truncateFilename(this.fileName, this.computeMaxChars());
            editArea.classList.add('hidden');
            this.onRename(this.fileName);

            Notification.show('Имя восстановлено', 'info');
        });

        // Удаление
        card.querySelector('.remove-btn').addEventListener('click', () => this.onRemove());
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

    /**
     * Загружает содержимое файла для предпросмотра
     * @param {HTMLElement} card - DOM-элемент карточки
     * @private
     */
    async loadPreviewContent(contentElement) {
        try {
            const content = await getFileContent(this.fileId);
            const preview = content.length > CONFIG.LIMITS.maxPreviewChars
                ? content.substring(0, CONFIG.LIMITS.maxPreviewChars) + '\n\n... [содержимое обрезано]'
                : content;
            contentElement.textContent = preview || 'Содержимое файла пустое';
            this.previewContent = preview;
        } catch {
            contentElement.textContent = 'Ошибка загрузки содержимого файла';
        }
    }
}

export default FileCard;
