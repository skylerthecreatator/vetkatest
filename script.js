 // Безопасная отправка цели сразу в Яндекс.Метрику и Google Analytics — если какой-то из счётчиков
// ещё не настроен или заблокирован рекламным блокировщиком, просто пропускаем его, без ошибок в консоли
function trackGoal(goalName) {
    if (typeof window.ym === 'function' && window.YM_COUNTER_ID) {
        try {
            window.ym(window.YM_COUNTER_ID, 'reachGoal', goalName);
        } catch (err) {
            console.error('Metrika goal error:', err);
        }
    }
    if (typeof window.gtag === 'function') {
        try {
            window.gtag('event', goalName);
        } catch (err) {
            console.error('GA4 event error:', err);
        }
    }
}

let currentSlideIndex = 0;

function changeSlide(direction) {
    const slides = document.querySelectorAll('.hero-slide');
    if (slides.length === 0) return;

    // Полностью очищаем все 3D-классы у всех карточек
    slides.forEach(slide => {
        slide.classList.remove('active-slide', 'prev-slide', 'next-slide');
    });

    // Считаем индекс новой центральной карточки
    currentSlideIndex += direction;
    if (currentSlideIndex >= slides.length) currentSlideIndex = 0;
    if (currentSlideIndex < 0) currentSlideIndex = slides.length - 1;

    // Вычисляем индексы для левой (prev) и правой (next) карточек
    let prevIndex = currentSlideIndex - 1;
    if (prevIndex < 0) prevIndex = slides.length - 1;

    let nextIndex = currentSlideIndex + 1;
    if (nextIndex >= slides.length) nextIndex = 0;

    // Раздаем карточкам их новые 3D-роли
    slides[currentSlideIndex].classList.add('active-slide');
    slides[prevIndex].classList.add('prev-slide');
    slides[nextIndex].classList.add('next-slide');
}
 
// ===== МОДАЛКА С ФОРМОЙ =====
// Карта человекочитаемых названий источников для сообщения в Telegram
const SOURCE_LABELS = {
    'header':              'Кнопка "Связаться" в шапке',
    'mobile-dock':         'Кнопка "Связаться" в мобильной навигации',
    'catalog':             'Кнопка "Хочу этот букет" в каталоге',
    'delivery':            'Блок "Доставка"',
    'subscription':        'Блок "Подписка"',
    'constructor':         'Конструктор букета',
    'academy-intensive':   'Курс "Базовый интенсив"',
    'academy-workshop':    'Курс "Тематические воркшопы"',
    'academy-individual':  'Курс "Индивидуальный формат"',
};

// Хранилище ID таймеров — нужно чтобы clearTimeout мог их отменить при быстром закрытии/открытии модалки
let _modalFocusTimer = null;
let _modalOpener = null;

// Человек кликнул "Смотреть каталог" в промо-плашке, но ещё не выбрал букет —
// запоминаем, что промокод в игре, и подставим его в комментарий, когда он всё же откроет форму
let pendingWelcomeBonus = false;

function claimWelcomeBonus() {
    pendingWelcomeBonus = true;

    try {
        sessionStorage.setItem('vetkaBonusDismissed', '1');
    } catch (error) {
        // Регистрация всё равно откроется, даже если хранилище недоступно.
    }

    const badge = document.getElementById('bonusBadge');
    if (badge) {
        badge.classList.add('bonus-claimed');
        const title = badge.querySelector('strong');
        const description = badge.querySelector('.bonus-copy > span:last-child');
        if (title) title.textContent = 'Готово ✓';
        if (description) description.textContent = 'Регистрация открыта в новой вкладке';
        window.setTimeout(closeBonusBadge, 1400);
    }
}

function openContactModal(source = 'unknown', detail = '') {
    const modal = document.getElementById('contactModal');
    if (!modal) return;

    _modalOpener = document.activeElement instanceof HTMLElement ? document.activeElement : null;

    // Сброс формы к чистому состоянию — ВАЖНО делать это ДО заполнения source/detail,
    // иначе form.reset() внутри resetModal() затирает уже проставленные скрытые поля
    resetModal();

    // Запоминаем источник в скрытом поле формы
    const sourceField = document.getElementById('formSource');
    if (sourceField) sourceField.value = source;

    // Запоминаем деталь источника (например, название конкретного букета из каталога)
    const detailField = document.getElementById('formSourceDetail');
    if (detailField) detailField.value = detail;

    // Приветственный бонус — если человек ранее нажал "Получить" в бонусной плашке, показываем
    // несъёмную метку в форме (не текст в комментарии, который можно случайно стереть) вне
    // зависимости от того, откуда именно он в итоге открыл форму
    const bonusChip = document.getElementById('bonusChip');
    const bonusField = document.getElementById('formBonusApplied');
    if (bonusChip && bonusField) {
        if (pendingWelcomeBonus) {
            bonusChip.hidden = false;
            bonusField.value = 'yes';
        } else {
            bonusChip.hidden = true;
            bonusField.value = '';
        }
    }

    // Меняем подзаголовок модалки под контекст
    const subtitle = document.getElementById('modalSubtitleText');
    if (subtitle && SOURCE_LABELS[source]) {
        subtitle.textContent = 'Флорист свяжется с вами и ответит на все вопросы';
    }

    modal.classList.add('modal-active');
    document.body.classList.add('modal-open');
    document.body.style.overflow = 'hidden';
    modal.scrollTop = 0;

    // Отменяем предыдущий таймер фокуса если модалку открыли повторно
    clearTimeout(_modalFocusTimer);
    _modalFocusTimer = setTimeout(() => {
        const firstInput = document.getElementById('clientName');
        if (firstInput) firstInput.focus();
    }, 150);
}

