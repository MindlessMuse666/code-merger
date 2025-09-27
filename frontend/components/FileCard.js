/**
 * Компонент карточки файла
 * @class FileCard
 */

import { CONFIG, getFileIcon, formatFileSize } from '../config.js';
import { getFileContent } from '../utils/api.js';
import { showNotification } from '../utils/animations.js';

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
     */
    constructor({ fileId, fileName, originalName, fileSize, onRename, onRemove }) {
        this.fileId = fileId;
        this.fileName = fileName;
        this.originalFileName = fileName;
        this.originalName = originalName;
        this.fileSize = fileSize;
        this.onRename = onRename;
        this.onRemove = onRemove;
        this.editInput = null;
        this.previewContent = '';
        this.isEditing = false;
        this.isPreviewExpanded = false;
        this.isLoadingPreview = false;
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
            <div class="d-flex align-items-start justify-content-between w-100">
                <div class="d-flex align-items-start flex-grow-1 gap-3">
                    <!-- Иконка -->
                    <div class="flex-shrink-0">
                        <div class="file-icon fs-2">${icon}</div>
                    </div>

                    <!-- Инфо -->
                    <div class="file-info flex-grow-1">
                        <div class="file-name fw-bold mb-1" title="${this.fileName}">${displayName}</div>
                        <div class="file-details d-flex gap-2 mb-2">
                            <span class="badge bg-primary bg-opacity-25 text-primary" title="${this.originalName}">${displayOriginal}</span>
                            <span class="badge bg-secondary bg-opacity-25 text-secondary">${formatFileSize(this.fileSize)}</span>
                        </div>

                        <!-- Область предпросмотра -->
                        <div class="preview-area d-none mt-2">
                            <div class="preview-container position-relative">
                                <pre class="preview-content text-muted small bg-light rounded p-3 mb-0 font-monospace"></pre>
                                <div class="preview-blur"></div>
                            </div>
                            <div class="preview-stats text-end text-muted small mt-1">0/${CONFIG.LIMITS.maxPreviewChars} символов</div>
                        </div>

                        <!-- Область редактирования -->
                        <div class="edit-area d-none mt-2">
                            <div class="d-flex gap-2 align-items-center">
                                <input type="text" class="form-control form-control-sm" 
                                    value="${this.getFileNameWithoutExtension(this.fileName)}"
                                    placeholder="Введите имя файла">
                                <button class="btn btn-sm save-btn" title="Сохранить">💾</button>
                                <button class="btn btn-sm cancel-btn" title="Сбросить">↺</button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Действия -->
                <div class="file-actions d-flex align-items-center gap-2 flex-shrink-0">
                    <button class="btn btn-outline-info btn-sm preview-btn" title="Предпросмотр">👁️</button>
                    <button class="btn btn-outline-warning btn-sm rename-btn" title="Переименовать">✏️</button>
                    <button class="btn btn-outline-danger btn-sm remove-btn" title="Удалить">🗑️</button>
                </div>
            </div>
        `;

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
        const previewContent = card.querySelector('.preview-content');
        const previewStats = card.querySelector('.preview-stats');
        const previewBlur = card.querySelector('.preview-blur');

        // Обработчик предпросмотра
        previewBtn.addEventListener('click', async () => {
            if (this.isPreviewExpanded) {
                // Скрыть предпросмотр
                previewArea.classList.add('d-none');
                previewBtn.classList.remove('active', 'btn-info');
                previewBtn.classList.add('btn-outline-info');
                this.isPreviewExpanded = false;
            } else {
                // Показать предпросмотр
                previewArea.classList.remove('d-none');
                previewBtn.classList.remove('btn-outline-info');
                previewBtn.classList.add('active', 'btn-info');
                this.isPreviewExpanded = true;

                // Загрузить контент
                if (!this.previewContent && !this.isLoadingPreview) {
                    await this.loadPreviewContent(card);
                }

                // Обновить статистику
                this.updatePreviewStats(previewContent.textContent.length, previewStats, previewBlur);
            }
        });

        // Обработчик кнопки удаления
        const removeBtn = card.querySelector('.remove-btn');
        removeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            e.preventDefault();
            console.log('Remove button clicked for file:', this.fileId);
            this.onRemove();
        });

        // Обработчик кнопки редактирования
        const renameBtn = card.querySelector('.rename-btn');
        const saveBtn = card.querySelector('.save-btn');
        const cancelBtn = card.querySelector('.cancel-btn');
        const editInput = card.querySelector('.edit-area input');

        renameBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            console.log('Rename button clicked, current editing state:', this.isEditing);
            this.toggleEditMode(card);
        });

        // Обработчик сохранения
        saveBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            console.log('Save button clicked');
            this.saveFileName(card);
        });

        // Обработчик сброса - ПОЛНОСТЬЮ ПЕРЕРАБОТАН
        cancelBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            console.log('Cancel button clicked');
            this.cancelEdit(card, true); // true - показать уведомление
        });

        // Сохранение по Enter
        editInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.saveFileName(card);
            }
            e.stopPropagation();
        });

        // Обработчик клика вне области редактирования
        this.setupClickOutsideHandler(card);
    }

    /** 
     * Обрабатывает редактирования названия файла
     * @param {HTMLElement} card - DOM-элемент карточки
     * @param {boolean} forceOpen - 
     * @private
    */
    toggleEditMode(card) {
        const editArea = card.querySelector('.edit-area');
        const renameBtn = card.querySelector('.rename-btn');
        const editInput = card.querySelector('.edit-area input');

        if (this.isEditing) {
            this.cancelEdit(card, false);
        } else {
            // Открытие редактирования
            this.isEditing = true;
            this.originalFileName = this.fileName; // Сохранение оригинального имени

            editArea.classList.remove('d-none');
            renameBtn.classList.add('active');
            editInput.value = this.getFileNameWithoutExtension(this.fileName);
            editInput.focus();
            editInput.select();

            console.log('Edit mode opened');
        }
    }

    /** 
     * Сохраняет новое название файла
     * @param {HTMLElement} card - DOM-элемент карточки
     * @private
    */
    saveFileName(card) {
        const editInput = card.querySelector('.edit-area input');
        let newName = editInput.value.trim();

        if (!newName) {
            showNotification('Имя файла не может быть пустым', 'warning');
            return;
        }

        // Добавление расширения (если нужно)
        const extension = this.getFileExtension(this.originalFileName);
        if (extension && !newName.endsWith(extension)) {
            newName += extension;
        }

        // Сохранение изменений
        const oldName = this.fileName;
        this.fileName = newName;
        this.onRename(newName);

        // Обновление отображения
        const fileNameElement = card.querySelector('.file-name');
        fileNameElement.textContent = this.truncateFilename(newName, this.computeMaxChars());
        fileNameElement.title = newName;

        // Закрытие редактирования
        this.cancelEdit(card, false);
        showNotification(`Файл переименован: "${this.getFileNameWithoutExtension(oldName)}" → "${this.getFileNameWithoutExtension(newName)}"`, 'success');
    }

    /** 
     * Обрабатывает остановку редактирования названия файла
     * @param {HTMLElement} card - DOM-элемент карточки
     * @param {boolean} showNotification - Полазать ли уведомление
     * @private
    */
    cancelEdit(card, showNotification = true) {
        const editArea = card.querySelector('.edit-area');
        const renameBtn = card.querySelector('.rename-btn');
        const editInput = card.querySelector('.edit-area input');

        this.isEditing = false;

        if (editArea) editArea.classList.add('d-none');
        if (renameBtn) renameBtn.classList.remove('active');

        // Восстанавление оригинального имени в поле ввода
        if (editInput) {
            const originalNameWithoutExt = this.getFileNameWithoutExtension(this.originalFileName || this.fileName);
            editInput.value = originalNameWithoutExt;
        }

        // Показать уведомления (если нужно)
        if (showNotification) {
            showNotification('Изменения отменены, имя файла не изменено', 'info');
        }

        console.log('Edit mode closed');
    }

    /** 
     * Обрабатывает отмену редактирования названия файла по клику на любое место снаружи
     * @param {HTMLElement} card - DOM-элемент карточки
     * @private
    */
    setupClickOutsideHandler(card) {
        const handleClickOutside = (e) => {
            if (this.isEditing && !card.contains(e.target)) {
                console.log('Click outside detected, closing edit mode');
                this.cancelEdit(card, true);
            }
        };

        // Добавление обработчика
        document.addEventListener('click', handleClickOutside);

        // Ссылка для удаления обработчика
        this.clickOutsideHandler = handleClickOutside;
    }

    /** 
     * Возвращает название файла (без расширения)
     * @param {string} filename - Полное название файла
     * @private
    */
    getFileNameWithoutExtension(filename) {
        const lastDotIndex = filename.lastIndexOf('.');
        return lastDotIndex === -1 ? filename : filename.substring(0, lastDotIndex);
    }

    /** 
     * Возвращает расширение файла
     * @param {string} filename - Полное название файла
     * @private
    */
    getFileExtension(filename) {
        const lastDotIndex = filename.lastIndexOf('.');
        return lastDotIndex === -1 ? '' : filename.substring(lastDotIndex);
    }

    /**
     * Загружает содержимое файла для предпросмотра
     * @param {HTMLElement} card - DOM-элемент карточки
     * @private
     */
    async loadPreviewContent(card) {
        const previewContent = card.querySelector('.preview-content');
        const previewStats = card.querySelector('.preview-stats');
        const previewBlur = card.querySelector('.preview-blur');

        this.isLoadingPreview = true;
        previewContent.textContent = 'Загрузка содержимого...';

        try {
            const content = await getFileContent(this.fileId);
            this.previewContent = content;

            if (content.length > CONFIG.LIMITS.maxPreviewChars) {
                previewContent.textContent = content.substring(0, CONFIG.LIMITS.maxPreviewChars);
                previewBlur.style.display = 'block';
            } else {
                previewContent.textContent = content || 'Файл пуст';
                previewBlur.style.display = 'none';
            }

            this.updatePreviewStats(content.length, previewStats, previewBlur);
        } catch (error) {
            console.error('Error loading file content:', error);
            previewContent.textContent = 'Ошибка загрузки содержимого файла';
            previewStats.textContent = 'Ошибка';
            previewBlur.style.display = 'none';
        } finally {
            this.isLoadingPreview = false;
        }
    }

    /**
     * Обновляет статистику предпросмотра
     * @param {number} length - Длина контента
     * @param {HTMLElement} statsElement - Элемент статистики
     * @param {HTMLElement} blurElement - Элемент размытия
     * @private
     */
    updatePreviewStats(length, statsElement, blurElement) {
        statsElement.textContent = `${length}/${CONFIG.LIMITS.maxPreviewChars} символов`;

        if (length > CONFIG.LIMITS.maxPreviewChars) {
            statsElement.classList.add('text-warning');
            blurElement.style.display = 'block';
        } else {
            statsElement.classList.remove('text-warning');
            blurElement.style.display = 'none';
        }
    }

    /**
     * Подбирает адаптивную длину отображаемого имени
     * @returns {number} длина отображаемого имени файла
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
     * @param {string} name - название файла
     * @param {number} maxChars - максимальное количество символов
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

    // В деструкторе или методе удаления карточки
    destroy() {
        if (this.clickOutsideHandler) {
            document.removeEventListener('click', this.clickOutsideHandler);
        }
    }
}

export default FileCard;
