// app.js — G&E Store
// Работает и как обычный сайт в браузере, и как Telegram Mini App.

/* ============ НАСТРОЙКИ ============ */
const CONFIG = {
  botUsername: 'gutsenj_bot',      // бот, который принимает заказы
  sellerUsername: 'guts_enj0yer',  // продавец, для прямой связи
  city: 'Санкт-Петербург',
};

/* ============ ДАННЫЕ ============ */
const DATA = window.STORE_DATA || { categories: [], themes: [], products: [] };
const ITEMS = DATA.products;
const SECTIONS = DATA.categories;
const COLLECTIONS = DATA.themes;

const byId = (id) => ITEMS.find((p) => p.id === Number(id));
const themeBySlug = (slug) => COLLECTIONS.find((t) => t.slug === slug);
const categoryBySlug = (slug) => SECTIONS.find((c) => c.slug === slug);
const titleOfTheme = (slug) => themeBySlug(slug)?.title || '';
const titleOfCategory = (slug) => categoryBySlug(slug)?.title || '';
const money = (value) => new Intl.NumberFormat('ru-RU').format(value) + ' ₽';

const PLACEHOLDER =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 100">' +
    '<rect width="80" height="100" fill="%23221E27"/></svg>'
  );

const cover = (product, index = 0) => product.images?.[index] || PLACEHOLDER;

/* ============ TELEGRAM ============ */
const tg = window.Telegram?.WebApp;
const inTelegram = Boolean(tg?.initData !== undefined && tg?.platform && tg.platform !== 'unknown');

if (tg) {
  try {
    tg.ready();
    tg.expand();
  } catch (_) { /* вне Telegram методов может не быть */ }
}

/* ============ ХРАНИЛИЩЕ ============
   localStorage бросает исключение при открытии файла с диска,
   в приватном режиме и в части webview. Ни одно из этих мест
   не должно ронять страницу. */
const store = {
  get(key) {
    try { return localStorage.getItem(key); } catch (_) { return null; }
  },
  set(key, value) {
    try { localStorage.setItem(key, value); } catch (_) { /* переживём без сохранения */ }
  },
};

/* ============ ТЕМА ============ */
const THEME_KEY = 'ge-theme';

function applyTheme(mode) {
  document.documentElement.dataset.theme = mode;
  const icon = document.getElementById('themeIcon');
  if (icon) icon.textContent = mode === 'dark' ? '☾' : '☀';
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', mode === 'dark' ? '#121014' : '#E9E5DB');
}

function initTheme() {
  const saved = store.get(THEME_KEY);
  if (saved) return applyTheme(saved);
  if (tg?.colorScheme) return applyTheme(tg.colorScheme);
  const prefersLight = window.matchMedia?.('(prefers-color-scheme: light)')?.matches;
  applyTheme(prefersLight ? 'light' : 'dark');
}

document.getElementById('themeToggle').addEventListener('click', () => {
  const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  store.set(THEME_KEY, next);
});

/* ============ УВЕДОМЛЕНИЯ ============ */
let toastTimer;
function toast(message) {
  const el = document.getElementById('toast');
  el.textContent = message;
  el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.hidden = true; }, 2600);
}

function haptic(kind = 'light') {
  try { tg?.HapticFeedback?.impactOccurred(kind); } catch (_) { /* не критично */ }
}

/* ============ КОРЗИНА ============ */
const CART_KEY = 'ge-cart-v2';
let cart = [];

function loadCart() {
  try {
    const raw = JSON.parse(store.get(CART_KEY) || '[]');
    cart = raw.filter((line) => byId(line.id)).map((line) => ({
      id: Number(line.id),
      size: line.size || '',
      qty: Math.min(Math.max(Number(line.qty) || 1, 1), 20),
    }));
  } catch (_) {
    cart = [];
  }
}

function saveCart() {
  store.set(CART_KEY, JSON.stringify(cart));
}

const cartCount = () => cart.reduce((sum, line) => sum + line.qty, 0);
const cartTotal = () => cart.reduce((sum, line) => sum + (byId(line.id)?.price || 0) * line.qty, 0);