function closeContactModal() {
    const modal = document.getElementById('contactModal');
    if (!modal) return;
    const wasOpen = modal.classList.contains('modal-active');
    modal.classList.remove('modal-active');
    document.body.classList.remove('modal-open');
    document.body.style.overflow = ''; // возвращаем прокрутку
    if (wasOpen && _modalOpener && typeof _modalOpener.focus === 'function') {
        _modalOpener.focus();
    }
}

// Закрытие по клику на затемнённый фон (не на саму карточку)
function handleModalOverlayClick(e) {
    if (e.target === document.getElementById('contactModal')) {
        closeContactModal();
    }
}

function resetModal() {
    // Показываем форму, прячем экран благодарности
    const stepForm = document.getElementById('modalStepForm');
    const stepThanks = document.getElementById('modalStepThanks');
    if (stepForm) stepForm.classList.remove('modal-step--hidden');
    if (stepThanks) stepThanks.classList.add('modal-step--hidden');

    // Очищаем поля и ошибки
    const form = document.getElementById('contactForm');
    if (form) form.reset();
    document.querySelectorAll('.form-input').forEach(i => i.classList.remove('form-input--error'));
    document.querySelectorAll('.form-error').forEach(e => e.classList.remove('form-error--visible'));
}

// Маска для номера телефона — пользователь вводит цифры, мы форматируем красиво
function applyPhoneMask(input) {
    let val = input.value.replace(/\D/g, ''); // убираем всё кроме цифр
    if (val.startsWith('8')) val = '7' + val.slice(1);
    if (val.startsWith('7')) {
        val = val.slice(0, 11);
        let result = '+7';
        if (val.length > 1) result += ' (' + val.slice(1, 4);
        if (val.length > 4) result += ') ' + val.slice(4, 7);
        if (val.length > 7) result += '-' + val.slice(7, 9);
        if (val.length > 9) result += '-' + val.slice(9, 11);
        input.value = result;
    } else {
        input.value = val.slice(0, 15);
    }
}

// Валидация формы перед отправкой
function validateForm() {
    let isValid = true;

    const name = document.getElementById('clientName');
    const nameError = document.getElementById('nameError');
    if (!name.value.trim() || name.value.trim().length < 2) {
        name.classList.add('form-input--error');
        nameError.classList.add('form-error--visible');
        isValid = false;
    } else {
        name.classList.remove('form-input--error');
        nameError.classList.remove('form-error--visible');
    }

    const phone = document.getElementById('clientPhone');
    const phoneError = document.getElementById('phoneError');
    const digits = phone.value.replace(/\D/g, '');
    if (digits.length < 11) {
        phone.classList.add('form-input--error');
        phoneError.classList.add('form-error--visible');
        isValid = false;
    } else {
        phone.classList.remove('form-input--error');
        phoneError.classList.remove('form-error--visible');
    }

    return isValid;
}

// Отправка: формируем сообщение и открываем нужный мессенджер
function submitForm(e) {
    e.preventDefault();
    if (!validateForm()) return;

    const name = document.getElementById('clientName').value.trim();
    const phone = document.getElementById('clientPhone').value.trim();
    const source = document.getElementById('formSource').value;
    const sourceDetail = document.getElementById('formSourceDetail')?.value.trim() || '';
    const comment = document.getElementById('clientComment')?.value.trim() || '';
    const bonusApplied = document.getElementById('formBonusApplied')?.value === 'yes';
    const messenger = document.querySelector('input[name="messenger"]:checked')?.value || 'telegram';
    const sourceLabel = SOURCE_LABELS[source] || source;
    const website = document.getElementById('hpWebsite')?.value || ''; // honeypot — у людей всегда пусто

    // Кнопка уходит в loading-состояние, чтобы пользователь видел что происходит
    const btn = document.querySelector('.form-submit-btn');
    if (btn) { btn.classList.add('form-submit-btn--loading'); btn.disabled = true; }

    const generalError = document.getElementById('formGeneralError');
    if (generalError) generalError.classList.remove('form-error--visible');

    fetch('/api/submit-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, messenger, source, sourceLabel, sourceDetail, comment, bonusApplied, website }),
    })
        .then(response => response.json().then(data => ({ ok: response.ok, data })))
        .then(({ ok, data }) => {
            if (btn) { btn.classList.remove('form-submit-btn--loading'); btn.disabled = false; }

            if (!ok || !data.ok) {
                // Заявка не долетела — показываем ошибку прямо в форме, экран "спасибо" НЕ открываем,
                // чтобы человек не думал, что всё прошло, пока флорист ничего не получил
                if (generalError) {
                    generalError.textContent = data.error === 'too_many_requests'
                        ? 'Вы уже отправляли заявку недавно — флорист её увидел, дождитесь ответа 🙂'
                        : 'Не получилось отправить заявку. Проверьте связь и попробуйте ещё раз, или напишите нам в Telegram напрямую.';
                    generalError.classList.add('form-error--visible');
                }
                return;
            }

            // Показываем экран благодарности
            const stepForm = document.getElementById('modalStepForm');
            const stepThanks = document.getElementById('modalStepThanks');
            const thanksName = document.getElementById('thanksName');

            if (stepForm) stepForm.classList.add('modal-step--hidden');
            if (stepThanks) stepThanks.classList.remove('modal-step--hidden');
            if (thanksName) thanksName.textContent = name;
            pendingWelcomeBonus = false;
            trackGoal('lead_submitted');

            // При выборе звонка — дополнительно показываем номер прямо на экране благодарности
            if (messenger === 'call') {
                const thanksSubtitle = document.querySelector('#modalStepThanks .modal-subtitle');
                if (thanksSubtitle) {
                    thanksSubtitle.innerHTML = `Флорист получил заявку и позвонит вам. Если срочно — звоните сами: <a href="tel:+79501333361" style="color:var(--vetka-green,#6f7f48);font-weight:700;text-decoration:none">+7 (950) 133-33-61</a>`;
                }
            }
        })
        .catch(err => {
            console.error('Ошибка отправки заявки:', err);
            if (btn) { btn.classList.remove('form-submit-btn--loading'); btn.disabled = false; }
            if (generalError) generalError.classList.add('form-error--visible');
        });
}

