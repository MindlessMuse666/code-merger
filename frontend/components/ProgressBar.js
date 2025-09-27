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
            <div class="bg-white rounded-lg shadow-xl p-6 w-11/12 md:w-2/3 lg:w-1/3 animate__animated animate__zoomIn">
                <div class="flex items-center space-x-4">
                    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-purple"></div>
                    <div class="flex-1">
                        <h3 class="text-lg font-semibold text-gray-800">Обработка</h3>
                        <p class="text-sm text-gray-600" id="progressText">Выполняется операция...</p>
                    </div>
                </div>
                <div class="mt-4 w-full bg-gray-200 rounded-full h-2">
                    <div class="bg-purple h-2 rounded-full transition-all duration-300" id="progressBar" style="width: 0%"></div>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        this.progressBar = document.getElementById('progressBar');
        this.progressText = document.getElementById('progressText');
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
