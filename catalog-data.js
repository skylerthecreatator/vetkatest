const bouquetReference = 'Сезонный состав и оттенки согласуем перед сборкой.';
const weddingReference = 'Референс букета невесты — соберём в похожем настроении под ваш образ.';

const bouquetWorks = [
    ['first8000rub.jpg', 'Авторский букет № 1', '8 000 ₽'],
    ['second8000rub.jpg', 'Авторский букет № 2', '8 000 ₽'],
    ['third7500rub.jpg', 'Авторский букет № 3', '7 500 ₽'],
    ['fourth8000rub.jpg', 'Авторский букет № 4', '8 000 ₽'],
    ['fifth6500rub.jpg', 'Авторский букет № 5', '6 500 ₽'],
    ['sixth8500rub.jpg', 'Авторский букет № 6', '8 500 ₽'],
    ['seventh7500rub.jpg', 'Авторский букет № 7', '7 500 ₽'],
    ['eighth8000rub.jpg', 'Авторский букет № 8', '8 000 ₽'],
    ['ninthnoneprice.jpg', 'Авторский букет № 9', null],
    ['tenth8000rub.jpg', 'Авторский букет № 10', '8 000 ₽'],
    ['eleventh6000rub.jpg', 'Авторский букет № 11', '6 000 ₽'],
    ['twelfth6000rub.jpg', 'Авторский букет № 12', '6 000 ₽'],
    ['thirteenth7500.jpg', 'Авторский букет № 13', '7 500 ₽'],
    ['fourteenth6500rub.jpg', 'Авторский букет № 14', '6 500 ₽'],
    ['fiveteenth6500rub.jpg', 'Авторский букет № 15', '6 500 ₽'],
    ['sixteenth7000rub.jpg', 'Авторский букет № 16', '7 000 ₽'],
].map(([file, title, price]) => ({
    image: `images/catalog/bouquets/${file}`,
    title,
    description: bouquetReference,
    price,
    action: 'Хочу этот вариант',
}));

const bouquetVisuals = [
    'photo_2026-08-08_14-56-30.jpg',
    'photo_2026-08-08_14-56-34.jpg',
    'photo_2026-08-08_14-56-35.jpg',
    'photo_2026-08-08_14-56-36.jpg',
    'photo_2026-08-08_14-56-38.jpg',
    'photo_2026-08-08_14-56-39.jpg',
    'photo_2026-08-08_14-56-40.jpg',
    'photo_2026-08-08_14-56-46.jpg',
    'photo_2026-08-08_14-56-47.jpg',
    'photo_2026-08-08_14-56-49.jpg',
    'photo_2026-08-08_14-56-50.jpg',
].map((file, index) => ({
    image: `images/catalog/bouquets-extra/${file}`,
    title: `Букет в авторской форме № ${index + 1}`,
    description: 'Визуальный пример: соберём букет в похожей форме и палитре.',
    action: 'Хочу этот вариант',
}));

const weddingWorks = [
    'photo_2026-08-08_14-23-20.jpg',
    'photo_2026-08-08_14-23-21.jpg',
    'photo_2026-08-08_14-23-22.jpg',
    'photo_2026-08-08_14-23-24.jpg',
    'photo_2026-08-08_14-23-26.jpg',
    'photo_2026-08-08_14-23-27.jpg',
    'photo_2026-08-08_14-23-28.jpg',
    'photo_2026-08-08_14-23-29.jpg',
    'photo_2026-08-08_14-23-31.jpg',
    'photo_2026-08-08_14-23-32.jpg',
    'photo_2026-08-08_14-23-32 (2).jpg',
    'photo_2026-08-08_14-23-39.jpg',
    'photo_2026-08-08_14-23-40.jpg',
].map((file, index) => ({
    image: `images/catalog/wedding/${file}`,
    title: `Букет невесты № ${index + 1}`,
    description: weddingReference,
    action: 'Хочу этот вариант',
}));

window.VETKA_CATALOG_DATA = {
    bouquets: {
        title: 'Букеты',
        shortTitle: 'Букеты',
        description: 'Авторские букеты с живой формой: от мягких сезонных сочетаний до выразительной графики.',
        cover: bouquetWorks[0].image,
        products: [...bouquetWorks, ...bouquetVisuals],
    },
    compositions: {
        title: 'Композиции',
        shortTitle: 'Композиции',
        description: 'Готовые формы в устойчивой основе — удобно подарить, поставить дома или отправить доставкой.',
        cover: 'images/catalog-compositions.jpg',
        products: [
            { image: 'images/flagship1.jpg', title: 'Асимметрия. Гортензия и каллы', description: 'Плотное ядро гортензии уравновешено строгой графикой калл.', price: '8 500 ₽', action: 'Хочу этот вариант' },
            { image: 'images/flagship2.jpg', title: 'Акцентный нуар', description: 'Выразительная композиция с глубокими оттенками и глянцевой зеленью.', price: '9 800 ₽', action: 'Хочу этот вариант' },
            { image: 'images/flagship3.jpg', title: 'Интерьерный концепт. Нутан', description: 'Огненная структура нутана и бархатный нуар тёмных диантусов.', price: '11 200 ₽', action: 'Хочу этот вариант' },
        ]
    },
    interior: {
        title: 'Интерьерные композиции',
        shortTitle: 'Интерьерные',
        description: 'Цветочные объекты под пространство дома, офиса, студии, ресторана или шоурума.',
        cover: 'images/flagship3.jpg',
        products: [
            { image: 'images/flagship3.jpg', title: 'Интерьерный концепт', description: 'Арт-композиция, которая работает как самостоятельный акцент в пространстве.', price: '11 200 ₽', action: 'Хочу этот вариант' },
            { image: 'images/catalog-compositions.jpg', title: 'Композиция для пространства', description: 'Подбираем масштаб, линию и цвет под интерьер и освещение.', price: '9 800 ₽', action: 'Хочу этот вариант' },
            { image: 'images/salon-space.jpg', title: 'Сезонный объект', description: 'Живая композиция для стойки, стола, витрины или зоны встречи гостей.', price: '8 500 ₽', action: 'Хочу этот вариант' },
        ]
    },
    gifts: {
        title: 'Вазы и подарки',
        shortTitle: 'Вазы и подарки',
        description: 'Готовые подарочные решения: цветы, вазы и детали, которые легко вручить и приятно оставить дома.',
        cover: 'images/catalog-gifts.jpg',
        products: [
            { image: 'images/catalog-gifts.jpg', title: 'Ваза с сезонными цветами', description: 'Готовый комплект: подходящая ваза и собранная под неё композиция.', price: '8 500 ₽', action: 'Хочу этот вариант' },
            { image: 'images/flagship1.jpg', title: 'Подарочная композиция', description: 'Выразительный подарок, который не требует пересадки в вазу.', price: '9 800 ₽', action: 'Хочу этот вариант' },
            { image: 'images/flagship2.jpg', title: 'Цветочный подарок с характером', description: 'Акцентная палитра и необычные фактуры для особенного повода.', price: '11 200 ₽', action: 'Хочу этот вариант' },
        ]
    },
    wedding: {
        title: 'Свадебное',
        shortTitle: 'Свадебное',
        description: 'Букет невесты и оформление разрабатываем индивидуально под образ, площадку и настроение события.',
        cover: weddingWorks[0].image,
        products: [
            ...weddingWorks,
            { image: 'images/catalog-wedding.jpg', title: 'Свадебное оформление', description: 'Проект разрабатываем индивидуально: от общей концепции до подбора цветочного материала и монтажа.', action: 'Рассчитать оформление' },
        ]
    }
};