// Навешиваем события при загрузке DOM
document.addEventListener('DOMContentLoaded', () => {
    // Маска телефона
    const phoneInput = document.getElementById('clientPhone');
    if (phoneInput) {
        phoneInput.addEventListener('input', () => applyPhoneMask(phoneInput));
        phoneInput.addEventListener('focus', () => {
            if (!phoneInput.value) phoneInput.value = '+7 ';
        });
    }

    // Отправка формы
    const form = document.getElementById('contactForm');
    if (form) form.addEventListener('submit', submitForm);

    // Закрытие по Escape и удержание клавиатурного фокуса внутри открытого диалога
    document.addEventListener('keydown', (e) => {
        const modal = document.getElementById('contactModal');
        if (!modal?.classList.contains('modal-active')) return;

        if (e.key === 'Escape') {
            closeContactModal();
            return;
        }

        if (e.key !== 'Tab') return;
        const focusable = Array.from(modal.querySelectorAll('button:not([disabled]), a[href], input:not([disabled]):not([type="hidden"]), textarea:not([disabled])'))
            .filter(element => !element.hidden && element.getAttribute('aria-hidden') !== 'true');
        if (!focusable.length) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
        }
    });
});



function closeBonusBadge() {
    const badge = document.getElementById('bonusBadge');
    if (!badge || badge.classList.contains('bonus-closing') || badge.classList.contains('bonus-hidden')) return;

    document.body.classList.remove('bonus-notice-visible');
    document.body.classList.remove('bonus-notice-compact');
    badge.classList.remove('bonus-compact');

    try {
        sessionStorage.setItem('vetkaBonusDismissed', '1');
    } catch (error) {
        // Страница может быть открыта локально с ограниченным доступом к хранилищу.
    }

    const finishClosing = () => {
        badge.classList.add('bonus-hidden');
        badge.classList.remove('bonus-closing');
    };

    badge.classList.add('bonus-closing');
    badge.addEventListener('animationend', finishClosing, { once: true });
    window.setTimeout(finishClosing, 500);
}

function restoreBonusBadgeState() {
    const badge = document.getElementById('bonusBadge');
    if (!badge) return;
    try {
        if (sessionStorage.getItem('vetkaBonusDismissed') === '1') {
            badge.classList.add('bonus-hidden');
        } else {
            document.body.classList.add('bonus-notice-visible');
        }
    } catch (error) {
        // Без sessionStorage уведомление всё равно остаётся полностью рабочим.
        document.body.classList.add('bonus-notice-visible');
    }
}

restoreBonusBadgeState();

// На первом экране бонус остаётся заметным. После начала просмотра сайта он
// превращается в компактное напоминание и перестаёт перекрывать контент.
let bonusPresentationFrame = null;

function updateBonusPresentation() {
    const badge = document.getElementById('bonusBadge');
    if (!badge) return;

    const shouldCompact = window.innerWidth <= 768 &&
        window.scrollY > Math.min(280, window.innerHeight * 0.38) &&
        !badge.classList.contains('bonus-hidden') &&
        !badge.classList.contains('bonus-closing') &&
        !badge.classList.contains('bonus-claimed');

    badge.classList.toggle('bonus-compact', shouldCompact);
    document.body.classList.toggle('bonus-notice-compact', shouldCompact);
}

function scheduleBonusPresentationUpdate() {
    if (bonusPresentationFrame !== null) return;
    bonusPresentationFrame = window.requestAnimationFrame(() => {
        bonusPresentationFrame = null;
        updateBonusPresentation();
    });
}

window.addEventListener('scroll', scheduleBonusPresentationUpdate, { passive: true });
window.addEventListener('resize', scheduleBonusPresentationUpdate);
window.addEventListener('load', updateBonusPresentation);

