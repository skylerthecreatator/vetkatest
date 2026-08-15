const bouquetReference = 'Соберём букет в похожей форме и палитре из свежего сезонного материала.';
const compositionReference = 'Подберём свежий сезонный состав в похожем настроении и согласуем оттенки перед сборкой.';
const interiorReference = 'Соберём цветочную работу для дома, студии или офиса — с учётом пространства и вашего настроения.';
const weddingReference = 'Соберём свадебный букет в похожем настроении и согласуем детали с вашим образом.';

const catalogMedia = window.VETKA_CATALOG_MEDIA || {};
const weddingCover = 'images/wedding-soft-cover.jpg';
const weddingEditorialCover = 'images/wedding-editorial-cover.jpg';

function priceFromFilename(file) {
    const match = String(file).match(/(?:^|[^\d])(\d{4,5})\s*(?:rub|р|₽)/i);
    return match ? `${Number(match[1]).toLocaleString('ru-RU')} ₽` : null;
}

function makeWorks(folder, files, config) {
    return (files || []).map((file, index) => ({
        image: `images/catalog/${folder}/${file}`,
        title: `${config.itemName} № ${index + 1}`,
        description: config.description,
        price: priceFromFilename(file),
        action: 'Хочу этот вариант',
        group: config.group,
    }));
}

const bouquetWorks = makeWorks('bouquets', catalogMedia.bouquets, {
    itemName: 'Авторский букет',
    description: bouquetReference,
    group: 'Авторские букеты',
});

const compositionWorks = makeWorks('compositions', catalogMedia.compositions, {
    itemName: 'Композиция',
    description: compositionReference,
    group: 'Композиции для особенных поводов',
});

const interiorWorks = makeWorks('interior', catalogMedia.interior, {
    itemName: 'Интерьерная композиция',
    description: interiorReference,
    group: 'Цветы для пространства',
});

const weddingWorks = makeWorks('wedding', catalogMedia.wedding, {
    itemName: 'Свадебный букет',
    description: weddingReference,
    group: 'Свадебные букеты',
});

const giftWorks = [
    {
        image: 'images/catalog/gifts/gift-01-kenzan-metal-570-1550.jpg',
        title: 'Кензан металлический',
        description: 'Металлическая основа для устойчивой фиксации стеблей в вазе, кашпо или интерьерной композиции.',
        price: 'от 570 до 1 550 ₽',
        action: 'Хочу этот вариант',
        group: 'Инструменты и детали',
    },
    {
        image: 'images/catalog/gifts/gift-02-kashpo-kenzan-440.jpg',
        title: 'Кашпо для кензана',
        description: 'Минималистичное кашпо для кензана и небольших цветочных работ.',
        price: '440 ₽',
        action: 'Хочу этот вариант',
        group: 'Кашпо и основы',
    },
    {
        image: 'images/catalog/gifts/gift-03-kashpo-kenzan-460.jpg',
        title: 'Кашпо для кензана',
        description: 'Компактная основа для кензана, чтобы собрать аккуратную настольную композицию.',
        price: '460 ₽',
        action: 'Хочу этот вариант',
        group: 'Кашпо и основы',
    },
    {
        image: 'images/catalog/gifts/gift-04-kenzan-metal-gold-380-1550.jpg',
        title: 'Кензан металлический, золото',
        description: 'Акцентная основа для композиций с тёплым металлическим оттенком.',
        price: 'от 380 до 1 550 ₽',
        action: 'Хочу этот вариант',
        group: 'Инструменты и детали',
    },
    {
        image: 'images/catalog/gifts/gift-05-baran-plush-1400.jpg',
        title: 'Барашек плюшевый',
        description: 'Мягкое дополнение к букету или самостоятельный нежный подарок.',
        price: '1 400 ₽',
        action: 'Хочу этот вариант',
        group: 'Плюшевые подарки',
    },
    {
        image: 'images/catalog/gifts/gift-06-vase-white-2750.jpg',
        title: 'Ваза белая рельефная',
        description: 'Высокая фактурная ваза для лаконичных букетов и интерьерных веток.',
        price: '2 750 ₽',
        action: 'Хочу этот вариант',
        group: 'Вазы',
    },
    {
        image: 'images/catalog/gifts/gift-07-bear-plush-960.jpg',
        title: 'Медведь плюшевый',
        description: 'Милое дополнение к цветам для тёплого подарка.',
        price: '960 ₽',
        action: 'Хочу этот вариант',
        group: 'Плюшевые подарки',
    },
    {
        image: 'images/catalog/gifts/gift-08-cow-plush-1700.jpg',
        title: 'Коровка плюшевая',
        description: 'Мягкий подарок, который можно добавить к букету или вручить отдельно.',
        price: '1 700 ₽',
        action: 'Хочу этот вариант',
        group: 'Плюшевые подарки',
    },
    {
        image: 'images/catalog/gifts/gift-09-big-bear-1600.jpg',
        title: 'Медведь большой',
        description: 'Большой мягкий подарок для выразительного поздравления.',
        price: '1 600 ₽',
        action: 'Хочу этот вариант',
        group: 'Плюшевые подарки',
    },
    {
        image: 'images/catalog/gifts/gift-10-vase-amber-1350.jpg',
        title: 'Ваза янтарная',
        description: 'Тёплая стеклянная ваза для букета или домашней композиции.',
        price: '1 350 ₽',
        action: 'Хочу этот вариант',
        group: 'Вазы',
    },
    {
        image: 'images/catalog/gifts/gift-11-bear-plush-white-960.jpg',
        title: 'Медведь плюшевый белый',
        description: 'Мягкий белый медведь как милое дополнение к букету или самостоятельный подарок.',
        price: '960 ₽',
        action: 'Хочу этот вариант',
        group: 'Плюшевые подарки',
    },
    {
        image: 'images/catalog/gifts/gift-12-vase-smoke-round-2100.jpg',
        title: 'Ваза дымчатая округлая',
        description: 'Стеклянная ваза с мягким дымчатым оттенком для спокойных интерьерных букетов.',
        price: '2 100 ₽',
        action: 'Хочу этот вариант',
        group: 'Вазы',
    },
    {
        image: 'images/catalog/gifts/gift-13-vase-clear-round-800.jpg',
        title: 'Ваза-шар прозрачная',
        description: 'Лаконичная круглая ваза для небольших букетов, зелени и воздушных композиций.',
        price: '800 ₽',
        action: 'Хочу этот вариант',
        group: 'Вазы',
    },
    {
        image: 'images/catalog/gifts/gift-14-vase-blue-textured-750.jpg',
        title: 'Ваза голубая фактурная',
        description: 'Фактурная стеклянная ваза с прохладным оттенком для свежего цветочного акцента.',
        price: '750 ₽',
        action: 'Хочу этот вариант',
        group: 'Вазы',
    },
    {
        image: 'images/catalog/gifts/gift-15-vase-clear-ribbed-1350.jpg',
        title: 'Ваза прозрачная гранёная',
        description: 'Прозрачная ваза с рельефными гранями — универсальная база для сезонного букета.',
        price: '1 350 ₽',
        action: 'Хочу этот вариант',
        group: 'Вазы',
    },
    {
        image: 'images/catalog/gifts/gift-16-vase-smoke-tall-2200.jpg',
        title: 'Ваза дымчатая высокая',
        description: 'Высокая рельефная ваза для вытянутых букетов, веток и интерьерной графики.',
        price: '2 200 ₽',
        action: 'Хочу этот вариант',
        group: 'Вазы',
    },
    {
        image: 'images/catalog/gifts/gift-17-vase-clear-oval-2100.jpg',
        title: 'Ваза прозрачная округлая',
        description: 'Округлая прозрачная ваза для объёмных букетов и мягких домашних композиций.',
        price: '2 100 ₽',
        action: 'Хочу этот вариант',
        group: 'Вазы',
    },
    {
        image: 'images/catalog/gifts/gift-18-vase-ceramic-textured-4300.jpg',
        title: 'Ваза керамическая фактурная',
        description: 'Выразительная керамическая ваза с природной фактурой для интерьерного акцента.',
        price: '4 300 ₽',
        action: 'Хочу этот вариант',
        group: 'Вазы',
    },
    {
        image: 'images/catalog/gifts/gift-19-vase-lotus-1290.jpg',
        title: 'Ваза «Лотос»',
        description: 'Низкая ваза-лотос для коротких стеблей, кензана и аккуратных настольных работ.',
        price: '1 290 ₽',
        action: 'Хочу этот вариант',
        group: 'Вазы',
    },
    {
        image: 'images/catalog/gifts/gift-20-vase-pink-set-1600.jpg',
        title: 'Набор розовых ваз',
        description: 'Две декоративные розовые вазы для парного интерьерного акцента.',
        price: '1 600 ₽ за обе',
        action: 'Хочу этот вариант',
        group: 'Вазы',
    },
];