function addToCart(id, size = '', qty = 1) {
  const product = byId(id);
  if (!product) return;

  const existing = cart.find((line) => line.id === product.id && line.size === size);
  if (existing) {
    existing.qty = Math.min(existing.qty + qty, 20);
  } else {
    cart.push({ id: product.id, size, qty });
  }

  saveCart();
  renderCartBadge();
  renderCart();
  haptic('light');
  toast(`${product.name}${size ? ', ' + size : ''} — в корзине`);
}

function setQty(index, qty) {
  if (qty <= 0) {
    cart.splice(index, 1);
  } else {
    cart[index].qty = Math.min(qty, 20);
  }
  saveCart();
  renderCartBadge();
  renderCart();
}

function renderCartBadge() {
  const badge = document.getElementById('cartCount');
  const count = cartCount();
  badge.textContent = count;
  badge.hidden = count === 0;
}

function renderCart() {
  const body = document.getElementById('cartBody');
  const foot = document.getElementById('cartFoot');

  if (!cart.length) {
    body.innerHTML = `
      <div class="empty">
        <p>Пока пусто. Выберите вещь в каталоге — она появится здесь.</p>
        <a class="btn btn--ghost" href="#/catalog" data-close-cart>Открыть каталог</a>
      </div>`;
    foot.hidden = true;
    return;
  }

  body.innerHTML = cart.map((line, index) => {
    const product = byId(line.id);
    return `
      <div class="cart-line">
        <img class="cart-line__img" src="${cover(product)}" alt="" loading="lazy">
        <div>
          <p class="cart-line__name">${product.name}</p>
          <p class="cart-line__meta">№${product.id}${line.size ? ' · размер ' + line.size : ''}</p>
          <div class="cart-line__row">
            <span class="mini-stepper">
              <button type="button" data-qty="${index}" data-delta="-1" aria-label="Меньше">−</button>
              <output>${line.qty}</output>
              <button type="button" data-qty="${index}" data-delta="1" aria-label="Больше">+</button>
            </span>
            <span class="cart-line__price">${money(product.price * line.qty)}</span>
          </div>
          <div class="cart-line__row">
            <button class="cart-line__drop" type="button" data-drop="${index}">Убрать</button>
          </div>
        </div>
      </div>`;
  }).join('');

  document.getElementById('cartTotal').textContent = money(cartTotal());
  foot.hidden = false;
}

/* открытие и закрытие панели корзины */
const cartPanel = document.getElementById('cart');
const scrim = document.getElementById('scrim');
let lastFocused = null;

function openCart() {
  lastFocused = document.activeElement;
  renderCart();
  cartPanel.hidden = false;
  scrim.hidden = false;
  document.body.classList.add('is-locked');
  document.getElementById('cartClose').focus();
}

function closeCart() {
  cartPanel.hidden = true;
  scrim.hidden = true;
  document.body.classList.remove('is-locked');
  lastFocused?.focus();
}

document.getElementById('cartToggle').addEventListener('click', openCart);
document.getElementById('cartClose').addEventListener('click', closeCart);
scrim.addEventListener('click', closeCart);

document.getElementById('cartBody').addEventListener('click', (event) => {
  const qtyBtn = event.target.closest('[data-qty]');
  if (qtyBtn) {
    const index = Number(qtyBtn.dataset.qty);
    setQty(index, cart[index].qty + Number(qtyBtn.dataset.delta));
    return;
  }
  const dropBtn = event.target.closest('[data-drop]');
  if (dropBtn) {
    setQty(Number(dropBtn.dataset.drop), 0);
    return;
  }
  if (event.target.closest('[data-close-cart]')) closeCart();
});

/* ============ ОФОРМЛЕНИЕ ЗАКАЗА ============ */
// Компактный код заказа: v2-<id>x<кол-во>s<размер>-...
// Telegram разрешает в start-параметре до 64 символов A-Z a-z 0-9 _ -
function orderCode() {
  const parts = cart.map((line) => {
    const size = (line.size || '').replace(/[^A-Za-z0-9]/g, '');
    return `${line.id}x${line.qty}${size ? 's' + size : ''}`;
  });
  return 'v2-' + parts.join('-');
}

function orderText() {
  const lines = cart.map((line) => {
    const product = byId(line.id);
    const size = line.size ? `, размер ${line.size}` : '';
    return `• №${product.id} ${product.name}${size} — ${line.qty} шт — ${money(product.price * line.qty)}`;
  });
  return `Заказ в G&E Store:\n${lines.join('\n')}\n\nИтого: ${money(cartTotal())}`;
}

