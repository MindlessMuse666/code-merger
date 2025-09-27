/**
 * Модуль для управления анимациями и визуальными эффектами
 * @module Animations
 */

import { NOTIFICATION_CONFIG as NC } from '../config.js';

/**
 * Применяет CSS-анимацию к элементу
 * @param {HTMLElement} element - DOM-элемент для анимации
 * @param {string} animationName - Название анимации из Animate.css
 * @param {number} duration - Длительность анимации в миллисекундах
 * @returns {Promise} Промис, который разрешается после завершения анимации
 */
export function animateElement(element, animationName, duration = 300) {
    return new Promise((resolve) => {
        const animationClasses = element.className.split(' ').filter(className =>
            className.startsWith('animate__')
        );

        element.classList.remove(...animationClasses);
        element.classList.add('animate__animated', `animate__${animationName}`);
        element.style.setProperty('--animate-duration', `${duration}ms`);

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
 * Активирует анимацию drag-over для зоны загрузки
 * @param {HTMLElement} dropZone - Элемент зоны загрузки
 */
export function activateDropZoneAnimation(dropZone) {
    if (!dropZone) return;

    dropZone.classList.add('drag-over');
    animateElement(dropZone, 'pulse', 500);
}

/**
 * Деактивирует анимацию drag-over для зоны загрузки
 * @param {HTMLElement} dropZone - Элемент зоны загрузки
 */
export function deactivateDropZoneAnimation(dropZone) {
    if (!dropZone) return;

    dropZone.classList.remove('drag-over');
}

/**
 * Показывает уведомление пользователю
 * @param {string} message - Текст сообщения
 * @param {string} type - Тип сообщения (success, error, warning, info)
 * @param {number} duration - Длительность показа уведомления в миллисекундах
 */
export function showNotification(message, type = 'info', duration = 4000) {
    let container = document.getElementById('notifications-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'notifications-container';
        container.className = 'notifications-container';
        document.body.appendChild(container);
    }

    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="d-flex align-items-center justify-content-between">
            <div class="d-flex align-items-center">
                <span class="notification-icon me-2 fs-5">${NC.ICONS[type]}</span>
                <span>${message}</span>
            </div>
            <button class="btn-close btn-close-sm" onclick="this.parentElement.parentElement.remove()"></button>
        </div>
    `;

    container.appendChild(notification);

    // Автоматическое скрытие
    const autoRemove = setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, NC.DURATIONS.short);
    }, duration);

    // Ручное закрытие
    notification.querySelector('.btn-close').addEventListener('click', () => {
        clearTimeout(autoRemove);
        notification.classList.add('fade-out');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, NC.DURATIONS.short);
    });
}

/**
 * Создает эффект "встряски" элемента (для ошибок валидации)
 * @param {HTMLElement} element - DOM-элемент для анимации
 */
export function shakeElement(element) {
    animateElement(element, 'shakeX', NC.DURATIONS.long);
}

/**
 * Плавно показывает элемент
 * @param {HTMLElement} element - DOM-элемент для показа
 * @param {number} duration - Длительность анимации в миллисекундах
 */
export function fadeInElement(element, duration = NC.DURATIONS.long) {
    element.classList.remove('d-none');
    animateElement(element, 'fadeIn', duration);
}

/**
 * Плавно скрывает элемент
 * @param {HTMLElement} element - DOM-элемент для скрытия
 * @param {number} duration - Длительность анимации в миллисекундах
 */
export function fadeOutElement(element, duration = NC.DURATIONS.long) {
    animateElement(element, 'fadeOut', duration).then(() => {
        element.classList.add('d-none');
    });
}

/**
 * Активирует анимацию пунктирной границы при drag-over
 * @param {HTMLElement} dropZone - Элемент зоны загрузки
 */
export function activateDashedBorderAnimation(dropZone) {
    if (!dropZone) return;

    dropZone.classList.add('drag-over');
}

/**
 * Деактивирует анимацию пунктирной границы
 * @param {HTMLElement} dropZone - Элемент зоны загрузки
 */
export function deactivateDashedBorderAnimation(dropZone) {
    if (!dropZone) return;
    dropZone.classList.remove('drag-over');
}
