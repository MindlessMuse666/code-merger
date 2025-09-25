/**
 * Основной модуль приложения
 * Координирует работу всех компонентов и управляет состоянием приложения
 * @module App
 */

import Notification from './components/Notification.js';
import FileCard from './components/FileCard.js';
import ProgressBar from './components/ProgressBar.js';
import { uploadFiles, mergeFiles, getFileContent } from './utils/api.js';
import { setupDragAndDrop } from './utils/dragDrop.js';
import { showNotification } from './utils/animations.js';
import { validateFile } from './utils/validators.js';

class App {
    /**
     * Создает экземпляр приложения
     */
    constructor() {
        this.files = new Map();
        this.renames = new Map();
        this.fileOrder = [];
        this.sortableInstance = null;
        this.init();
    }

    /**
     * Инициализирует приложение
     * @private
     */
    init() {
        this.setupElements();
        this.setupEventListeners();
        this.setupDragAndDrop();
        this.render();
    }

    /**
     * Настраивает все UI-элементы
     * @private
     */
    setupElements() {
        this.dropZone = document.getElementById('dropZone');
        this.fileInput = document.getElementById('fileInput');
        this.filesContainer = document.getElementById('filesContainer');
        this.filesList = document.getElementById('filesList');
        this.controlPanel = document.getElementById('controlPanel');
        this.mergeButton = document.getElementById('mergeButton');
        this.outputFilenameInput = document.getElementById('outputFilename');
        this.presetSelect = document.getElementById('presetSelect');

        // Theme toggle
        this.themeToggle = document.getElementById('themeToggle');
        this.initThemeToggle();

        this.outputFilenameInput.addEventListener('input', () => {
            let v = this.outputFilenameInput.value;
            if (!v) return;
            if (!v.toLowerCase().endsWith('.txt')) {
                this.outputFilenameInput.value = v.replace(/\.txt$/i, '') + '.txt';
            }
        });
    }

    /**
     * Настраивает обработчики событий
     * @private
     */
    setupEventListeners() {
        // Обработчик выбора файлов через input
        this.fileInput.addEventListener('change', (e) => this.handleFiles(e.target.files));

        // Обработчик кнопки объединения
        this.mergeButton.addEventListener('click', () => this.handleMerge());

        // Обработчик выбора пресета
        this.presetSelect.addEventListener('change', (e) => {
            const val = e.target.value;
            if (val !== 'custom') {
                this.outputFilenameInput.value = val;
            }
        });

        // Проводник по нажатию на зону выбора файлов
        this.dropZone.addEventListener('click', () => this.fileInput.click());
    }

    /**
     * Настраивает переключатель темы
     * @private
     */
    initThemeToggle() {
        if (!this.themeToggle) return;
        const iconSpan = document.querySelector('.toggle-thumb .toggle-icon');
        const thumb = document.querySelector('.toggle-thumb');

        this.themeToggle.checked = false;
        if (iconSpan) iconSpan.textContent = '🌞';

        this.themeToggle.addEventListener('change', (e) => {
            const checked = e.target.checked;
            if (iconSpan) iconSpan.textContent = checked
                ? '🌙'
                : '🌞';
            // TODO(feat): пока просто анимация + состояние
            document.body.dataset.theme = checked ? 'dark' : 'light';
            thumb.style.transform = checked ? 'translateX(0)' : '';

            showNotification(checked ? 'Темная тема (визуально) выбрана' : 'Светлая тема (визуально) выбрана', 'info', 900);
        });
    }

    /**
     * Настраивает drag-and-drop функциональность
     * @private
     */
    setupDragAndDrop() {
        setupDragAndDrop({
            dropZone: this.dropZone,
            onDrop: (files) => this.handleFiles(files)
        });

        this.dropZone.addEventListener('dragenter', () => this.dropZone.classList.add('drag-over'));
        this.dropZone.addEventListener('dragleave', () => this.dropZone.classList.remove('drag-over'));
        this.dropZone.addEventListener('drop', () => this.dropZone.classList.remove('drag-over'));
    }

    /**
     * Обрабатывает добавление файлов
     * @param {FileList} filesList - Список файлов для обработки
     */
    async handleFiles(filesList) {
        const allFiles = Array.from(filesList);
        const validFiles = allFiles.filter(validateFile);

        if (validFiles.length === 0) {
            showNotification('Нет подходящих файлов для загрузки', 'error');
            return;
        }

        // Индикатор загрузки
        if (ProgressBar) ProgressBar.show();

        try {
            const fileIds = await uploadFiles(validFiles);

            if (!Array.isArray(fileIds) || fileIds.length !== validFiles.length) {
                for (let i = 0; i < validFiles.length; i++) {
                    const tmpId = `local-${Date.now()}-${i}`;
                    const file = validFiles[i];
                    this.files.set(tmpId, {
                        file,
                        originalName: file.name,
                        customName: file.name,
                        size: file.size,
                        content: ''
                    });
                }
            } else {
                fileIds.forEach((id, idx) => {
                    const file = validFiles[idx];
                    this.files.set(id, {
                        file,
                        originalName: file.name,
                        customName: file.name,
                        size: file.size,
                        content: ''
                    });
                });
            }

            this.renderFileCards();
            this.updateUIState();
            showNotification(`Загружено ${validFiles.length} файлов`, 'success');
        } catch (err) {
            console.error('Upload error:', err);
            showNotification('Ошибка при загрузке файлов', 'error');
        } finally {
            if (ProgressBar) ProgressBar.hide();
        }
    }

