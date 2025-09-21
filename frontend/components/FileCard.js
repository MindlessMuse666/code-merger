/**
 * Компонент карточки файла
 * Отображает информацию о файле и предоставляет элементы управления
 * @class FileCard
 */
class FileCard {
    /**
     * Создает экземпляр карточки файла
     * @param {Object} config - Конфигурация карточки
     * @param {string} config.fileId - Уникальный идентификатор файла
     * @param {string} config.fileName - Отображаемое имя файла
     * @param {string} config.originalName - Оригинальное имя файла
     * @param {Function} config.onRename - Колбэк для переименования
     * @param {Function} config.onRemove - Колбэк для удаления
     * @param {Function} config.onPreview - Колбэк для предпросмотра
     */
    constructor({ fileId, fileName, originalName, onRename, onRemove, onPreview }) {
        this.fileId = fileId;
        this.fileName = fileName;
        this.originalName = originalName;
        this.onRename = onRename;
        this.onRemove = onRemove;
        this.onPreview = onPreview;
        this.isEditing = false;
    }

    /**
     * Рендерит карточку файла
     * @returns {HTMLElement} DOM-элемент карточки
     */
    render() {
        const card = document.createElement('div');
        card.className = 'file-card bg-white rounded-lg shadow-md p-4 flex items-center justify-between border border-gray-200 hover:border-pink-light transition-colors';
        card.dataset.fileId = this.fileId;

        card.innerHTML = `
            <div class="flex items-center space-x-3 flex-1 min-w-0">
                <div class="file-icon text-purple">
                    ${this.getFileIcon()}
                </div>
                <div class="file-info flex-1 min-w-0">
                    <div class="file-name text-sm font-medium text-gray-900 truncate">${this.fileName}</div>
                    <div class="file-original text-xs text-gray-500 truncate">${this.originalName}</div>
                </div>
            </div>
            <div class="file-actions flex space-x-2 opacity-0 transition-opacity">
                <button class="preview-btn p-1 text-gray-400 hover:text-purple" title="Предпросмотр">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                    </svg>
                </button>
                <button class="rename-btn p-1 text-gray-400 hover:text-purple" title="Переименовать">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                    </svg>
                </button>
                <button class="remove-btn p-1 text-gray-400 hover:text-red-500" title="Удалить">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                    </svg>
                </button>
            </div>
        `;

        // Показываем кнопки при наведении
        card.addEventListener('mouseenter', () => {
            card.querySelector('.file-actions').classList.remove('opacity-0');
        });

        card.addEventListener('mouseleave', () => {
            if (!this.isEditing) {
                card.querySelector('.file-actions').classList.add('opacity-0');
            }
        });

        // Назначаем обработчики
        this.attachEventHandlers(card);

        return card;
    }

    /**
     * Возвращает иконку для типа файла
     * @returns {string} SVG иконка
     * @private
     */
    getFileIcon() {
        // Упрощенная реализация - в реальном приложении можно добавить разные иконки
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
        card.querySelector('.preview-btn').addEventListener('click', () => {
            this.onPreview();
        });

        // Переименование
        card.querySelector('.rename-btn').addEventListener('click', () => {
            this.startRenaming(card);
        });

        // Удаление
        card.querySelector('.remove-btn').addEventListener('click', () => {
            this.onRemove();
        });
    }

    /**
     * Начинает процесс переименования файла
     * @param {HTMLElement} card - DOM-элемент карточки
     * @private
     */
    startRenaming(card) {
        this.isEditing = true;
        const nameElement = card.querySelector('.file-name');
        const originalName = nameElement.textContent;

        const input = document.createElement('input');
        input.type = 'text';
        input.value = originalName;
        input.className = 'w-full px-2 py-1 text-sm border border-purple rounded focus:outline-none focus:ring-1 focus:ring-purple';

        // Заменяем текст на input
        nameElement.parentNode.replaceChild(input, nameElement);
        input.focus();
        input.select();

        // Обработчик завершения редактирования
        const finishEditing = () => {
            const newName = input.value.trim();
            this.isEditing = false;

            if (newName && newName !== originalName) {
                this.onRename(newName);
            }

            // Восстанавливаем текст
            nameElement.textContent = newName || originalName;
            input.parentNode.replaceChild(nameElement, input);
        };

        // Завершение по Enter или клику вне поля
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                finishEditing();
            } else if (e.key === 'Escape') {
                input.value = originalName;
                finishEditing();
            }
        });

        input.addEventListener('blur', finishEditing);
    }
}

export default FileCard;
