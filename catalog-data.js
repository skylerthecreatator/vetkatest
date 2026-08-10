const bouquetReference = 'Соберём букет в похожей форме и палитре из свежего сезонного материала.';
const weddingReference = 'Соберём свадебный букет в похожем настроении и согласуем детали с вашим образом.';

const bouquetFiles = [
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
    'ninthnoneprice.jpg',
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
    image: `images/catalog/bouquets/${file}`,
    title: `Букет в авторской форме № ${index + 1}`,
    description: bouquetReference,
    action: 'Хочу этот вариант',
    group: 'Букеты в авторской форме',
}));

const weddingWorks = [
    ['first8000rub.jpg', '8 000 ₽'],
    ['second8000rub.jpg', '8 000 ₽'],
    ['third7500rub.jpg', '7 500 ₽'],
    ['fourth8000rub.jpg', '8 000 ₽'],
    ['fifth6500rub.jpg', '6 500 ₽'],
    ['sixth8500rub.jpg', '8 500 ₽'],
    ['seventh7500rub.jpg', '7 500 ₽'],
    ['eighth8000rub.jpg', '8 000 ₽'],
    ['tenth8000rub.jpg', '8 000 ₽'],
    ['eleventh6000rub.jpg', '6 000 ₽'],
    ['twelfth6000rub.jpg', '6 000 ₽'],
    ['thirteenth7500.jpg', '7 500 ₽'],
    ['fourteenth6500rub.jpg', '6 500 ₽'],
    ['fiveteenth6500rub.jpg', '6 500 ₽'],
    ['sixteenth7000rub.jpg', '7 000 ₽'],
].map(([file, price], index) => ({
    image: `images/catalog/wedding/${file}`,
    title: `Свадебный букет № ${index + 1}`,
    description: weddingReference,
    price,
    action: 'Хочу этот вариант',
    group: 'Свадебные букеты с ценой',
}));

window.VETKA_CATALOG_DATA = {
    bouquets: {
        title: 'Букеты',
        shortTitle: 'Букеты',
        description: 'Авторские букеты с живой формой. Выберите референс — соберём похожее настроение из сезонных цветов.',
        cover: bouquetFiles[0].image,
        products: bouquetFiles,
    },
    compositions: {
        title: 'Композиции',
        shortTitle: 'Композиции',
        description: 'Подборка пополняется: пришлите задачу, а флорист предложит форму и сезонный состав.',
        cover: bouquetFiles[1].image,
        products: [],
    },
    interior: {
        title: 'Интерьерные композиции',
        shortTitle: 'Интерьерные',
        description: 'Подборка пополняется: подберём цветочную форму под дом, офис, студию или событие.',
        cover: bouquetFiles[2].image,
        products: [],
    },
    gifts: {
        title: 'Вазы и подарки',
        shortTitle: 'Вазы и подарки',
        description: 'Раздел готовим к наполнению — скоро здесь появятся актуальные варианты.',
        cover: bouquetFiles[3].image,
        products: [],
    },
    wedding: {
        title: 'Свадебное',
        shortTitle: 'Свадебное',
        description: 'Свадебные букеты с актуальной стоимостью. Форму, оттенки и детали согласуем под ваш образ.',
        cover: weddingWorks[0].image,
        products: [
            ...weddingWorks,
            { image: weddingWorks[0].image, title: 'Свадебное оформление', description: 'Проект разрабатываем индивидуально: от общей концепции до подбора цветочного материала и монтажа.', action: 'Рассчитать оформление', group: 'Свадебное оформление' },
        ]
    }
};