// Тяжёлое видео школы не загружается вместе с первым экраном. Оно начинает
// воспроизводиться без звука только когда пользователь доходит до блока школы.
const schoolVideo = document.getElementById('schoolVideo');
if (schoolVideo) {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!reducedMotion && 'IntersectionObserver' in window) {
        const schoolVideoObserver = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting && entry.intersectionRatio >= 0.12) {
                    schoolVideo.play().catch(() => {
                        // Автовоспроизведение может быть отключено настройками браузера.
                    });
                } else {
                    schoolVideo.pause();
                }
            });
        }, {
            rootMargin: '220px 0px',
            threshold: [0, 0.12]
        });

        schoolVideoObserver.observe(schoolVideo);
    }

    document.addEventListener('visibilitychange', () => {
        if (document.hidden) schoolVideo.pause();
    });
}

function parsePixelValue(value, fallback) {
    const parsedValue = parseInt(value, 10);
    return Number.isNaN(parsedValue) ? fallback : parsedValue;
}

function getAnchorOffset(target) {
    const rootStyles = getComputedStyle(document.documentElement);
    const baseOffset = parsePixelValue(rootStyles.getPropertyValue('--anchor-offset'), 120);

    if (!target) return baseOffset;

    const targetStyles = getComputedStyle(target);
    return parsePixelValue(targetStyles.getPropertyValue('--section-anchor-offset'), baseOffset);
}

function scrollToAnchor(targetId, behavior = 'smooth') {
    if (!targetId || targetId === '#') return false;

    const target = document.querySelector(targetId);
    if (!target) return false;

    const targetTop = target.getBoundingClientRect().top + window.scrollY - getAnchorOffset(target);
    window.scrollTo({
        top: Math.max(0, targetTop),
        behavior
    });

    return true;
}

document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', event => {
        const targetId = link.getAttribute('href');
        if (!targetId || targetId === '#') return;

        event.preventDefault();
        if (scrollToAnchor(targetId)) {
            history.pushState(null, '', targetId);
        }
    });
});

window.addEventListener('load', () => {
    if (window.location.hash) {
        window.setTimeout(() => scrollToAnchor(window.location.hash, 'auto'), 0);
    }
});



let currentReviewIndex = 0;

function updateReviewCounter(total) {
    const counter = document.getElementById('reviewCounter');
    if (counter) counter.textContent = `${currentReviewIndex + 1} / ${total}`;
}

function changeReviewSlide(direction) {
    const track = document.getElementById('reviews-track');
    const items = document.querySelectorAll('.review-slide-item-wide');

    if (!track || items.length === 0) return;

    // Проверяем ширину экрана пользователя в реальном времени
    const isMobile = window.innerWidth <= 768;

    // На мобилках листаем по 1 карточке, на десктопе — сразу по 3
    const step = isMobile ? 1 : 3;
    currentReviewIndex += (direction * step);

    // Круговая логика карусели
    if (currentReviewIndex >= items.length) {
        currentReviewIndex = 0;
    }
    if (currentReviewIndex < 0) {
        currentReviewIndex = isMobile ? items.length - 1 : items.length - 3;
    }

    if (isMobile) {
        const viewport = document.querySelector('.reviews-viewport-wide');
        const target = items[currentReviewIndex];
        if (viewport && target) {
            viewport.scrollTo({ left: target.offsetLeft, behavior: 'smooth' });
        }
        updateReviewCounter(items.length);
        return;
    }

    // Берём реальную ширину карточки (включая padding-right как зазор) напрямую из DOM,
    // а не хардкодим число в пикселях — так сдвиг никогда не разойдётся с фактической раскладкой
    const cardWidth = items[0].getBoundingClientRect().width;
    const shiftAmount = currentReviewIndex * cardWidth;

    track.style.transform = `translateX(-${shiftAmount}px)`;
    updateReviewCounter(items.length);
}

const reviewsViewport = document.querySelector('.reviews-viewport-wide');
reviewsViewport?.addEventListener('scroll', event => {
    if (window.innerWidth > 768) return;
    const items = Array.from(document.querySelectorAll('.review-slide-item-wide'));
    if (!items.length) return;
    const itemStep = items.length > 1
        ? items[1].offsetLeft - items[0].offsetLeft
        : items[0].getBoundingClientRect().width;
    if (!itemStep) return;
    currentReviewIndex = Math.max(0, Math.min(items.length - 1, Math.round(event.currentTarget.scrollLeft / itemStep)));
    updateReviewCounter(items.length);
}, { passive: true });

updateReviewCounter(document.querySelectorAll('.review-slide-item-wide').length);

function setSchoolCourse(index) {
    const tabs = document.querySelectorAll('[data-school-course]');
    const courses = document.querySelectorAll('.courses-list .course-item');
    tabs.forEach((tab, tabIndex) => {
        const active = tabIndex === index;
        tab.classList.toggle('is-active', active);
        tab.setAttribute('aria-selected', String(active));
    });
    courses.forEach((course, courseIndex) => {
        course.classList.toggle('is-mobile-active', courseIndex === index);
    });
}

document.querySelectorAll('[data-school-course]').forEach((tab, index) => {
    tab.addEventListener('click', () => setSchoolCourse(index));
});

document.querySelectorAll('.care-card').forEach(card => {
    card.addEventListener('toggle', () => {
        if (window.innerWidth > 768 || !card.open) return;
        document.querySelectorAll('.care-card').forEach(otherCard => {
            if (otherCard !== card) otherCard.open = false;
        });
    });
});

