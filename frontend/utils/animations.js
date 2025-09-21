/**
 * Модуль для управления анимациями и визуальными эффектами
 * @module Animations
 */

/**
 * Применяет CSS-анимацию к элементу
 * @param {HTMLElement} element - DOM-элемент для анимации
 * @param {string} animationName - Название анимации из Animate.css
 * @param {number} duration - Длительность анимации в миллисекундах
 * @returns {Promise} Промис, который разрешается после завершения анимации
 */
export function animateElement(element, animationName, duration = 1000) {
    return new Promise((resolve) => {
        // Удаляем предыдущие классы анимаций
        const animationClasses = element.className.split(' ').filter(className => 
            className.startsWith('animate__')
        );
        
        element.classList.remove(...animationClasses);
        
        // Добавляем новые классы анимации
        element.classList.add('animate__animated', `animate__${animationName}`);
        
        // Устанавливаем длительность анимации
        element.style.setProperty('--animate-duration', `${duration}ms`);
        
        // Обрабатываем завершение анимации
        const handleAnimationEnd = () => {
            element.removeEventListener('animationend', handleAnimationEnd);
            element.classList.remove('animate__animated', `animate__${animationName}`);
            element.style.removeProperty('--animate-duration');
            resolve();
        };
        
        element.addEventListener('animationend', handleAnimationEnd);
    });
}

/**
 * Показывает уведомление пользователю
 * @param {string} message - Текст сообщения
 * @param {string} type - Тип сообщения (success, error, warning, info)
 * @param {number} duration - Длительность показа уведомления в миллисекундах
 */
export function showNotification(message, type = 'info', duration = 3000) {
    // Создаем контейнер для уведомлений если его нет
    let container = document.getElementById('notifications-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'notifications-container';
        container.className = 'fixed top-4 right-4 z-50 space-y-2';
        document.body.appendChild(container);
    }
    
    // Определяем цвет в зависимости от типа
    const colors = {
        success: 'bg-green-500',
        error: 'bg-red-500',
        warning: 'bg-yellow-500',
        info: 'bg-blue-500'
    };
    
    // Создаем элемент уведомления
    const notification = document.createElement('div');
    notification.className = `${colors[type]} text-white px-4 py-2 rounded-md shadow-lg transform transition-all duration-300 animate__animated animate__fadeInRight`;
    notification.textContent = message;
    
    // Добавляем уведомление в контейнер
    container.appendChild(notification);
    
    // Автоматически скрываем через указанное время
    setTimeout(() => {
        notification.classList.remove('animate__fadeInRight');
        notification.classList.add('animate__fadeOutRight');
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, duration);
}

/**
 * Создает эффект "встряски" элемента (полезно для ошибок валидации)
 * @param {HTMLElement} element - DOM-элемент для анимации
 */
export function shakeElement(element) {
    animateElement(element, 'shakeX', 500).then(() => {
        element.classList.remove('animate__shakeX');
    });
}

/**
 * Плавно показывает элемент
 * @param {HTMLElement} element - DOM-элемент для показа
 * @param {number} duration - Длительность анимации в миллисекундах
 */
export function fadeInElement(element, duration = 500) {
    element.classList.remove('hidden');
    animateElement(element, 'fadeIn', duration);
}

/**
 * Плавно скрывает элемент
 * @param {HTMLElement} element - DOM-элемент для скрытия
 * @param {number} duration - Длительность анимации в миллисекундах
 */
export function fadeOutElement(element, duration = 500) {
    animateElement(element, 'fadeOut', duration).then(() => {
        element.classList.add('hidden');
    });
}
