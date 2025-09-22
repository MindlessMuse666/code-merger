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
        this.isInitialized = false;
        console.log('PreviewModal constructor called');
        this.init();
    }

    /**
     * Инициализирует модальное окно
     * @private
     */
    init() {
        try {
            console.log('Initializing PreviewModal...');
            this.createModal();
            this.setupEventListeners();
            this.isInitialized = true;
            console.log('PreviewModal initialized successfully');
        } catch (error) {
            console.error('Error initializing PreviewModal:', error);
        }
    }

    /**
     * Создает DOM-структуру модального окна
     * @private
     */
    createModal() {
        // Проверяем, не создано ли модальное окно уже
        if (document.getElementById('previewModal')) {
            this.modal = document.getElementById('previewModal');
            console.log('Using existing modal');
            return;
        }

        this.modal = document.createElement('div');
        this.modal.id = 'previewModal'; // Добавляем ID для легкого поиска
        this.modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 hidden';
        this.modal.innerHTML = `
            <div class="bg-white rounded-lg shadow-xl w-11/12 md:w-3/4 lg:w-1/2 max-h-3/4 overflow-hidden">
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
                        <pre class="text-sm whitespace-pre-wrap break-words" id="previewContent">Загрузка содержимого...</pre>
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
        console.log('Modal created and added to DOM');
    }

    /**
     * Настраивает обработчики событий для модального окна
     * @private
     */
    setupEventListeners() {
        if (!this.modal) {
            console.error('Cannot setup event listeners: modal is null');
            return;
        }

        try {
            // Закрытие по кнопке
            const closeBtn = this.modal.querySelector('.close-btn');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => {
                    console.log('Close button clicked');
                    this.hide();
                });
            }

            // Закрытие по клику вне окна
            this.modal.addEventListener('click', (e) => {
                if (e.target === this.modal) {
                    console.log('Background clicked');
                    this.hide();
                }
            });

            // Закрытие по Escape
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && this.isOpen) {
                    console.log('Escape key pressed');
                    this.hide();
                }
            });

            // Копирование содержимого
            const copyBtn = this.modal.querySelector('.copy-btn');
            if (copyBtn) {
                copyBtn.addEventListener('click', () => {
                    console.log('Copy button clicked');
                    this.copyContent();
                });
            }

            console.log('Event listeners setup completed');
        } catch (error) {
            console.error('Error setting up event listeners:', error);
        }
    }

    /**
     * Показывает модальное окно с содержимым файла
     * @param {string} fileName - Имя файла
     * @param {string} content - Содержимое файла
     */
    show(fileName, content) {
        console.log('PreviewModal.show called with:', { fileName, contentLength: content?.length });

        if (!this.isInitialized) {
            console.warn('PreviewModal not initialized, trying to init...');
            this.init();
        }

        if (!this.modal) {
            console.error('Cannot show modal: modal element is null');
            return;
        }

        try {
            this.isOpen = true;

            // Установка заголовка
            const titleElement = this.modal.querySelector('#previewModalTitle');
            if (titleElement) {
                titleElement.textContent = `Предпросмотр: ${fileName}`;
            }

            // Установка содержимого
            const contentElement = this.modal.querySelector('#previewContent');
            if (contentElement) {
                contentElement.textContent = content || 'Содержимое недоступно';
            }

            // Обновление статистики
            this.updateStats(content?.length || 0);

            // Применение эффекта размытия, если контент слишком длинный
            this.applyBlurEffect(content?.length || 0);

            // Показ модального окна - удаляем hidden, добавляем flex для правильного отображения
            this.modal.classList.remove('hidden');
            this.modal.classList.add('flex'); // Добавляем flex для центрирования

            // Анимация
            setTimeout(() => {
                this.modal.querySelector('.bg-white').classList.add('animate__animated', 'animate__zoomIn');
            }, 10);

            console.log('Modal shown successfully');
        } catch (error) {
            console.error('Error showing modal:', error);
        }
    }

    /**
     * Скрывает модальное окно
     */
    hide() {
        console.log('PreviewModal.hide called');

        if (!this.modal) {
            console.warn('Cannot hide modal: modal element is null');
            return;
        }

        try {
            this.isOpen = false;

            // Убираем анимацию
            const modalContent = this.modal.querySelector('.bg-white');
            if (modalContent) {
                modalContent.classList.remove('animate__animated', 'animate__zoomIn');
            }

            // Скрываем модальное окно
            this.modal.classList.add('hidden');
            this.modal.classList.remove('flex');

            console.log('Modal hidden successfully');
        } catch (error) {
            console.error('Error hiding modal:', error);
        }
    }

    /**
     * Обновляет статистику символов
     * @param {number} length - Количество символов
     * @private
     */
    updateStats(length) {
        const statsElement = this.modal.querySelector('#previewStats');
        if (statsElement) {
            statsElement.textContent = `${length}/500 символов`;

            if (length > 500) {
                statsElement.classList.add('text-red-500');
            } else {
                statsElement.classList.remove('text-red-500');
            }
        }
    }

    /**
     * Применяет эффект размытия для длинного контента
     * @param {number} length - Количество символов
     * @private
     */
    applyBlurEffect(length) {
        const blurElement = this.modal.querySelector('.blur-effect');
        const contentElement = this.modal.querySelector('#previewContent');

        if (blurElement && contentElement) {
            if (length > 500) {
                blurElement.classList.remove('opacity-0');
                contentElement.style.maxHeight = '300px';
                contentElement.style.overflowY = 'auto';
            } else {
                blurElement.classList.add('opacity-0');
                contentElement.style.maxHeight = 'none';
                contentElement.style.overflowY = 'visible';
            }
        }
    }

    /**
     * Копирует содержимое файла в буфер обмена
     * @private
     */
    async copyContent() {
        try {
            const content = this.modal.querySelector('#previewContent').textContent;
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
        try {
            const notification = document.createElement('div');
            notification.className = `fixed top-4 right-4 px-4 py-2 rounded-md text-white z-60 ${type === 'success' ? 'bg-green-500' :
                    type === 'error' ? 'bg-red-500' : 'bg-yellow-500'
                } animate__animated animate__fadeInDown`;
            notification.textContent = message;

            document.body.appendChild(notification);

            setTimeout(() => {
                notification.classList.add('animate__fadeOutUp');
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.parentNode.removeChild(notification);
                    }
                }, 500);
            }, 3000);
        } catch (error) {
            console.error('Error showing notification:', error);
        }
    }

    /**
     * Проверяет, инициализировано ли модальное окно
     * @returns {boolean} True если модальное окно готово к использованию
     */
    isReady() {
        return this.isInitialized && this.modal !== null;
    }
}

export default PreviewModal;
