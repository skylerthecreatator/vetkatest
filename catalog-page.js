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

const desktopCatalogDropdown = document.getElementById('desktopCatalogDropdown');
const desktopCatalogToggle = document.getElementById('desktopCatalogToggle');
const mobileCatalogToggle = document.getElementById('mobileCatalogToggle');
const mobileCatalogPanel = document.getElementById('mobileCatalogPanel');
const mobileCatalogClose = document.getElementById('mobileCatalogClose');

function closeCatalogHeaderPanels() {
    desktopCatalogDropdown?.classList.remove('is-open');
    desktopCatalogToggle?.setAttribute('aria-expanded', 'false');
    mobileCatalogPanel?.classList.remove('is-open');
    mobileCatalogPanel?.setAttribute('aria-hidden', 'true');
    mobileCatalogToggle?.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('catalog-menu-open');
}

desktopCatalogToggle?.addEventListener('click', event => {
    event.stopPropagation();
    const shouldOpen = !desktopCatalogDropdown.classList.contains('is-open');
    closeCatalogHeaderPanels();
    if (shouldOpen) {
        desktopCatalogDropdown.classList.add('is-open');
        desktopCatalogToggle.setAttribute('aria-expanded', 'true');
    }
});

mobileCatalogToggle?.addEventListener('click', () => {
    const shouldOpen = !mobileCatalogPanel.classList.contains('is-open');
    closeCatalogHeaderPanels();
    if (shouldOpen) {
        mobileCatalogPanel.classList.add('is-open');
        mobileCatalogPanel.setAttribute('aria-hidden', 'false');
        mobileCatalogToggle.setAttribute('aria-expanded', 'true');
        document.body.classList.add('catalog-menu-open');
    }
});

mobileCatalogClose?.addEventListener('click', closeCatalogHeaderPanels);

document.querySelectorAll('[data-catalog-nav]').forEach(button => {
    button.addEventListener('click', () => {
        selectCategory(button.dataset.catalogNav);
        closeCatalogHeaderPanels();
        document.getElementById('catalogPageTitle')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
});

document.addEventListener('click', event => {
    if (desktopCatalogDropdown?.classList.contains('is-open') && !desktopCatalogDropdown.contains(event.target)) {
        closeCatalogHeaderPanels();
    }
    if (mobileCatalogPanel?.classList.contains('is-open') &&
        !mobileCatalogPanel.contains(event.target) &&
        !mobileCatalogToggle?.contains(event.target)) {
        closeCatalogHeaderPanels();
    }
});

document.addEventListener('keydown', event => {
    if (event.key === 'Escape') closeCatalogHeaderPanels();
});

if (matchMedia('(max-width: 720px)').matches) {
    requestAnimationFrame(() => {
        document.querySelector(`[data-category="${activeCategory}"]`)?.scrollIntoView({
            behavior: 'auto',
            block: 'nearest',
            inline: 'center',
        });
    });
}