async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (_) {
    return false;
  }
}

function openLink(url) {
  if (inTelegram && tg?.openTelegramLink) {
    tg.openTelegramLink(url);
  } else {
    window.open(url, '_blank', 'noopener');
  }
}

async function checkout() {
  if (!cart.length) return;

  const code = orderCode();

  if (code.length <= 64) {
    openLink(`https://t.me/${CONFIG.botUsername}?start=${code}`);
    if (inTelegram) setTimeout(() => { try { tg.close(); } catch (_) {} }, 400);
    return;
  }

  // Заказ длиннее, чем помещается в ссылку — отправляем текстом продавцу.
  const copied = await copyToClipboard(orderText());
  toast(copied
    ? 'Заказ скопирован. Вставьте его в чат с продавцом.'
    : 'Заказ большой — перечислите товары продавцу в чате.');
  openLink(`https://t.me/${CONFIG.sellerUsername}`);
}

document.getElementById('checkoutBtn').addEventListener('click', checkout);

/* ============ ЛАЙТБОКС ============ */
const lightbox = document.getElementById('lightbox');
let lbImages = [];
let lbIndex = 0;

function openLightbox(images, index = 0) {
  lbImages = images;
  lbIndex = index;
  paintLightbox();
  lightbox.hidden = false;
  document.body.classList.add('is-locked');
  document.getElementById('lbClose').focus();
}

function closeLightbox() {
  lightbox.hidden = true;
  if (cartPanel.hidden) document.body.classList.remove('is-locked');
}

function paintLightbox() {
  document.getElementById('lbImage').src = lbImages[lbIndex];
  document.getElementById('lbCounter').textContent = `${lbIndex + 1} / ${lbImages.length}`;
  const many = lbImages.length > 1;
  document.getElementById('lbPrev').hidden = !many;
  document.getElementById('lbNext').hidden = !many;
}

function stepLightbox(delta) {
  lbIndex = (lbIndex + delta + lbImages.length) % lbImages.length;
  paintLightbox();
}

document.getElementById('lbClose').addEventListener('click', closeLightbox);
document.getElementById('lbPrev').addEventListener('click', () => stepLightbox(-1));
document.getElementById('lbNext').addEventListener('click', () => stepLightbox(1));
lightbox.addEventListener('click', (event) => {
  if (event.target === lightbox) closeLightbox();
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    if (!lightbox.hidden) return closeLightbox();
    if (!cartPanel.hidden) return closeCart();
  }
  if (lightbox.hidden) return;
  if (event.key === 'ArrowLeft') stepLightbox(-1);
  if (event.key === 'ArrowRight') stepLightbox(1);
});

/* ============ ШАБЛОНЫ ============ */
function cardHTML(product) {
  const second = product.images?.[1];
  return `
    <article class="card">
      <a class="card__media" href="#/product/${product.id}" aria-label="${product.name}">
        <span class="card__art">№${product.id}</span>
        <img src="${cover(product)}" alt="${product.name}" loading="lazy">
        ${second ? `<img class="card__alt" src="${second}" alt="" loading="lazy" aria-hidden="true">` : ''}
      </a>
      <div class="card__body">
        ${product.theme ? `<p class="card__theme">${titleOfTheme(product.theme)}</p>` : ''}
        <a class="card__name" href="#/product/${product.id}">${product.name}</a>
        <div class="card__foot">
          <span class="card__price">${money(product.price)}</span>
          <button class="card__add" type="button" data-add="${product.id}">В корзину</button>
        </div>
      </div>
    </article>`;
}

function collectionHTML(theme) {
  const count = ITEMS.filter((p) => p.theme === theme.slug).length;
  const label = count === 0
    ? 'скоро'
    : `${count} ${count === 1 ? 'вещь' : count < 5 ? 'вещи' : 'вещей'}`;
  return `
    <a class="collection" href="#/collection/${theme.slug}">
      <div class="collection__cover">
        ${theme.cover ? `<img src="${theme.cover}" alt="" loading="lazy">` : ''}
      </div>
      <div class="collection__body">
        <p class="collection__name">${theme.title}</p>
        <p class="collection__count">${label}</p>
      </div>
    </a>`;
}

