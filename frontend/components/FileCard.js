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
     * Обрезает отображаемое имя файла
     * @param {str} name - название файла
     * @param {int} maxChars - максимальное количество символов
     * @returns {string} сокращенное отображаемое имя
     * @private 
     */
    truncateFilename(name, maxChars) {
        // Всегда сохраняем расширение (если есть)
        const dot = name.lastIndexOf('.');
        const ext = dot === -1 ? '' : name.substring(dot);
        const base = dot === -1 ? name : name.substring(0, dot);

        if (base.length <= maxChars) return base + ext;
        // Оставляем первый символ, немного середины и расширение
        const keep = Math.max(1, Math.floor((maxChars - 2) / 2));
        const left = base.substring(0, maxChars - (keep + 3));
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

        const maxChars = this.computeMaxChars();
        const displayName = this.truncateFilename(this.fileName, maxChars);
        const displayOriginal = this.truncateFilename(this.originalName, Math.max(8, Math.floor(maxChars / 1.5)));

        const icon = getFileIcon(this.fileName);

        card.innerHTML = `
            <div class="flex items-start w-full gap-4">
                <div class="flex-shrink-0">
                <div class="text-3xl w-12 h-12 rounded-md flex items-center justify-center bg-white shadow-sm border-2" style="border-color: rgba(205,180,219,0.5)">
                    ${icon}
                </div>
                </div>

                <div class="flex-1 min-w-0">
                <div class="file-name text-base font-semibold text-gray-900 filename-truncate" title="${this.fileName}">
                    ${displayName}
                </div>
                <div class="file-info flex items-center space-x-3 text-xs text-gray-600 mt-2">
                    <span class="bg-primary bg-opacity-20 px-2 py-1 rounded-full filename-truncate" title="${this.originalName}">
                    ${displayOriginal}
                    </span>
                    <span class="bg-secondary bg-opacity-20 px-2 py-1 rounded-full">
                    ${formatFileSize(this.fileSize)}
                    </span>
                </div>

                <div class="preview-area hidden mt-3 smooth-transition">
                    <div class="border-t pt-3">
                    <div class="preview-content text-sm text-gray-600 bg-gray-50 rounded-lg p-3 max-h-48 overflow-y-auto font-mono"></div>
                    <div class="mt-3 flex gap-2">
                        <button class="load-preview-btn px-3 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark smooth-transition">📖 Загрузить предпросмотр</button>
                        <button class="close-preview-btn px-3 py-2 bg-white border border-gray-200 rounded-lg hover:shadow-sm smooth-transition">Закрыть</button>
                    </div>
                    </div>
                </div>

                <div class="edit-area hidden mt-3 smooth-transition">
                    <div class="flex gap-2 items-center">
                    <input type="text" class="edit-input flex-1 px-3 py-2 border-2 rounded-lg focus:outline-none focus:ring-2" value="${this.fileName}">
                    <button class="save-edit-btn action-btn" title="Сохранить">💾</button>
                    <button class="cancel-edit-btn action-btn" title="Сбросить">↺</button>
                    </div>
                </div>
                </div>

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
        // Preview toggle
        const previewBtn = card.querySelector('.preview-btn');
        const previewArea = card.querySelector('.preview-area');
        const loadPreviewBtn = card.querySelector('.load-preview-btn');
        const closePreviewBtn = card.querySelector('.close-preview-btn');

        previewBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (previewArea.classList.contains('hidden')) {
                previewArea.classList.remove('hidden');
                // Автоматическая загрузка при первом открытии
                if (!this.previewContent) this.loadPreviewContent(card);
            } else {
                previewArea.classList.add('hidden');
            }
        });

        if (closePreviewBtn) {
            closePreviewBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                previewArea.classList.add('hidden');
            });
        }

        if (loadPreviewBtn) {
            loadPreviewBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.loadPreviewContent(card);
            });
        }

        // Rename
        const renameBtn = card.querySelector('.rename-btn');
        const editArea = card.querySelector('.edit-area');
        const input = card.querySelector('.edit-input');
        const saveBtn = card.querySelector('.save-edit-btn');
        const cancelBtn = card.querySelector('.cancel-edit-btn');

        renameBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            editArea.classList.remove('hidden');
            input.select();
        });

        const safeExt = (() => {
            const idx = this.fileName.lastIndexOf('.');
            return idx === -1 ? '' : this.fileName.substring(idx);
        })();

        saveBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const newValRaw = input.value.trim();
            if (!newValRaw) {
                Notification.show('Имя не может быть пустым', 'warning');
                return;
            }
            // Валидируем расширение: нельзя менять расширение
            const newExtIdx = newValRaw.lastIndexOf('.');
            const newExt = newExtIdx === -1 ? '' : newValRaw.substring(newExtIdx);
            let finalName = newValRaw;
            if (safeExt && newExt.toLowerCase() !== safeExt.toLowerCase()) {
                // если пользователь попытался поменять расширение — добавляем оригинальное
                finalName = newValRaw + safeExt;
                Notification.show('Расширение не может быть изменено, автоматически добавлено оригинальное.', 'info');
            }
            this.fileName = finalName;
            // Обновляем UI
            card.querySelector('.file-name').textContent = this.truncateFilename(this.fileName, this.computeMaxChars());
            card.querySelector('.edit-input').value = this.fileName;
            editArea.classList.add('hidden');
            this.onRename(this.fileName);
            Notification.show('Файл переименован', 'success');
        });

        cancelBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            // сброс к текущему имени (не к оригиналу); по задаче "к первоначальному названию" – вернём originalName
            input.value = this.originalName;
            this.fileName = this.originalName;
            card.querySelector('.file-name').textContent = this.truncateFilename(this.fileName, this.computeMaxChars());
            editArea.classList.add('hidden');
            this.onRename(this.fileName);
            Notification.show('Имя восстановлено', 'info');
        });

        // Remove
        const removeBtn = card.querySelector('.remove-btn');
        removeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.onRemove();
        });

        // Enter / Escape handling inside edit input
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') saveBtn.click();
            if (e.key === 'Escape') cancelBtn.click();
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

    /**
     * Загружает содержимое файла для предпросмотра
     * @param {HTMLElement} card - DOM-элемент карточки
     * @private
     */
    async loadPreviewContent(card) {
        const contentElement = card.querySelector('.preview-content');
        const loadBtn = card.querySelector('.load-preview-btn');
        loadBtn.textContent = 'Загрузка...';
        loadBtn.disabled = true;

        try {
            const content = await getFileContent(this.fileId);
            const preview = content.length > CONFIG.LIMITS.maxPreviewChars
                ? content.substring(0, CONFIG.LIMITS.maxPreviewChars) + '\n\n... [содержимое обрезано]'
                : content;

            contentElement.textContent = preview || 'Содержимое файла пустое';
            this.previewContent = preview;
            loadBtn.style.display = 'none';
        } catch (err) {
            contentElement.textContent = 'Ошибка загрузки содержимого файла';
            console.error('Preview load error:', err);
        } finally {
            loadBtn.disabled = false;
            loadBtn.textContent = '📖 Загрузить предпросмотр';
        }
    }
}

export default FileCard;
