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
const collectionCount = document.getElementById('catalogPageCount');
const moreButton = document.getElementById('catalogMore');
const previewModal = document.getElementById('catalogPreviewModal');
const previewImage = document.getElementById('catalogPreviewImage');
const previewCategory = document.getElementById('catalogPreviewCategory');
const previewTitle = document.getElementById('catalogPreviewTitle');
const previewDescription = document.getElementById('catalogPreviewDescription');
const previewPrice = document.getElementById('catalogPreviewPrice');
const previewOrderButton = document.getElementById('catalogPreviewOrder');
const previewCloseButton = document.getElementById('catalogPreviewClose');
let previewSelection = null;
let previewOpener = null;

function closeCatalogPreview() {
    if (!previewModal?.classList.contains('is-open')) return;
    previewModal.classList.remove('is-open');
    previewModal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('catalog-preview-open');
    document.body.style.overflow = '';
    previewOpener?.focus?.();
}

function openCatalogPreview(product, category, opener) {
    if (!previewModal) return;
    previewSelection = { product, category };
    previewOpener = opener;
    previewImage.src = product.image;
    previewImage.alt = `${product.title} — ВЕТКА`;
    previewCategory.textContent = category.title;
    previewTitle.textContent = product.title;
    previewDescription.textContent = product.description || 'Флорист подскажет, как повторить это настроение в свежем сезонном составе.';
    previewPrice.textContent = product.price || 'Цена уточняется';
    previewPrice.hidden = false;
    previewModal.classList.add('is-open');
    previewModal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('catalog-preview-open');
    document.body.style.overflow = 'hidden';
    window.setTimeout(() => previewCloseButton?.focus(), 80);
}

function categoryButton(key, category) {
    const button = document.createElement('button');
    button.type = 'button';
    button.role = 'tab';
    button.dataset.category = key;
    button.setAttribute('aria-selected', String(key === activeCategory));
    button.className = key === activeCategory ? 'is-active' : '';
    const worksCount = category.products.filter(product => !product.featured).length;
    button.innerHTML = `<img src="${category.cover}" alt="" loading="lazy" decoding="async"><span>${category.shortTitle || category.title}</span><small>${worksCount || 'скоро'}</small>`;
    button.addEventListener('click', () => selectCategory(key));
    return button;
}

function renderCategories() {
    categoryList.replaceChildren(...categoryKeys.map(key => categoryButton(key, catalogData[key])));
}

function productCard(product, category, index) {
    const article = document.createElement('article');
    const gardenPosition = index % 6;
    const isFeature = product.featured || gardenPosition === 0;
    const isSide = !isFeature && (gardenPosition === 1 || gardenPosition === 2);
    article.className = `catalog-product${product.price ? '' : ' catalog-product--reference'}${isFeature ? ' catalog-product--feature' : ''}${isSide ? ' catalog-product--side' : ''}`;

    const imageButton = document.createElement('button');
    imageButton.type = 'button';
    imageButton.className = 'catalog-product-preview';
    imageButton.setAttribute('aria-label', `Открыть фото: ${product.title}`);

    const image = document.createElement('img');
    image.src = product.image;
    image.alt = `${product.title} — ВЕТКА`;
    image.loading = index === 0 ? 'eager' : 'lazy';
    image.decoding = 'async';
    image.fetchPriority = index === 0 ? 'high' : 'auto';
    imageButton.append(image);
    imageButton.addEventListener('click', () => openCatalogPreview(product, category, imageButton));

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
    if (product.price) {
        const price = document.createElement('strong');
        price.textContent = product.price;
        footer.append(price);
    } else {
        footer.classList.add('catalog-product-footer--reference');
    }
    const action = document.createElement('button');
    action.type = 'button';
    action.textContent = product.action || 'Хочу этот вариант';
    action.addEventListener('click', () => {
        window.openCatalogOrderModal({
            category: category.title,
            product: product.title,
            price: product.price || '',
        });
    });
    footer.append(action);

    body.append(label, heading, copy, footer);
    article.append(imageButton, body);
    return article;
}

function emptyCatalogState(category) {
    const card = document.createElement('article');
    card.className = 'catalog-empty';
    card.innerHTML = `
        <span>ВЕТКА / скоро в каталоге</span>
        <h3>${category.title}</h3>
        <p>Пока подбираем фотографии работ. Можно сразу описать задачу — флорист предложит подходящий вариант.</p>
        <a href="index.html?order=${encodeURIComponent(category.title)}">Обсудить с флористом</a>`;
    return card;
}

function renderProducts() {
    const category = catalogData[activeCategory];
    if (!category) return;
    title.textContent = category.title;
    description.textContent = category.description;
    const productCount = category.products.filter(product => !product.featured).length;
    collectionCount.textContent = productCount ? `${productCount} ${declineWorks(productCount)} в коллекции` : 'Подборка скоро появится';
    if (!category.products.length) {
        productGrid.replaceChildren(emptyCatalogState(category));
        moreButton.hidden = true;
        return;
    }
    const nodes = [];
    category.products.slice(0, visibleCount).forEach((product, index) => {
        nodes.push(productCard(product, category, index));
    });
    productGrid.replaceChildren(...nodes);
    const remaining = category.products.length - visibleCount;
    moreButton.hidden = remaining <= 0;
    if (remaining > 0) {
        const revealAll = activeCategory === 'wedding';
        const nextCount = revealAll ? remaining : Math.min(pageSize, remaining);
        const label = revealAll
            ? `Показать все ${remaining} оставшихся работ`
            : `Показать ещё ${nextCount} вариантов`;
        moreButton.setAttribute('aria-label', label);
        moreButton.innerHTML = `<span><strong>${label}</strong><small>В коллекции осталось ${remaining}</small></span><b aria-hidden="true">↓</b>`;
    }
}

function declineWorks(count) {
    const lastTwo = count % 100;
    const last = count % 10;
    if (lastTwo >= 11 && lastTwo <= 14) return 'работ';
    if (last === 1) return 'работа';
    if (last >= 2 && last <= 4) return 'работы';
    return 'работ';
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
    const category = catalogData[activeCategory];
    if (!category) return;
    visibleCount += activeCategory === 'wedding'
        ? category.products.length - visibleCount
        : pageSize;
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
    if (event.key === 'Escape') {
        closeCatalogPreview();
        closeCatalogHeaderPanels();
    }
});

previewCloseButton?.addEventListener('click', closeCatalogPreview);
previewModal?.addEventListener('click', event => {
    if (event.target === previewModal) closeCatalogPreview();
});
previewOrderButton?.addEventListener('click', () => {
    if (!previewSelection) return;
    const { product, category } = previewSelection;
    closeCatalogPreview();
    window.openCatalogOrderModal({
        category: category.title,
        product: product.title,
        price: product.price || '',
    });
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