// ===== КАТАЛОГ ПО КАТЕГОРИЯМ =====
// Пока используются уже согласованные изображения проекта. Когда появятся реальные фото каталога,
// достаточно заменить пути, названия и цены в этом объекте — интерфейс и мобильная версия не меняются.
const CATALOG_DATA = window.VETKA_CATALOG_DATA || {
    bouquets: {
        title: 'Букеты',
        description: 'Авторские букеты с живой формой: от мягких сезонных сочетаний до выразительной графики.',
        products: [
            { image: 'images/hero-light-1.jpg', title: 'Авторский сезонный букет', description: 'Свободная форма и свежий сезонный состав. Цветовую гамму согласуем перед сборкой.', price: '8 500 ₽' },
            { image: 'images/hero-light-2.jpg', title: 'Нежная коллекция', description: 'Воздушный букет в светлой гамме для подарка, события или особенного дня.', price: '9 800 ₽' },
            { image: 'images/summcollect.jpg', title: 'Летний акцент', description: 'Яркий сезонный букет с природной графикой и характерными деталями.', price: '11 200 ₽' }
        ]
    },
    compositions: {
        title: 'Композиции',
        description: 'Готовые формы в устойчивой основе — удобно подарить, поставить дома или отправить доставкой.',
        products: [
            { image: 'images/flagship1.jpg', title: 'Асимметрия. Гортензия и каллы', description: 'Плотное ядро гортензии уравновешено строгой графикой калл.', price: '8 500 ₽' },
            { image: 'images/flagship2.jpg', title: 'Акцентный нуар', description: 'Выразительная композиция с глубокими оттенками и глянцевой зеленью.', price: '9 800 ₽' },
            { image: 'images/flagship3.jpg', title: 'Интерьерный концепт. Нутан', description: 'Огненная структура нутана и бархатный нуар тёмных диантусов.', price: '11 200 ₽' }
        ]
    },
    interior: {
        title: 'Интерьерные композиции',
        description: 'Цветочные объекты под пространство дома, офиса, студии, ресторана или шоурума.',
        products: [
            { image: 'images/flagship3.jpg', title: 'Интерьерный концепт', description: 'Арт-композиция, которая работает как самостоятельный акцент в пространстве.', price: '11 200 ₽' },
            { image: 'images/catalog-compositions.jpg', title: 'Композиция для пространства', description: 'Подбираем масштаб, линию и цвет под интерьер и освещение.', price: '9 800 ₽' },
            { image: 'images/salon-space.jpg', title: 'Сезонный объект', description: 'Живая композиция для стойки, стола, витрины или зоны встречи гостей.', price: '8 500 ₽' }
        ]
    },
    gifts: {
        title: 'Вазы и подарки',
        description: 'Готовые подарочные решения: цветы, вазы и детали, которые легко вручить и приятно оставить дома.',
        products: [
            { image: 'images/catalog-gifts.jpg', title: 'Ваза с сезонными цветами', description: 'Готовый комплект: подходящая ваза и собранная под неё композиция.', price: '8 500 ₽' },
            { image: 'images/flagship1.jpg', title: 'Подарочная композиция', description: 'Выразительный подарок, который не требует пересадки в вазу.', price: '9 800 ₽' },
            { image: 'images/flagship2.jpg', title: 'Цветочный подарок с характером', description: 'Акцентная палитра и необычные фактуры для особенного повода.', price: '11 200 ₽' }
        ]
    },
    wedding: {
        title: 'Свадебное',
        description: 'Букет невесты и оформление разрабатываем индивидуально под образ, площадку и настроение события.',
        products: [
            { image: 'images/catalog-wedding.jpg', title: 'Букет невесты', description: 'Собираем форму и гамму под образ, платье, сезон и формат церемонии.', price: '8 500 ₽' },
            { image: 'images/flagship1.jpg', title: 'Свадебная композиция', description: 'Композиция для стола, welcome-зоны или камерной церемонии.', price: '9 800 ₽' },
            { image: 'images/school-cover.jpg', title: 'Оформление', description: 'Проект разрабатывается индивидуально: от общей концепции до подбора цветочного материала и монтажа.', price: null, action: 'Рассчитать' }
        ]
    }
};

const desktopCatalogDropdown = document.getElementById('desktopCatalogDropdown');
const desktopCatalogToggle = document.getElementById('desktopCatalogToggle');
const mobileCatalogToggle = document.getElementById('mobileCatalogToggle');
const mobileCatalogPanel = document.getElementById('mobileCatalogPanel');
const mobileCatalogClose = document.getElementById('mobileCatalogClose');

function closeHeaderCatalogMenus() {
    desktopCatalogDropdown?.classList.remove('is-open');
    desktopCatalogToggle?.setAttribute('aria-expanded', 'false');
    mobileCatalogPanel?.classList.remove('is-open');
    mobileCatalogPanel?.setAttribute('aria-hidden', 'true');
    mobileCatalogToggle?.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('catalog-menu-open');
}

desktopCatalogToggle?.addEventListener('click', event => {
    event.stopPropagation();
    const shouldOpen = !desktopCatalogDropdown?.classList.contains('is-open');
    closeHeaderCatalogMenus();
    if (shouldOpen) {
        desktopCatalogDropdown?.classList.add('is-open');
        desktopCatalogToggle.setAttribute('aria-expanded', 'true');
    }
});

mobileCatalogToggle?.addEventListener('click', () => {
    const shouldOpen = !mobileCatalogPanel?.classList.contains('is-open');
    closeHeaderCatalogMenus();
    if (shouldOpen) {
        mobileCatalogPanel?.classList.add('is-open');
        mobileCatalogPanel?.setAttribute('aria-hidden', 'false');
        mobileCatalogToggle.setAttribute('aria-expanded', 'true');
        document.body.classList.add('catalog-menu-open');
    }
});

