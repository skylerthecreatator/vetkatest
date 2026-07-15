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

// Человек кликнул "Смотреть каталог" в промо-плашке, но ещё не выбрал букет —
// запоминаем, что промокод в игре, и подставим его в комментарий, когда он всё же откроет форму
let pendingPromoCode = false;

function rememberPromoCode() {
    pendingPromoCode = true;
}

function openContactModal(source = 'unknown', detail = '') {
    const modal = document.getElementById('contactModal');
    if (!modal) return;

    // Сброс формы к чистому состоянию — ВАЖНО делать это ДО заполнения source/detail,
    // иначе form.reset() внутри resetModal() затирает уже проставленные скрытые поля
    resetModal();

    // Запоминаем источник в скрытом поле формы
    const sourceField = document.getElementById('formSource');
    if (sourceField) sourceField.value = source;

    // Запоминаем деталь источника (например, название конкретного букета из каталога)
    const detailField = document.getElementById('formSourceDetail');
    if (detailField) detailField.value = detail;

    // Промокод — если человек ранее кликал "Смотреть каталог" в промо-плашке, подставляем
    // напоминание в комментарий вне зависимости от того, откуда именно он в итоге открыл форму
    if (pendingPromoCode) {
        const commentField = document.getElementById('clientComment');
        if (commentField && !commentField.value.trim()) {
            commentField.value = 'Промокод: VETKA500';
        }
    }

    // Меняем подзаголовок модалки под контекст
    const subtitle = document.getElementById('modalSubtitleText');
    if (subtitle && SOURCE_LABELS[source]) {
        subtitle.textContent = 'Флорист свяжется с вами и ответит на все вопросы';
    }

    modal.classList.add('modal-active');
    document.body.style.overflow = 'hidden';

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
    modal.classList.remove('modal-active');
    document.body.style.overflow = ''; // возвращаем прокрутку
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
        body: JSON.stringify({ name, phone, messenger, source, sourceLabel, sourceDetail, comment, website }),
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
            pendingPromoCode = false;
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

    // Закрытие по Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeContactModal();
    });
});



function closeBonusBadge() {
    const badge = document.getElementById('bonusBadge');
    if (!badge || badge.classList.contains('bonus-closing') || badge.classList.contains('bonus-hidden')) return;

    const finishClosing = () => {
        badge.classList.add('bonus-hidden');
        badge.classList.remove('bonus-closing');
    };

    badge.classList.add('bonus-closing');
    badge.addEventListener('animationend', finishClosing, { once: true });
    window.setTimeout(finishClosing, 1500);
}

function copyPromoCode() {
    const code = 'VETKA500';
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(code).catch(() => {});
    }

    const badge = document.getElementById('bonusBadge');
    if (badge) {
        badge.classList.add('bonus-copied');
        window.setTimeout(() => badge.classList.remove('bonus-copied'), 1800);
    }
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

    // Берём реальную ширину карточки (включая padding-right как зазор) напрямую из DOM,
    // а не хардкодим число в пикселях — так сдвиг никогда не разойдётся с фактической раскладкой
    const cardWidth = items[0].getBoundingClientRect().width;
    const shiftAmount = currentReviewIndex * cardWidth;

    track.style.transform = `translateX(-${shiftAmount}px)`;
}

// Базовое фото меняется по формату — единственная ось, для которой реально нужна отдельная фотография.
// Пока это плейсхолдеры из существующих фото каталога — когда будут отдельные фото под каждый формат
// (композиция / раскидистый букет / на кензане), просто замени пути здесь.
const CONSTRUCTOR_BASE_IMAGES = {
    composition: 'images/hero-light-1.jpg',
    loose: 'images/hero-light-2.jpg',
    kenzan: 'images/catalog-compositions.jpg'
};

// Цвет и подпись акцентного цветка — рисуем цветным бейджем поверх фото, а не отдельной фотографией
const CONSTRUCTOR_FLOWER_ACCENTS = {
    lily:          { color: '#F7F3E8', label: 'Лилия' },
    gerbera:       { color: '#E8734A', label: 'Гербера' },
    'french-rose': { color: '#E8A0B4', label: 'Французская роза' },
    sunflower:     { color: '#F4C430', label: 'Подсолнух' },
    greenball:     { color: '#7CB342', label: 'Гринбол' }
};

// Настроение меняет визуальную обработку самого фото через CSS-фильтр — без новых фотографий
const CONSTRUCTOR_MOOD_CLASSES = ['mood-soft', 'mood-graphic', 'mood-bold'];
const CONSTRUCTOR_MOOD_MAP = {
    soft: 'mood-soft',
    graphic: 'mood-graphic',
    dog: 'mood-bold' // "Смело и с характером" — исходное служебное имя в data-атрибуте не меняли, чтобы не трогать лишний раз разметку
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

