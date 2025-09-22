/**
 * Основной модуль приложения
 * Координирует работу всех компонентов и управляет состоянием приложения
 * @module App
 */

import FileCard from './components/FileCard.js';
import PreviewModal from './components/PreviewModal.js';
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
        this.previewModal = new PreviewModal();
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
        console.log('Полученные файлы:', files);
        console.log('Массив файлов:', Array.from(files));

        const validFiles = Array.from(files).filter(validateFile);
        console.log('Валидные файлы:', validFiles);

        if (validFiles.length === 0) {
            showNotification('Нет подходящих файлов для загрузки', 'error');
            return;
        }

        // Показываем индикатор загрузки
        ProgressBar.show();

        try {
            const fileIds = await uploadFiles(validFiles);

            if (!fileIds || !Array.isArray(fileIds)) {
                throw new Error('Некорректный ответ от сервера');
            }

            // Добавляем файлы в состояние приложения
            fileIds.forEach((fileId, index) => {
                const file = validFiles[index];
                this.files.set(fileId, {
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
            console.error('Upload error details:', error);
            showNotification('Ошибка при загрузке файлов', 'error');
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
        console.log('handlePreview called for fileId:', fileId);

        const fileData = this.files.get(fileId);
        if (!fileData) {
            showNotification('Файл не найден', 'error');
            return;
        }

        // Валидация: инициализировано ли модальное окно
        if (!this.previewModal.isReady()) {
            console.warn('PreviewModal not ready, initializing...');
            this.previewModal.init();
        }

        ProgressBar.show('Загрузка содержимого файла...');

        try {
            // Получение содержимого файла с сервера
            const content = await getFileContent(fileId);
            console.log('File content loaded, length:', content.length);

            // Ограничение предпросмотра (пока что 500 символов)
            const previewContent = content.length > 500
                ? content.substring(0, 500) + "\n\n... [содержимое обрезано для предпросмотра]"
                : content;

            // Показ модального окна
            this.previewModal.show(fileData.customName, previewContent);

        } catch (error) {
            console.error('Preview error:', error);
            showNotification('Ошибка при загрузке содержимого файла', 'error');
        } finally {
            ProgressBar.hide();
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
            const fileIds = this.fileOrder || Array.from(this.files.keys());
            const renamesObject = Object.fromEntries(this.renames);

            const result = await mergeFiles({
                file_ids: fileIds,
                output_filename: outputFilename,
                file_renames: renamesObject
            });

            // Создание ссылки для скачивания
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
        const filesContainer = document.getElementById('filesContainer');
        const controlPanel = document.getElementById('controlPanel');

        // Управление видимостью (через добавление/удаление классов)
        if (hasFiles) {
            filesContainer.classList.remove('hidden');
            filesContainer.classList.add('grid');
            controlPanel.classList.remove('hidden');
        } else {
            filesContainer.classList.add('hidden');
            filesContainer.classList.remove('grid');
            controlPanel.classList.add('hidden');
        }

        document.getElementById('mergeButton').disabled = !hasFiles;
    }

    /**
     * Рендерит карточки файлов
     * @private
     */
    renderFileCards() {
        const filesList = document.getElementById('filesList');
        filesList.innerHTML = '';

        // Сохранение текущего порядка перед перерисовкой
        const currentOrder = this.fileOrder.length > 0
            ? this.fileOrder
            : Array.from(this.files.keys());

        // Рендер файлов в правильном порядке
        currentOrder.forEach(fileId => {
            if (this.files.has(fileId)) {
                const fileData = this.files.get(fileId);
                const fileCard = new FileCard({
                    fileId,
                    fileName: fileData.customName,
                    originalName: fileData.originalName,
                    onRename: (newName) => this.handleRename(fileId, newName),
                    onRemove: () => this.handleRemove(fileId),
                    onPreview: () => this.handlePreview(fileId)
                });

                filesList.appendChild(fileCard.render());
            }
        });

        // Инициализация Sortable.js для перетаскивания
        if (this.files.size > 0) {
            if (this.sortableInstance) {
                this.sortableInstance.destroy();
            }

            this.sortableInstance = new Sortable(filesList, {
                animation: 150,
                ghostClass: 'bg-blue-light',
                filter: '.preview-btn, .rename-btn, .remove-btn',
                preventOnFilter: false,
                onEnd: (evt) => {
                    console.log('Drag ended, old index:', evt.oldIndex, 'new index:', evt.newIndex);
                    this.updateFileOrder();
                }
            });
        }
    }

    /**
     * Обновляет порядок файлов после перетаскивания
     * @private
     */
    updateFileOrder() {
        const filesList = document.getElementById('filesList');
        const fileCards = Array.from(filesList.querySelectorAll('[data-file-id]'));
        const newOrder = fileCards.map(card => card.dataset.fileId);

        // Валидация: порядок изменился
        if (JSON.stringify(newOrder) !== JSON.stringify(this.fileOrder)) {
            const reorderedFiles = new Map();

            newOrder.forEach(fileId => {
                if (this.files.has(fileId)) {
                    reorderedFiles.set(fileId, this.files.get(fileId));
                }
            });

            // Обновление состояния
            this.files = reorderedFiles;
            this.fileOrder = newOrder;

            console.log('Порядок файлов обновлен:', this.fileOrder);
            showNotification('Порядок файлов обновлён', 'success');
        }
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
