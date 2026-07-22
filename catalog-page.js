const catalogData = window.VETKA_CATALOG_DATA || {};
const categoryKeys = Object.keys(catalogData);
const pageSize = 6;
let activeCategory = categoryKeys.includes(new URLSearchParams(location.search).get('category'))
    ? new URLSearchParams(location.search).get('category')
    : (categoryKeys[0] || 'bouquets');
let visibleCount = pageSize;

const categoryList = document.getElementById('catalogCategoryList');
const productGrid = document.getElementById('catalogPageProducts');
const title = document.getElementById('catalogPageTitle');
const description = document.getElementById('catalogPageDescription');
const moreButton = document.getElementById('catalogMore');

function categoryButton(key, category) {
    const button = document.createElement('button');
    button.type = 'button';
    button.role = 'tab';
    button.dataset.category = key;
    button.setAttribute('aria-selected', String(key === activeCategory));
    button.className = key === activeCategory ? 'is-active' : '';
    button.innerHTML = `<img src="${category.cover}" alt=""><span>${category.shortTitle || category.title}</span>`;
    button.addEventListener('click', () => selectCategory(key));
    return button;
}

function renderCategories() {
    categoryList.replaceChildren(...categoryKeys.map(key => categoryButton(key, catalogData[key])));
}

function productCard(product, category) {
    const article = document.createElement('article');
    article.className = 'catalog-product';

    const image = document.createElement('img');
    image.src = product.image;
    image.alt = `${product.title} — ВЕТКА`;
    image.loading = 'lazy';

    const body = document.createElement('div');
    body.className = 'catalog-product-body';

    const label = document.createElement('span');
    label.className = 'catalog-product-label';
    label.textContent = category.title;

    const heading = document.createElement('h3');
    heading.textContent = product.title;

    const copy = document.createElement('p');
    copy.textContent = product.description;

    const footer = document.createElement('div');
    footer.className = 'catalog-product-footer';
    const price = document.createElement('strong');
    price.textContent = product.price || 'Индивидуальный расчёт';
    const action = document.createElement('a');
    action.href = `index.html?order=${encodeURIComponent(product.title)}`;
    action.textContent = product.action || 'Заказать';
    footer.append(price, action);

    body.append(label, heading, copy, footer);
    article.append(image, body);
    return article;
}

function renderProducts() {
    const category = catalogData[activeCategory];
    if (!category) return;
    title.textContent = category.title;
    description.textContent = category.description;
    const products = category.products.slice(0, visibleCount);
    productGrid.replaceChildren(...products.map(product => productCard(product, category)));
    moreButton.hidden = visibleCount >= category.products.length;
}

function selectCategory(key) {
    if (!catalogData[key]) return;
    activeCategory = key;
    visibleCount = pageSize;
    const url = new URL(location.href);
    url.searchParams.set('category', key);
    history.replaceState({}, '', url);
    renderCategories();
    renderProducts();
    if (matchMedia('(max-width: 720px)').matches) {
        document.querySelector(`[data-category="${key}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
}

moreButton.addEventListener('click', () => {
    visibleCount += pageSize;
    renderProducts();
});

renderCategories();
renderProducts();

if (matchMedia('(max-width: 720px)').matches) {
    requestAnimationFrame(() => {
        document.querySelector(`[data-category="${activeCategory}"]`)?.scrollIntoView({
            behavior: 'auto',
            block: 'nearest',
            inline: 'center',
        });
    });
}