/* добавление в корзину прямо из карточек */
document.addEventListener('click', (event) => {
  const btn = event.target.closest('[data-add]');
  if (!btn) return;
  event.preventDefault();
  const product = byId(btn.dataset.add);
  const size = product?.sizes?.length ? '' : '';
  addToCart(product.id, size, 1);
});

/* ============ ГЛАВНАЯ ============ */
function renderHome() {
  const picks = [...ITEMS].reverse().slice(0, 3);
  document.getElementById('heroPanels').innerHTML = picks.map((p) => `
    <figure class="hero__panel"><img src="${cover(p)}" alt="" loading="eager"></figure>
  `).join('');

  document.getElementById('homeCollections').innerHTML =
    COLLECTIONS.map(collectionHTML).join('');

  document.getElementById('homeProducts').innerHTML =
    [...ITEMS].reverse().slice(0, 8).map(cardHTML).join('');
}

/* ============ КАТАЛОГ ============ */
const filters = { category: 'all', theme: 'all', query: '', sort: 'default' };

function buildFilterControls() {
  const chips = document.getElementById('categoryChips');
  chips.innerHTML = [{ slug: 'all', title: 'Всё' }, ...SECTIONS]
    .map((c) => `<button class="chip" type="button" data-category="${c.slug}" aria-pressed="false">${c.title}</button>`)
    .join('');

  const select = document.getElementById('themeSelect');
  select.innerHTML = '<option value="all">Все коллекции</option>' +
    COLLECTIONS.map((t) => `<option value="${t.slug}">${t.title}</option>`).join('');

  chips.addEventListener('click', (event) => {
    const btn = event.target.closest('[data-category]');
    if (!btn) return;
    const slug = btn.dataset.category;
    location.hash = slug === 'all' ? '#/catalog' : `#/catalog/${slug}`;
  });

  select.addEventListener('change', () => {
    filters.theme = select.value;
    renderCatalogGrid();
  });

  document.getElementById('sortSelect').addEventListener('change', (event) => {
    filters.sort = event.target.value;
    renderCatalogGrid();
  });

  let debounce;
  document.getElementById('searchInput').addEventListener('input', (event) => {
    clearTimeout(debounce);
    debounce = setTimeout(() => {
      filters.query = event.target.value.trim().toLowerCase();
      renderCatalogGrid();
    }, 180);
  });

  document.getElementById('resetFilters').addEventListener('click', () => {
    filters.theme = 'all';
    filters.query = '';
    filters.sort = 'default';

    // адрес мог остаться прежним — тогда hashchange не сработает, рисуем сами
    if (location.hash === '#/catalog') {
      syncFilterControls();
      renderCatalogGrid();
    } else {
      location.hash = '#/catalog';
    }
  });
}

function syncFilterControls() {
  document.querySelectorAll('[data-category]').forEach((btn) => {
    btn.setAttribute('aria-pressed', String(btn.dataset.category === filters.category));
  });
  document.getElementById('themeSelect').value = filters.theme;
  document.getElementById('sortSelect').value = filters.sort;
  document.getElementById('searchInput').value = filters.query;
}

function renderCatalogGrid() {
  let list = ITEMS.slice();

  if (filters.category !== 'all') list = list.filter((p) => p.category === filters.category);
  if (filters.theme !== 'all') list = list.filter((p) => p.theme === filters.theme);

  if (filters.query) {
    list = list.filter((p) =>
      p.name.toLowerCase().includes(filters.query) ||
      String(p.id) === filters.query ||
      titleOfTheme(p.theme).toLowerCase().includes(filters.query)
    );
  }

  if (filters.sort === 'price-asc') list.sort((a, b) => a.price - b.price);
  if (filters.sort === 'price-desc') list.sort((a, b) => b.price - a.price);
  if (filters.sort === 'name') list.sort((a, b) => a.name.localeCompare(b.name, 'ru'));

  const grid = document.getElementById('catalogGrid');
  grid.innerHTML = list.map(cardHTML).join('');
  document.getElementById('catalogEmpty').hidden = list.length > 0;

  const word = list.length === 1 ? 'вещь' : list.length < 5 && list.length > 0 ? 'вещи' : 'вещей';
  document.getElementById('resultCount').textContent =
    list.length ? `Показано ${list.length} ${word}` : '';
}

