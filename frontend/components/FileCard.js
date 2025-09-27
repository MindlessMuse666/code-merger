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
            <div class="d-flex align-items-start w-100 gap-3">
                <!-- Иконка -->
                <div class="flex-shrink-0">
                <div class="fs-2 w-50 h-50 d-flex align-items-center justify-content-center">${icon}</div>
                </div>

                <!-- Инфо -->
                <div class="flex-grow-1 min-w-0">
                <div class="file-name fw-bold text-dark" title="${this.fileName}">${displayName}</div>
                <div class="file-info d-flex align-items-center gap-2 text-muted small mt-2">
                    <span class="bg-primary bg-opacity-25 px-2 py-1 rounded-pill" title="${this.originalName}">${displayOriginal}</span>
                    <span class="bg-secondary bg-opacity-25 px-2 py-1 rounded-pill">${formatFileSize(this.fileSize)}</span>
                </div>

                <!-- Предпросмотр -->
                <div class="preview-area d-none mt-3">
                    <div class="preview-content small text-muted bg-light rounded p-3 max-h-200 overflow-auto font-monospace whitespace-pre"></div>
                </div>

                <!-- Редактирование -->
                <div class="edit-area d-none mt-3">
                    <div class="d-flex gap-2 align-items-center">
                    <input type="text" class="form-control flex-grow-1" value="${this.fileName}">
                    <button class="btn btn-success btn-sm">💾</button>
                    <button class="btn btn-danger btn-sm">↺</button>
                    </div>
                </div>
                </div>

                <!-- Действия -->
                <div class="flex-shrink-0 d-flex flex-column align-items-end gap-2">
                <div class="d-flex gap-2">
                    <button class="btn btn-outline-primary btn-sm preview-btn" title="Предпросмотр">👁️</button>
                    <button class="btn btn-outline-warning btn-sm rename-btn" title="Переименовать">✏️</button>
                    <button class="btn btn-outline-danger btn-sm remove-btn" title="Удалить">🗑️</button>
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