mobileCatalogClose?.addEventListener('click', closeHeaderCatalogMenus);

document.addEventListener('click', event => {
    if (desktopCatalogDropdown?.classList.contains('is-open') && !desktopCatalogDropdown.contains(event.target)) {
        closeHeaderCatalogMenus();
    }
    if (mobileCatalogPanel?.classList.contains('is-open') &&
        !mobileCatalogPanel.contains(event.target) &&
        !mobileCatalogToggle?.contains(event.target)) {
        closeHeaderCatalogMenus();
    }
});

document.addEventListener('keydown', event => {
    if (event.key === 'Escape') closeHeaderCatalogMenus();
});

window.addEventListener('resize', () => {
    if (window.innerWidth > 768 && mobileCatalogPanel?.classList.contains('is-open')) {
        closeHeaderCatalogMenus();
    }
});

let catalogProductIndex = 0;

function updateCatalogCounter() {
    const cards = document.querySelectorAll('#catalogProducts .product-card');
    const counter = document.getElementById('catalogCounter');
    if (!counter) return;
    counter.textContent = `${Math.min(catalogProductIndex + 1, Math.max(cards.length, 1))} / ${Math.max(cards.length, 1)}`;
}

function resetCatalogCarousel() {
    catalogProductIndex = 0;
    const grid = document.getElementById('catalogProducts');
    if (grid) grid.scrollLeft = 0;
    updateCatalogCounter();
}

function moveCatalogCarousel(direction) {
    const grid = document.getElementById('catalogProducts');
    const cards = Array.from(document.querySelectorAll('#catalogProducts .product-card'));
    if (!grid || !cards.length) return;
    catalogProductIndex = (catalogProductIndex + direction + cards.length) % cards.length;
    grid.scrollTo({ left: cards[catalogProductIndex].offsetLeft - grid.offsetLeft, behavior: 'smooth' });
    updateCatalogCounter();
}

function renderCatalogCategory(categoryKey) {
    const category = CATALOG_DATA[categoryKey] || CATALOG_DATA.bouquets;
    const grid = document.getElementById('catalogProducts');
    const intro = document.getElementById('catalogCategoryIntro');
    if (!grid || !intro) return;

    document.querySelectorAll('[data-catalog-category]').forEach(button => {
        const active = button.dataset.catalogCategory === categoryKey;
        button.classList.toggle('is-active', active);
        button.setAttribute('aria-selected', String(active));
    });

    intro.innerHTML = `<span>${category.title}</span><p>${category.description}</p>`;
    grid.innerHTML = category.products.map(product => {
        const action = product.action || 'Хочу этот вариант';
        const price = product.price
            ? `<span class="price">${product.price}</span>`
            : '<span class="price price--request">Стоимость рассчитывается индивидуально</span>';

        return `
            <article class="product-card">
                <div class="product-img-box">
                    <img src="${product.image}" alt="${product.title} — ВЕТКА" loading="lazy">
                </div>
                <div class="product-info">
                    <span class="product-category-label">${category.title}</span>
                    <h3>${product.title}</h3>
                    <p class="product-desc">${product.description}</p>
                    <div class="product-footer">
                        ${price}
                        <button class="btn-buy" type="button" data-catalog-order="${product.title}">${action}</button>
                    </div>
                </div>
            </article>`;
    }).join('');
    resetCatalogCarousel();
}

document.querySelectorAll('[data-catalog-category]').forEach(button => {
    button.addEventListener('click', () => renderCatalogCategory(button.dataset.catalogCategory));
});

