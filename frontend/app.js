/**
 * Основной модуль приложения
 * Координирует работу всех компонентов и управляет состоянием приложения
 * @module App
 */

import FileCard from './components/FileCard.js';
import ProgressBar from './components/ProgressBar.js';
import { activateDashedBorderAnimation, deactivateDashedBorderAnimation, showNotification } from './utils/animations.js';
import { uploadFiles, mergeFiles } from './utils/api.js';
import { validateFile } from './utils/validators.js';
import { UI_CONFIG } from './config.js';

class App {
    /**
     * Создает экземпляр приложения
     */
    constructor() {
        this.files = new Map();
        this.renames = new Map();
        this.fileOrder = [];
        this.sortableInstance = null;
        this.fileInputClicked = false;
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

        // Виджет смены темы
        this.themeToggle = document.getElementById('themeToggle');
        this.initThemeToggle();
    }

    /**
     * Настраивает обработчики событий
     * @private
     */
    setupEventListeners() {
        // Обработчик выбора файлов через input
        this.fileInput.addEventListener('change', (e) => {
            this.fileInputClicked = false;
            this.handleFiles(e.target.files);
        });

        // Обработчик кнопки объединения
        this.mergeButton.addEventListener('click', () => this.handleMerge());

        // Обработчик выбора пресета
        this.presetSelect.addEventListener('change', (e) => {
            const val = e.target.value;
            if (val !== 'custom') {
                this.outputFilenameInput.value = val;
            }
        });

        // Логика добавления ".txt"
        this.outputFilenameInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.ensureTxtSuffix();
                this.outputFilenameInput.blur();
            }
        });

        this.outputFilenameInput.addEventListener('blur', () => this.ensureTxtSuffix());
    }

    /**
     * Настраивает переключатель темы
     * @private
     */
    initThemeToggle() {
        if (!this.themeToggle) return;

        this.themeToggle.checked = false;
        document.body.dataset.theme = 'light';

        this.themeToggle.addEventListener('change', (e) => {
            const checked = e.target.checked;
            document.body.dataset.theme = checked ? 'dark' : 'light';

            document.body.classList.add('theme-transition');
            setTimeout(() => {
                document.body.classList.remove('theme-transition');
            }, UI_CONFIG.ANIMATIONS.duration);
        });
    }

    /**
     * Настраивает drag-and-drop функциональность
     * @private
     */
    setupDragAndDrop() {
        this.dropZone.addEventListener('click', (e) => {
            if (e.target === this.dropZone || e.target.classList.contains('drop-zone-content')) {
                if (!this.fileInputClicked) {
                    this.fileInputClicked = true;
                    setTimeout(() => {
                        this.fileInput.click();
                        setTimeout(() => {
                            this.fileInputClicked = false;
                        }, 100);
                    }, 10);
                }
            }
        });

        // Событие: перетаскивание
        this.dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.dropZone.classList.add('drag-over');
        });

        this.dropZone.addEventListener('dragleave', (e) => {
            e.preventDefault();
            if (!this.dropZone.contains(e.relatedTarget)) {
                this.dropZone.classList.remove('drag-over');
            }
        });

        this.dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            this.dropZone.classList.remove('drag-over');
            if (e.dataTransfer?.files?.length) {
                this.handleFiles(e.dataTransfer.files);
            }
        });
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

        if (ProgressBar) ProgressBar.show();

        try {
            const fileIds = await uploadFiles(validFiles);

            if (!Array.isArray(fileIds) || fileIds.length !== validFiles.length) {
                validFiles.forEach((file, i) => {
                    const tmpId = `local-${Date.now()}-${i}`;
                    this.files.set(tmpId, {
                        file,
                        originalName: file.name,
                        customName: file.name,
                        size: file.size,
                        content: '',
                    });
                });
            } else {
                fileIds.forEach((id, idx) => {
                    const file = validFiles[idx];
                    this.files.set(id, {
                        file,
                        originalName: file.name,
                        customName: file.name,
                        size: file.size,
                        content: '',
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
            if (ProgressBar && ProgressBar.hide) {
                ProgressBar.hide();
            }
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
                file_renames: renamesObject,
            });

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
            });
            this.filesList.appendChild(fileCard.render());
        });

        // Инициализация Sortable.js для перетаскивания
        if (this.sortableInstance) {
            try {
                this.sortableInstance.destroy();
            } catch { }
        }

        if (this.files.size > 0) {
            this.sortableInstance = new Sortable(this.filesList, {
                animation: 150,
                ghostClass: 'opacity-60',
                filter: '.preview-btn, .rename-btn, .remove-btn',
                preventOnFilter: false,
                onEnd: () => this.updateFileOrder(),
            });
        }
    }

    /**
     * Обновляет порядок файлов после перетаскивания
     * @private
     */
    updateFileOrder() {
        const cards = Array.from(this.filesList.querySelectorAll('[data-file-id]'));
        const newOrder = cards.map((c) => c.dataset.fileId);

        if (JSON.stringify(newOrder) !== JSON.stringify(this.fileOrder)) {
            const reordered = new Map();
            newOrder.forEach((id) => {
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

    /**
     * Проверяет, что имя файла заканчивается на ".txt"
     * @private
     */
    ensureTxtSuffix() {
        let v = this.outputFilenameInput.value.trim();
        if (!v) return;
        if (!v.toLowerCase().endsWith('.txt')) {
            this.outputFilenameInput.value = v.replace(/\.txt$/i, '') + '.txt';
        }
    }
}

// Инициализация приложения после загрузки DOM
document.addEventListener('DOMContentLoaded', () => new App());
