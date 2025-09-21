/**
 * Компонент модального окна для предпросмотра содержимого файла
 * Отображает содержимое файла с ограничением в 500 символов и эффектом размытия
 * @class PreviewModal
 */
class PreviewModal {
    /**
     * Создает экземпляр модального окна предпросмотра
     */
    constructor() {
        this.modal = null;
        this.isOpen = false;
        this.init();
    }

    /**
     * Инициализирует модальное окно
     * @private
     */
    init() {
        this.createModal();
        this.setupEventListeners();
    }

    /**
     * Создает DOM-структуру модального окна
     * @private
     */
    createModal() {
        this.modal = document.createElement('div');
        this.modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 hidden';
        this.modal.innerHTML = `
            <div class="bg-white rounded-lg shadow-xl w-11/12 md:w-3/4 lg:w-1/2 max-h-3/4 overflow-hidden animate__animated animate__zoomIn">
                <div class="modal-header bg-purple text-white px-4 py-3 flex justify-between items-center">
                    <h3 class="text-lg font-semibold truncate" id="previewModalTitle">Предпросмотр файла</h3>
                    <button class="close-btn text-white hover:text-gray-200 transition-colors">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>
                <div class="modal-body p-4 overflow-y-auto max-h-96">
                    <div class="content-container relative">
                        <pre class="text-sm whitespace-pre-wrap break-words" id="previewContent"></pre>
                        <div class="blur-effect absolute inset-0 bg-gradient-to-t from-white to-transparent opacity-0 pointer-events-none"></div>
                    </div>
                </div>
                <div class="modal-footer bg-gray-100 px-4 py-3 flex justify-between items-center">
                    <span class="text-sm text-gray-500" id="previewStats">0/500 символов</span>
                    <button class="copy-btn px-4 py-2 bg-purple text-white rounded hover:bg-purple-dark transition-colors">
                        Копировать
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(this.modal);
    }

    /**
     * Настраивает обработчики событий для модального окна
     * @private
     */
    setupEventListeners() {
        // Закрытие по кнопке
        this.modal.querySelector('.close-btn').addEventListener('click', () => {
            this.hide();
        });

        // Закрытие по клику вне окна
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.hide();
            }
        });

        // Закрытие по Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.hide();
            }
        });

        // Копирование содержимого
        this.modal.querySelector('.copy-btn').addEventListener('click', () => {
            this.copyContent();
        });
    }

    /**
     * Показывает модальное окно с содержимым файла
     * @param {string} fileName - Имя файла
     * @param {string} content - Содержимое файла
     */
    show(fileName, content) {
        this.isOpen = true;

        // Устанавливаем заголовок
        this.modal.querySelector('#previewModalTitle').textContent = `Предпросмотр: ${fileName}`;

        // Устанавливаем содержимое
        const contentElement = this.modal.querySelector('#previewContent');
        contentElement.textContent = content;

        // Обновляем статистику
        this.updateStats(content.length);

        // Применяем эффект размытия если контент слишком длинный
        this.applyBlurEffect(content.length);

        // Показываем модальное окно
        this.modal.classList.remove('hidden');
        this.modal.classList.add('animate__zoomIn');
    }

    /**
     * Скрывает модальное окно
     */
    hide() {
        this.isOpen = false;
        this.modal.classList.add('hidden');
        this.modal.classList.remove('animate__zoomIn');
    }

    /**
     * Обновляет статистику символов
     * @param {number} length - Количество символов
     * @private
     */
    updateStats(length) {
        const statsElement = this.modal.querySelector('#previewStats');
        statsElement.textContent = `${length}/500 символов`;

        if (length > 500) {
            statsElement.classList.add('text-red-500');
        } else {
            statsElement.classList.remove('text-red-500');
        }
    }

    /**
     * Применяет эффект размытия для длинного контента
     * @param {number} length - Количество символов
     * @private
     */
    applyBlurEffect(length) {
        const blurElement = this.modal.querySelector('.blur-effect');
        if (length > 500) {
            blurElement.classList.remove('opacity-0');
        } else {
            blurElement.classList.add('opacity-0');
        }
    }

    /**
     * Копирует содержимое файла в буфер обмена
     * @private
     */
    async copyContent() {
        const content = this.modal.querySelector('#previewContent').textContent;
        try {
            await navigator.clipboard.writeText(content);
            this.showNotification('Содержимое скопировано в буфер обмена', 'success');
        } catch (error) {
            console.error('Copy failed:', error);
            this.showNotification('Не удалось скопировать содержимое', 'error');
        }
    }

    /**
     * Показывает уведомление
     * @param {string} message - Текст сообщения
     * @param {string} type - Тип сообщения (success, error, warning)
     * @private
     */
    showNotification(message, type) {
        // Временная реализация - можно интегрировать с общей системой уведомлений
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 px-4 py-2 rounded-md text-white ${type === 'success' ? 'bg-green-500' :
                type === 'error' ? 'bg-red-500' : 'bg-yellow-500'
            } animate__animated animate__fadeInDown`;
        notification.textContent = message;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.classList.add('animate__fadeOutUp');
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 500);
        }, 3000);
    }
}

export default PreviewModal;