document.querySelectorAll('[data-catalog-feature]').forEach(button => {
    button.addEventListener('click', () => {
        renderCatalogCategory(button.dataset.catalogFeature);
        document.getElementById('catalogCategoryIntro')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
});

document.querySelectorAll('[data-catalog-nav]').forEach(button => {
    button.addEventListener('click', () => {
        button.blur();
        closeHeaderCatalogMenus();
        window.location.href = `catalog.html?category=${encodeURIComponent(button.dataset.catalogNav)}`;
    });
});

document.getElementById('catalogProducts')?.addEventListener('click', event => {
    const orderButton = event.target.closest('[data-catalog-order]');
    if (!orderButton) return;
    openContactModal('catalog', orderButton.dataset.catalogOrder);
});

renderCatalogCategory('bouquets');

document.getElementById('catalogPrev')?.addEventListener('click', () => moveCatalogCarousel(-1));
document.getElementById('catalogNext')?.addEventListener('click', () => moveCatalogCarousel(1));

document.getElementById('catalogProducts')?.addEventListener('scroll', event => {
    if (window.innerWidth > 768) return;
    const card = event.currentTarget.querySelector('.product-card');
    if (!card || !card.offsetWidth) return;
    const cardCount = event.currentTarget.querySelectorAll('.product-card').length;
    catalogProductIndex = Math.max(0, Math.min(cardCount - 1, Math.round(event.currentTarget.scrollLeft / card.offsetWidth)));
    updateCatalogCounter();
}, { passive: true });

// ===== БУКЕТ ДНЯ ИЗ TELEGRAM =====
// Если синхронизация ещё не настроена или Telegram временно недоступен,
// карточка остаётся с аккуратным запасным контентом из разметки.
async function loadBouquetDay() {
    const card = document.getElementById('bouquetDayCard');
    if (!card) return;

    try {
        const response = await fetch('/api/bouquet-day', {
            headers: { Accept: 'application/json' },
            cache: 'no-store',
        });
        if (!response.ok) return;

        const payload = await response.json();
        const bouquet = payload?.bouquet;
        if (!bouquet?.title) return;

        const title = document.getElementById('bouquetDayTitle');
        const price = document.getElementById('bouquetDayPrice');
        const oldPrice = document.getElementById('bouquetDayOldPrice');
        const discount = document.getElementById('bouquetDayDiscount');
        const image = document.getElementById('bouquetDayImage');
        const link = document.getElementById('bouquetDayLink');

        const formatPrice = value => {
            const match = String(value || '').match(/(\d[\d\s]*)\s*(₽|руб(?:\.|лей)?)/i);
            if (!match) return String(value || '');
            const amount = Number(match[1].replace(/\s/g, '')).toLocaleString('ru-RU');
            return `${amount} ₽`;
        };

        if (title) title.textContent = bouquet.title;
        if (price) price.textContent = bouquet.price ? formatPrice(bouquet.price) : 'Цена — по запросу';
        if (oldPrice) {
            oldPrice.hidden = !bouquet.oldPrice;
            oldPrice.textContent = bouquet.oldPrice ? formatPrice(bouquet.oldPrice) : '';
        }
        if (discount) {
            discount.hidden = !bouquet.discountPercent;
            discount.textContent = bouquet.discountPercent ? `−${bouquet.discountPercent}%` : '';
        }
        if (image && bouquet.photoUrl) {
            image.addEventListener('error', () => {
                image.src = 'images/hero-light-1.jpg';
            }, { once: true });
            image.src = bouquet.photoUrl;
            image.alt = `${bouquet.title} — букет дня ВЕТКА`;
        }
        if (link && bouquet.sourcePostUrl) link.href = bouquet.sourcePostUrl;
        card.classList.add('is-synced');
    } catch (error) {
        console.info('Букет дня остаётся на запасном контенте:', error);
    }
}

loadBouquetDay();

// Заказ из отдельной страницы каталога открываем сразу в форме на главной.
const requestedCatalogItem = new URLSearchParams(window.location.search).get('order');
if (requestedCatalogItem) {
    window.setTimeout(() => openContactModal('catalog', requestedCatalogItem), 120);
}

// ===== МОБИЛЬНЫЙ ПОШАГОВЫЙ КОНСТРУКТОР =====
function setConstructorMobileStep(stepName, shouldScroll = true) {
    const block = document.querySelector('.constructor-block');
    if (!block) return;
    block.dataset.mobileActive = stepName;

    document.querySelectorAll('[data-constructor-step]').forEach(button => {
        const active = button.dataset.constructorStep === stepName;
        button.classList.toggle('is-active', active);
        button.setAttribute('aria-current', active ? 'step' : 'false');
    });

    if (shouldScroll && window.innerWidth <= 768) {
        document.querySelector('.constructor-mobile-progress')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

document.querySelectorAll('[data-constructor-step]').forEach(button => {
    button.addEventListener('click', () => setConstructorMobileStep(button.dataset.constructorStep));
});

document.querySelectorAll('[data-constructor-go]').forEach(button => {
    button.addEventListener('click', () => setConstructorMobileStep(button.dataset.constructorGo));
});

// Базовое фото меняется по формату — единственная ось, для которой реально нужна отдельная фотография.
// Пока это плейсхолдеры из существующих фото каталога — когда будут отдельные фото под каждый формат,
// просто замени пути здесь.
const CONSTRUCTOR_BASE_IMAGES = {
    composition: 'images/catalog-compositions.jpg',
    bouquet: 'images/hero-light-1.jpg',
    bridal: 'images/hero-light-2.jpg',
    interior: 'images/catalog-gifts.jpg'
};

// Цвет и подпись акцентного цветка — рисуем цветным бейджем поверх фото, а не отдельной фотографией.
// "other" — нейтральный вариант без цвета/фото, просто просьба уточнить у флориста при созвоне.
const CONSTRUCTOR_FLOWER_ACCENTS = {
    lily:          { color: '#F7F3E8', label: 'Лилия' },
    gerbera:       { color: '#E8734A', label: 'Гербера' },
    'french-rose': { color: '#E8A0B4', label: 'Французская роза' },
    sunflower:     { color: '#F4C430', label: 'Подсолнух' },
    greenball:     { color: '#7CB342', label: 'Гринбол' },
    other:         { color: 'transparent', label: 'Уточним у флориста' }
};

// Цветовая гамма меняет визуальную обработку самого фото через CSS-фильтр — без новых фотографий
const CONSTRUCTOR_MOOD_CLASSES = ['mood-soft', 'mood-graphic', 'mood-bold'];
const CONSTRUCTOR_MOOD_MAP = {
    bright: 'mood-bold',
    soft: 'mood-soft',
    contrast: 'mood-graphic'
};

function applyOption(button) {
    const category = button.dataset.cat;
    const optionName = button.dataset.val;
    const selectedText = button.textContent.trim();

    // 1. Снимаем подсветку у всех кнопок этой категории, зажигаем у нажатой
    document.querySelectorAll(`.opt-btn[data-cat="${category}"]`).forEach(btn => {
        btn.classList.remove('active-opt');
    });
    button.classList.add('active-opt');

    // 2. Синхронизируем data-атрибуты превью — CSS и логика ниже читают именно их
    const preview = document.getElementById('bouquet-preview');
    if (preview) {
        preview.setAttribute(`data-${category}`, optionName);
    }

    const summary = document.getElementById(`summary-${category}`);
    if (summary) {
        summary.textContent = selectedText;
    }

    if (!preview) return;

    // 3. Фото — только по формату (единственная ось, которая реально меняет композицию снимка)
    const previewImage = document.getElementById('constructorPreviewImage');
    const baseValue = preview.getAttribute('data-base');
    if (previewImage && CONSTRUCTOR_BASE_IMAGES[baseValue]) {
        previewImage.src = CONSTRUCTOR_BASE_IMAGES[baseValue];
    }

    // 4. Цветовой бейдж — по выбранному акцентному цветку
    const flowerValue = preview.getAttribute('data-flower');
    const accent = CONSTRUCTOR_FLOWER_ACCENTS[flowerValue];
    if (accent) {
        const dot = document.getElementById('flowerAccentDot');
        const name = document.getElementById('flowerAccentName');
        if (dot) dot.style.background = accent.color;
        if (name) name.textContent = accent.label;
    }

    // 5. Настроение — фильтр на фото, отражает "характер" без отдельной фотографии
    const characterValue = preview.getAttribute('data-character');
    const moodClass = CONSTRUCTOR_MOOD_MAP[characterValue];
    if (previewImage) {
        previewImage.classList.remove(...CONSTRUCTOR_MOOD_CLASSES);
        if (moodClass) previewImage.classList.add(moodClass);
    }
}

// Навешиваем по одному слушателю на каждую кнопку конструктора при загрузке страницы
document.querySelectorAll('.opt-btn[data-cat]').forEach(button => {
    button.addEventListener('click', () => applyOption(button));
});

// ===== ЛЁГКИЙ ПАРАЛЛАКС ДЕКОРАТИВНЫХ ЭЛЕМЕНТОВ HERO =====
// Ветка, папоротники и туман двигаются с разной скоростью при скролле — создаёт ощущение глубины.
// requestAnimationFrame + флаг ticking, чтобы не вызывать пересчёт стилей чаще, чем браузер успевает рисовать кадр.
(function initHeroParallax() {
    const branch = document.querySelector('.hero-branch-decor');
    const fernLeft = document.querySelector('.fern-left');
    const fernRight = document.querySelector('.fern-right');
    const fog = document.querySelector('.hero-fog');

    if (!branch && !fernLeft && !fernRight && !fog) return;

    let ticking = false;

    function applyParallax() {
        const y = window.scrollY;

        // Каждый слой двигается со своим коэффициентом — чем дальше "на фоне", тем медленнее.
        // ВАЖНО: у папоротников в CSS уже есть свой transform (поворот/зеркало) — его нельзя
        // перезаписывать инлайн-стилем, поэтому translateY всегда идёт ПЕРЕД сохранённым поворотом.
        if (branch) branch.style.transform = `translateY(${y * 0.15}px)`;
        if (fernLeft) fernLeft.style.transform = `translateY(${y * 0.08}px) rotate(25deg)`;
        if (fernRight) fernRight.style.transform = `translateY(${y * 0.08}px) rotate(-35deg) scaleX(-1)`;
        if (fog) fog.style.transform = `translateY(${y * 0.25}px)`;

        ticking = false;
    }

    window.addEventListener('scroll', () => {
        if (!ticking) {
            window.requestAnimationFrame(applyParallax);
            ticking = true;
        }
    });
})();

// ===== АНАЛИТИКА: клики по внешним контактам (телефон/мессенджеры) =====
// Один делегированный обработчик на весь документ — не нужно вешать слушатель на каждую ссылку отдельно
document.addEventListener('click', event => {
    const link = event.target.closest('a[href]');
    if (!link) return;

    const href = link.getAttribute('href');
    if (href.startsWith('tel:')) {
        trackGoal('phone_click');
    } else if (href.includes('t.me/') || href.includes('max.ru/')) {
        trackGoal('messenger_click');
    } else if (href.includes('wa.me/')) {
        trackGoal('whatsapp_click');
    } else if (href.includes('instagram.com/')) {
        trackGoal('instagram_click');
    }
});

// ===== SCROLL-REVEAL: плавное появление карточек и заголовков при прокрутке =====
(function () {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return; // уважаем настройки доступности — ничего не анимируем

    const selectors = [
        '.section-title', '.section-subtitle',
        '.category-card', '.product-card', '.service-card',
        '.review-photo-card', '.course-item', '.care-card',
        '.subscription-mini-gallery img', '.total-box'
    ];

    const targets = document.querySelectorAll(selectors.join(', '));
    if (!targets.length) return;

    targets.forEach(el => el.classList.add('reveal-init'));

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, i) => {
            if (entry.isIntersecting) {
                // Небольшая ступенчатая задержка для карточек в одном ряду — оживляет появление
                const delay = Math.min(i * 60, 240);
                entry.target.style.transitionDelay = `${delay}ms`;
                entry.target.classList.add('reveal-visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

    targets.forEach(el => observer.observe(el));
})();