function renderCatalog({ category = 'all', theme = 'all' } = {}) {
  filters.category = category;
  filters.theme = theme;

  const heading = document.getElementById('catalogTitle');
  const info = document.getElementById('catalogInfo');

  if (theme !== 'all') {
    heading.textContent = titleOfTheme(theme) || 'Коллекция';
    info.textContent = themeBySlug(theme)?.info || '';
  } else if (category !== 'all') {
    heading.textContent = titleOfCategory(category) || 'Каталог';
    info.textContent = categoryBySlug(category)?.info || '';
  } else {
    heading.textContent = 'Каталог';
    info.textContent = `Все вещи в наличии. Доставка по городу ${CONFIG.city} входит в цену.`;
  }

  syncFilterControls();
  renderCatalogGrid();
}

/* ============ КОЛЛЕКЦИИ ============ */
function renderCollections() {
  document.getElementById('collectionGrid').innerHTML = COLLECTIONS.map(collectionHTML).join('');
}

/* ============ СТРАНИЦА ТОВАРА ============ */
function renderProduct(id) {
  const product = byId(id);
  if (!product) {
    location.hash = '#/catalog';
    return;
  }

  document.getElementById('productCrumbs').innerHTML = `
    <a href="#/">Главная</a><span aria-hidden="true">/</span>
    <a href="#/catalog/${product.category}">${titleOfCategory(product.category)}</a>
    ${product.theme ? `<span aria-hidden="true">/</span><a href="#/collection/${product.theme}">${titleOfTheme(product.theme)}</a>` : ''}
  `;

  const images = product.images?.length ? product.images : [PLACEHOLDER];
  const sizes = product.sizes || [];
  const categoryInfo = categoryBySlug(product.category)?.info || '';

  document.getElementById('productBody').innerHTML = `
    <div class="gallery">
      <div class="gallery__main" id="galleryMain">
        <img src="${images[0]}" alt="${product.name}" id="galleryImage">
      </div>
      ${images.length > 1 ? `
        <div class="gallery__thumbs" id="galleryThumbs">
          ${images.map((src, i) => `
            <button class="thumb" type="button" data-index="${i}" aria-current="${i === 0}">
              <img src="${src}" alt="Фото ${i + 1}" loading="lazy">
            </button>`).join('')}
        </div>` : ''}
    </div>

    <div class="buybox">
      <span class="buybox__art">Артикул №${product.id}</span>
      <h1 class="buybox__title">${product.name}</h1>
      <p class="buybox__price">${money(product.price)}</p>

      ${sizes.length ? `
        <div class="opt">
          <span class="opt__label" id="sizeLabel">Размер</span>
          <div class="opt__row" role="group" aria-labelledby="sizeLabel" id="sizeRow">
            ${sizes.map((s, i) => `
              <button class="size" type="button" data-size="${s}" aria-pressed="${i === 0}">${s}</button>
            `).join('')}
          </div>
        </div>` : ''}

      <div class="opt">
        <span class="opt__label" id="qtyLabel">Количество</span>
        <span class="stepper" role="group" aria-labelledby="qtyLabel">
          <button type="button" id="qtyMinus" aria-label="Меньше">−</button>
          <output id="qtyValue">1</output>
          <button type="button" id="qtyPlus" aria-label="Больше">+</button>
        </span>
      </div>

      <button class="btn btn--solid btn--block" type="button" id="addBtn">Добавить в корзину</button>

      <div class="details">
        <details open>
          <summary>Ткань и посадка</summary>
          <p>${categoryInfo || 'Хлопок, плотная ткань, прямой крой.'}</p>
        </details>
        <details>
          <summary>Доставка</summary>
          <p>По ${CONFIG.city} доставка уже включена в цену. По России считаем отдельно — обсудим в переписке.</p>
        </details>
        <details>
          <summary>Уход за принтом</summary>
          <p>Стирка при 30° наизнанку, без отбеливателя. Гладить только с изнанки или через ткань.</p>
        </details>
      </div>
    </div>`;

  // галерея
  let current = 0;
  const galleryImage = document.getElementById('galleryImage');
  const thumbs = document.getElementById('galleryThumbs');

  thumbs?.addEventListener('click', (event) => {
    const btn = event.target.closest('[data-index]');
    if (!btn) return;
    current = Number(btn.dataset.index);
    galleryImage.src = images[current];
    thumbs.querySelectorAll('.thumb').forEach((t) =>
      t.setAttribute('aria-current', String(Number(t.dataset.index) === current)));
  });

  document.getElementById('galleryMain').addEventListener('click', () => openLightbox(images, current));

  // размер
  let chosenSize = sizes[0] || '';
  document.getElementById('sizeRow')?.addEventListener('click', (event) => {
    const btn = event.target.closest('[data-size]');
    if (!btn) return;
    chosenSize = btn.dataset.size;
    document.querySelectorAll('#sizeRow .size').forEach((s) =>
      s.setAttribute('aria-pressed', String(s.dataset.size === chosenSize)));
  });

  // количество
  let qty = 1;
  const qtyValue = document.getElementById('qtyValue');
  const setLocalQty = (next) => {
    qty = Math.min(Math.max(next, 1), 20);
    qtyValue.textContent = qty;
  };
  document.getElementById('qtyMinus').addEventListener('click', () => setLocalQty(qty - 1));
  document.getElementById('qtyPlus').addEventListener('click', () => setLocalQty(qty + 1));

  document.getElementById('addBtn').addEventListener('click', () => {
    addToCart(product.id, chosenSize, qty);
  });

  // похожие
  const related = ITEMS.filter((p) => p.theme === product.theme && p.id !== product.id).slice(0, 4);
  const band = document.getElementById('relatedBand');
  band.hidden = related.length === 0;
  document.getElementById('relatedGrid').innerHTML = related.map(cardHTML).join('');

  document.title = `${product.name} — G&E Store`;
}

