/**
 * Основной модуль приложения
 * Координирует работу всех компонентов и управляет состоянием приложения
 * @module App
 */

import FileCard from './components/FileCard.js';
import PreviewModal from './components/PreviewModal.js';
import ProgressBar from './components/ProgressBar.js';
import { uploadFiles, mergeFiles } from './utils/api.js';
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
        this.init();
    }

    /**
     * Инициализирует приложение
     * @private
     */
    init() {
        this.setupEventListeners();
        this.setupDragAndDrop();
        this.render();
    }

    /**
     * Настраивает обработчики событий
     * @private
     */
    setupEventListeners() {
        // Обработчик выбора файлов через input
        document.getElementById('fileInput').addEventListener('change', (e) => {
            this.handleFiles(e.target.files);
        });

        // Обработчик кнопки объединения
        document.getElementById('mergeButton').addEventListener('click', () => {
            this.handleMerge();
        });

        // Обработчик выбора пресета
        document.getElementById('presetSelect').addEventListener('change', (e) => {
            this.handlePresetSelect(e.target.value);
        });
    }

    /**
     * Настраивает drag-and-drop функциональность
     * @private
     */
    setupDragAndDrop() {
        setupDragAndDrop({
            dropZone: document.getElementById('dropZone'),
            onDrop: (files) => this.handleFiles(files)
        });
    }

    /**
     * Обрабатывает добавление файлов
     * @param {FileList} files - Список файлов для обработки
     */
    async handleFiles(files) {
        const validFiles = Array.from(files).filter(validateFile);

        if (validFiles.length === 0) {
            showNotification('Нет подходящих файлов для загрузки', 'error');
            return;
        }

        // Показываем индикатор загрузки
        ProgressBar.show();

        try {
            const uploadResults = await uploadFiles(validFiles);

            // Добавляем файлы в состояние приложения
            uploadResults.forEach((result, index) => {
                const file = validFiles[index];
                this.files.set(result.fileId, {
                    file,
                    originalName: file.name,
                    customName: file.name,
                    content: '' // Контент будет загружен при предпросмотре
                });
            });

            this.renderFileCards();
            this.updateUIState();
            showNotification(`Загружено ${validFiles.length} файлов`, 'success');

        } catch (error) {
            showNotification('Ошибка при загрузке файлов', 'error');
            console.error('Upload error:', error);
        } finally {
            ProgressBar.hide();
        }
    }

    /**
     * Обрабатывает переименование файла
     * @param {string} fileId - ID файла
     * @param {string} newName - Новое имя файла
     */
    handleRename(fileId, newName) {
        const fileData = this.files.get(fileId);
        if (fileData) {
            fileData.customName = newName;
            this.renames.set(fileData.originalName, newName);
        }
    }

    /**
     * Обрабатывает удаление файла
     * @param {string} fileId - ID файла для удаления
     */
    handleRemove(fileId) {
        const fileData = this.files.get(fileId);
        if (fileData) {
            this.renames.delete(fileData.originalName);
            this.files.delete(fileId);
            this.renderFileCards();
            this.updateUIState();
        }
    }

    /**
     * Обрабатывает предпросмотр файла
     * @param {string} fileId - ID файла для предпросмотра
     */
    async handlePreview(fileId) {
        const fileData = this.files.get(fileId);
        if (!fileData) return;

        try {
            // Здесь будет логика получения содержимого файла
            // Пока используем заглушку
            const content = "Содержимое файла будет загружено при реализации бэкенда";
            PreviewModal.show(fileData.customName, content);
        } catch (error) {
            showNotification('Ошибка при загрузке содержимого файла', 'error');
        }
    }

    /**
     * Обрабатывает выбор пресета
     * @param {string} preset - Выбранный пресет
     */
    handlePresetSelect(preset) {
        if (preset !== 'custom') {
            document.getElementById('outputFilename').value = preset;
        }
    }

    /**
     * Обрабатывает объединение файлов
     */
    async handleMerge() {
        const outputFilename = document.getElementById('outputFilename').value;

        if (!outputFilename) {
            showNotification('Введите имя выходного файла', 'warning');
            return;
        }

        if (this.files.size === 0) {
            showNotification('Нет файлов для объединения', 'warning');
            return;
        }

        ProgressBar.show();

        try {
            const fileIds = Array.from(this.files.keys());
            const renamesObject = Object.fromEntries(this.renames);

            const result = await mergeFiles({
                file_ids: fileIds,
                output_filename: outputFilename,
                file_renames: renamesObject
            });

            // Создаем ссылку для скачивания
            const blob = new Blob([result], { type: 'application/octet-stream' });
            const url = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = outputFilename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            showNotification('Файлы успешно объединены', 'success');

        } catch (error) {
            showNotification('Ошибка при объединении файлов', 'error');
            console.error('Merge error:', error);
        } finally {
            ProgressBar.hide();
        }
    }

    /**
     * Обновляет состояние UI на основе текущих файлов
     * @private
     */
    updateUIState() {
        const hasFiles = this.files.size > 0;
        document.getElementById('filesContainer').classList.toggle('hidden', !hasFiles);
        document.getElementById('controlPanel').classList.toggle('hidden', !hasFiles);
        document.getElementById('mergeButton').disabled = !hasFiles;
    }

    /**
     * Рендерит карточки файлов
     * @private
     */
    renderFileCards() {
        const filesList = document.getElementById('filesList');
        filesList.innerHTML = '';

        this.files.forEach((fileData, fileId) => {
            const fileCard = new FileCard({
                fileId,
                fileName: fileData.customName,
                originalName: fileData.originalName,
                onRename: (newName) => this.handleRename(fileId, newName),
                onRemove: () => this.handleRemove(fileId),
                onPreview: () => this.handlePreview(fileId)
            });

            filesList.appendChild(fileCard.render());
        });

        // Инициализируем Sortable.js для перетаскивания
        if (this.files.size > 0) {
            new Sortable(filesList, {
                animation: 150,
                ghostClass: 'bg-blue-light',
                onEnd: () => this.updateFileOrder()
            });
        }
    }

    /**
     * Обновляет порядок файлов после перетаскивания
     * @private
     */
    updateFileOrder() {
        // Здесь будет логика обновления порядка файлов
        // Пока просто перерисовываем карточки
        this.renderFileCards();
    }

    /**
     * Рендерит приложение
     * @private
     */
    render() {
        // Базовая инициализация уже выполнена в конструкторе
        this.updateUIState();
    }
}

// Инициализация приложения после загрузки DOM
document.addEventListener('DOMContentLoaded', () => {
    new App();
});
