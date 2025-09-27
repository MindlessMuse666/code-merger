/**
 * Компонент индикатора прогресса
 * Отображает прогресс выполнения операций и блокирует интерфейс во время обработки
 * @class ProgressBar
 */
class ProgressBar {
    /**
     * Создает экземпляр индикатора прогресса
     */
    constructor() {
        this.progressBar = null;
        this.progressText = null;
        this.isVisible = false;
        this.init();
    }

    /**
     * Инициализирует индикатор прогресса
     * @private
     */
    init() {
        this.createProgressBar();
    }

    /**
     * Создает DOM-структуру индикатора прогресса
     * @private
     */
    createProgressBar() {
        const overlay = document.createElement('div');
        overlay.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 hidden';
        overlay.id = 'progressOverlay';

        overlay.innerHTML = `
            <div class="progress-modal animate__animated animate__zoomIn">
                <div class="text-center">
                    <!-- Анимированная иконка -->
                    <div class="progress-spinner mx-auto mb-4"></div>
                    
                    <!-- Текст -->
                    <h3 class="text-gradient mb-2">Обработка файлов</h3>
                    <p class="text-muted mb-3" id="progressText">Выполняется операция...</p>
                    
                    <!-- Progress bar -->
                    <div class="progress-bar-container">
                        <div class="progress-bar-fill" id="progressBar" style="width: 0%"></div>
                    </div>
                    
                    <!-- Дополнительная информация -->
                    <div class="progress-details mt-2 text-sm text-muted">
                        <span id="progressDetails">Подготовка...</span>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);
        this.progressBar = document.getElementById('progressBar');
        this.progressText = document.getElementById('progressText');
        this.progressDetails = document.getElementById('progressDetails');
        this.overlay = overlay;
    }

    /**
     * Показывает индикатор прогресса
     * @param {string} message - Сообщение о выполняемой операции
     */
    show(message = 'Выполняется операция...') {
        this.isVisible = true;
        this.progressText.textContent = message;
        this.progressBar.style.width = '0%';
        this.overlay.classList.remove('hidden');
        this.overlay.classList.add('animate__zoomIn');

        // Блокируем интерфейс
        this.disableUI(true);
    }

    /**
     * Скрывает индикатор прогресса
     */
    hide() {
        if (!this.overlay) return;

        this.isVisible = false;
        if (this.overlay.classList) {
            this.overlay.classList.add('hidden');
            this.overlay.classList.remove('animate__zoomIn');
        }
        this.disableUI(false);
    }

    /**
     * Обновляет прогресс выполнения
     * @param {number} percentage - Процент выполнения (0-100)
     * @param {string} message - Сообщение о выполняемой операции
     */
    update(percentage, message = null) {
        if (message) {
            this.progressText.textContent = message;
        }

        this.progressBar.style.width = `${Math.min(100, Math.max(0, percentage))}%`;
    }

    /**
     * Блокирует или разблокирует пользовательский интерфейс
     * @param {boolean} disabled - true для блокировки, false для разблокировки
     * @private
     */
    disableUI(disabled) {
        const interactiveElements = document.querySelectorAll('button, input, select, textarea, .file-card');

        interactiveElements.forEach(element => {
            if (disabled) {
                element.setAttribute('disabled', 'disabled');
                element.style.pointerEvents = 'none';
                element.style.opacity = '0.6';
            } else {
                element.removeAttribute('disabled');
                element.style.pointerEvents = '';
                element.style.opacity = '';
            }
        });
    }
}

// Экспортируем синглтон
export default new ProgressBar();