    /**
     * Обрабатывает переименование файла
     * @param {string} fileId - ID файла
     * @param {string} newName - Новое имя файла
     */
    handleRename(fileId, newName) {
        if (!this.files.has(fileId)) return;

        const fileData = this.files.get(fileId);
        fileData.customName = newName;

        this.renames.set(fileData.originalName, newName);
    }

    /**
     * Обрабатывает удаление файла
     * @param {string} fileId - ID файла для удаления
     */
    handleRemove(fileId) {
        if (!this.files.has(fileId)) return;

        const fileData = this.files.get(fileId);
        this.renames.delete(fileData.originalName);
        this.files.delete(fileId);

        this.renderFileCards();
        this.updateUIState();
    }

    /**
     * Обрабатывает предпросмотр файла
     * @param {string} fileId - ID файла для предпросмотра
     */
    async handlePreview(fileId) {
        if (!this.files.has(fileId)) {
            showNotification('Файл не найден', 'error');
            return;
        }

        // TODO(feat): Вызов модалки
    }

    /**
     * Обрабатывает выбор пресета
     * @param {string} preset - Выбранный пресет
     */
    handlePresetSelect(preset) {
        if (preset !== 'custom') {
            this.outputFilenameInput.value = preset;
        }
    }

    /**
     * Обрабатывает объединение файлов
     */
    async handleMerge() {
        const outputFilename = this.outputFilenameInput.value || 'merged.txt';
        if (!outputFilename) {
            showNotification('Введите имя выходного файла', 'warning');
            return;
        }
        if (this.files.size === 0) {
            showNotification('Нет файлов для объединения', 'warning');
            return;
        }

        if (ProgressBar) ProgressBar.show();
        try {
            const fileIds = this.fileOrder.length > 0 ? this.fileOrder : Array.from(this.files.keys());
            const renamesObject = Object.fromEntries(this.renames);

            const result = await mergeFiles({
                file_ids: fileIds,
                output_filename: outputFilename,
                file_renames: renamesObject
            });

            // Если server вернёт Blob/ArrayBuffer - создаём ссылку
            const blob = new Blob([result], { type: 'application/octet-stream; charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = outputFilename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            showNotification('Файлы успешно объединены', 'success');
        } catch (err) {
            console.error('Merge error:', err);
            showNotification('Ошибка при объединении файлов', 'error');
        } finally {
            if (ProgressBar) ProgressBar.hide();
        }
    }

    /**
     * Обновляет состояние UI на основе текущих файлов
     * @private
     */
    updateUIState() {
        const hasFiles = this.files.size > 0;

        if (hasFiles) {
            this.filesContainer.classList.remove('hidden');
            this.controlPanel.classList.remove('hidden');
        } else {
            this.filesContainer.classList.add('hidden');
            this.controlPanel.classList.add('hidden');
        }

        this.mergeButton.disabled = !hasFiles;
    }

    /**
     * Рендерит карточки файлов
     * @private
     */
    renderFileCards() {
        this.filesList.innerHTML = '';

        const currentOrder = this.fileOrder.length > 0 ? this.fileOrder : Array.from(this.files.keys());
        currentOrder.forEach((fileId) => {
            const f = this.files.get(fileId);
            if (!f) return;
            const fileCard = new FileCard({
                fileId,
                fileName: f.customName,
                originalName: f.originalName,
                fileSize: f.size,
                onRename: (newName) => this.handleRename(fileId, newName),
                onRemove: () => this.handleRemove(fileId),
                onPreview: () => this.handlePreview(fileId)
            });
            const el = fileCard.render();
            this.filesList.appendChild(el);
        });

        // Инициализация Sortable.js для перетаскивания
        if (this.sortableInstance) {
            try { this.sortableInstance.destroy(); } catch (e) { /* ignore */ }
        }
        if (this.files.size > 0) {
            this.sortableInstance = new Sortable(this.filesList, {
                animation: 150,
                ghostClass: 'opacity-60',
                filter: '.preview-btn, .rename-btn, .remove-btn',
                preventOnFilter: false,
                onEnd: () => this.updateFileOrder()
            });
        }
    }

    /**
     * Обновляет порядок файлов после перетаскивания
     * @private
     */
    updateFileOrder() {
        const cards = Array.from(this.filesList.querySelectorAll('[data-file-id]'));
        const newOrder = cards.map(c => c.dataset.fileId);

        if (JSON.stringify(newOrder) !== JSON.stringify(this.fileOrder)) {
            const reordered = new Map();
            newOrder.forEach(id => {
                if (this.files.has(id)) reordered.set(id, this.files.get(id));
            });

            this.files = reordered;
            this.fileOrder = newOrder;

            showNotification('Порядок файлов обновлён', 'success');
        }
    }

    /**
     * Рендерит приложение
     * @private
     */
    render() {
        this.updateUIState();
    }
}

// Инициализация приложения после загрузки DOM
document.addEventListener('DOMContentLoaded', () => new App());