/* ============ РОУТЕР ============ */
const VIEWS = ['home', 'catalog', 'collections', 'product', 'about'];

function showView(name) {
  VIEWS.forEach((view) => {
    document.getElementById(`view-${view}`).hidden = view !== name;
  });
}

function markNav(hash) {
  document.querySelectorAll('.mainnav a').forEach((link) => {
    link.classList.toggle('is-active', link.getAttribute('href') === hash);
  });
}

function route() {
  const hash = location.hash || '#/';
  const parts = hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  document.title = 'G&E Store — футболки и худи по манге и аниме';

  if (!cartPanel.hidden) closeCart();
  if (!lightbox.hidden) closeLightbox();

  switch (parts[0]) {
    case undefined:
      showView('home');
      renderHome();
      break;

    case 'catalog':
      showView('catalog');
      renderCatalog({ category: parts[1] || 'all', theme: 'all' });
      break;

    case 'collection':
      showView('catalog');
      renderCatalog({ category: 'all', theme: parts[1] || 'all' });
      break;

    case 'collections':
      showView('collections');
      renderCollections();
      break;

    case 'product':
      showView('product');
      renderProduct(parts[1]);
      break;

    case 'about':
      showView('about');
      break;

    default:
      location.replace('#/');
      showView('home');
      renderHome();
      return;
  }

  markNav(hash);
  window.scrollTo({ top: 0, behavior: 'auto' });

  // системная кнопка «назад» внутри Telegram
  if (tg?.BackButton) {
    try {
      if (parts.length) tg.BackButton.show(); else tg.BackButton.hide();
    } catch (_) { /* старые версии клиента */ }
  }
}

tg?.BackButton?.onClick?.(() => history.back());
window.addEventListener('hashchange', route);

/* ============ СТАРТ ============ */
function boot() {
  if (!window.STORE_DATA || !ITEMS.length) {
    document.getElementById('main').innerHTML =
      '<div class="shell empty"><p>Каталог не загрузился. Проверьте, что рядом с index.html ' +
      'лежит файл products.js.</p></div>';
    return;
  }

  initTheme();
  loadCart();
  renderCartBadge();
  buildFilterControls();

  const sellerLink = `https://t.me/${CONFIG.sellerUsername}`;
  document.getElementById('aboutContact').href = sellerLink;
  document.getElementById('footerContact').href = sellerLink;

  route();
}

boot();