const cover = (works, fallback) => works[0]?.image || fallback;

window.VETKA_CATALOG_DATA = {
    bouquets: {
        title: 'Букеты',
        shortTitle: 'Букеты',
        description: 'Живые букеты, собранные с вниманием к линии, воздуху и сезонному материалу. Выберите настроение — повторим его в вашем составе.',
        cover: cover(bouquetWorks, 'images/hero-light-1.jpg'),
        products: bouquetWorks,
    },
    compositions: {
        title: 'Композиции',
        shortTitle: 'Композиции',
        description: 'Готовые формы для подарка, дома и события. Каждая работа остаётся живой и немного неповторимой.',
        cover: cover(compositionWorks, cover(bouquetWorks, 'images/hero-light-1.jpg')),
        products: compositionWorks,
    },
    interior: {
        title: 'Интерьерные композиции',
        shortTitle: 'Интерьерные',
        description: 'Цветочная форма, которая раскрывает пространство: дом, офис, студию или особенный стол.',
        cover: cover(interiorWorks, cover(compositionWorks, 'images/hero-light-1.jpg')),
        products: interiorWorks,
    },
    gifts: {
        title: 'Вазы и подарки',
        shortTitle: 'Вазы и подарки',
        description: 'Вазы, кензаны, кашпо и мягкие дополнения к цветам: можно выбрать готовый предмет или собрать подарок вместе с букетом.',
        cover: cover(giftWorks, 'images/catalog/gifts/gift-10-vase-amber-1350.jpg'),
        products: giftWorks,
    },
    wedding: {
        title: 'Свадебное',
        shortTitle: 'Свадебное',
        description: 'Свадебные букеты и цветочное оформление. Форму, оттенки и детали согласуем с вашим образом и сценарием дня.',
        cover: weddingCover,
        products: [
            {
                image: weddingEditorialCover,
                title: 'Свадебное оформление',
                description: 'Проект разрабатываем индивидуально: от общей концепции до подбора цветочного материала и монтажа.',
                action: 'Рассчитать оформление',
                group: 'Свадебное оформление',
                featured: true,
            },
            ...weddingWorks,
        ],
    },
};
