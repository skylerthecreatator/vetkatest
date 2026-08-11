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
        description: 'Раздел готовим к наполнению. Уже можно рассказать, для кого подарок и какой повод — найдём красивое решение.',
        cover: 'images/catalog-gifts.jpg',
        products: [],
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
