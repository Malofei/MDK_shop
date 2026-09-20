// app.js — MDK Shop
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

// «1 вещь · 2 вещи · 5 вещей» — с учётом 11–14 и 21, 22…
const plural = (n, one, few, many) => {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
};

// Логотипы коллекций и принты для колеса лежат в art.js — бот их не трогает.
const COLLECTION_ART = window.COLLECTION_ART || {};
const PRINT_ART = window.PRINT_ART || {};

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
const THEME_KEY = 'mdk-theme';

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
const CART_KEY = 'mdk-cart-v2';
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
  return `Заказ в MDK Shop:\n${lines.join('\n')}\n\nИтого: ${money(cartTotal())}`;
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

// Логотип коллекции: сначала art.js, потом поле cover из products.js (если бот когда-нибудь его заполнит).
function collectionArt(theme) {
  const art = COLLECTION_ART[theme.slug];
  if (art) return art;
  return theme.cover ? { src: theme.cover } : null;
}

// CSS-переменные плитки: цвет подложки, точки, кадрирование
function artVars(art) {
  if (!art) return '';
  const vars = [];
  if (art.bg) vars.push(`--cover-bg:${art.bg}`);
  if (art.dot) vars.push(`--cover-dot:${art.dot}`);
  if (art.pos) vars.push(`--cover-pos:${art.pos}`);
  if (art.h) vars.push(`--cover-h:${art.h}`);
  return vars.join(';');
}

const artStyle = (art) => (artVars(art) ? ` style="${artVars(art)}"` : '');

function collectionHTML(theme) {
  const count = ITEMS.filter((p) => p.theme === theme.slug).length;
  const label = count === 0
    ? 'скоро'
    : `${count} ${plural(count, 'вещь', 'вещи', 'вещей')}`;
  const art = collectionArt(theme);
  return `
    <a class="collection" href="#/collection/${theme.slug}">
      <div class="collection__cover tile-art${art?.fit === 'cover' ? ' tile-art--bleed' : ''}"${artStyle(art)}>
        ${art ? `<img src="${art.src}" alt="" loading="lazy" decoding="async">` : ''}
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

/* ============ КОЛЕСО ПРИНТОВ ============
   Радиальное меню, как «колесо навыков» в играх: пять секторов — пять последних
   футболок. Секторы выбираются наведением, тапом или клавиатурой; в центре
   показывается выбранная вещь. Геометрия считается в координатах viewBox 600×600. */
const WHEEL = {
  size: 5,               // сколько принтов в колесе
  category: 'tshirts',   // из какой категории; null — из всех
  center: 300,
  outer: 282,            // внешний радиус секторов
  inner: 118,            // внутренний радиус секторов
  hub: 102,              // радиус центрального диска
  gap: 3.5,              // половина зазора между секторами, px
  lift: 10,              // на сколько активный сектор выезжает наружу
  printSize: 156,        // сторона квадрата под принт
  autoEvery: 3200,       // мс между шагами подсветки, пока человек не тронул колесо
};

let stopWheel = () => {};

function wheelItems() {
  return ITEMS
    .filter((p) => !WHEEL.category || p.category === WHEEL.category)
    .sort((a, b) => b.id - a.id)                 // новые — первыми
    .slice(0, WHEEL.size)
    .map((product) => {
      const print = PRINT_ART[product.id];
      return { product, src: print || cover(product), isPrint: Boolean(print) };
    });
}

const polar = (r, deg) => {
  const t = (deg * Math.PI) / 180;
  return [WHEEL.center + r * Math.cos(t), WHEEL.center + r * Math.sin(t)];
};

// Кольцевой сектор. gap — половина зазора в пикселях: одинаковая ширина и у центра, и у края.
function wedgePath(mid, half, ri, ro, gap) {
  const toDeg = (rad) => (rad * 180) / Math.PI;
  const dOut = half - toDeg(Math.asin(gap / ro));
  const dIn = half - toDeg(Math.asin(gap / ri));
  const pts = [polar(ro, mid - dOut), polar(ro, mid + dOut), polar(ri, mid + dIn), polar(ri, mid - dIn)]
    .map(([x, y]) => `${x.toFixed(2)} ${y.toFixed(2)}`);
  return `M${pts[0]}A${ro} ${ro} 0 0 1 ${pts[1]}L${pts[2]}A${ri} ${ri} 0 0 0 ${pts[3]}Z`;
}

const shortName = (name) => name.replace(/^(Футболка|Худи)\s+/i, '');

function wheelHTML(items) {
  const n = items.length;
  const step = 360 / n;
  const half = step / 2;
  const mid0 = (WHEEL.inner + WHEEL.outer) / 2;
  const c = WHEEL.center;
  const box = WHEEL.printSize;

  const slots = items.map(({ product, src, isPrint }, i) => {
    const mid = -90 + step * i;                      // первый сектор — сверху, дальше по часовой
    const rad = (mid * Math.PI) / 180;
    const [px, py] = polar(mid0, mid);
    const label = `${product.name}, ${titleOfTheme(product.theme)}, ${money(product.price)}`;
    return `
      <g class="wheel__slot" data-slot="${i}"
         style="--dx:${(Math.cos(rad) * WHEEL.lift).toFixed(2)}px;--dy:${(Math.sin(rad) * WHEEL.lift).toFixed(2)}px;--delay:${(0.08 * i + 0.05).toFixed(2)}s">
        <a href="#/product/${product.id}" aria-label="${label}">
          <g class="wheel__enter">
            <g class="wheel__lift">
              <path class="wheel__wedge" d="${wedgePath(mid, half, WHEEL.inner, WHEEL.outer, WHEEL.gap)}"/>
              <path class="wheel__tone" d="${wedgePath(mid, half, WHEEL.inner, WHEEL.outer, WHEEL.gap)}" fill="url(#wheelDots)"/>
              <circle class="wheel__glow" cx="${px.toFixed(2)}" cy="${py.toFixed(2)}" r="${box * 0.64}" fill="url(#wheelGlow)"/>
              <image class="wheel__print${isPrint ? '' : ' is-photo'}" href="${src}"
                     x="${(px - box / 2).toFixed(2)}" y="${(py - box / 2).toFixed(2)}" width="${box}" height="${box}"
                     preserveAspectRatio="xMidYMid meet"/>
            </g>
          </g>
          <path class="wheel__hit" d="${wedgePath(mid, half, WHEEL.inner - 2, WHEEL.outer + 6, 0)}"/>
        </a>
      </g>`;
  }).join('');

  const r0 = WHEEL.hub + 4;
  const r1 = WHEEL.inner - 1;
  return `
    <svg class="wheel__svg" viewBox="0 0 600 600" aria-hidden="false" focusable="false">
      <defs>
        <pattern id="wheelDots" width="9" height="9" patternUnits="userSpaceOnUse">
          <circle cx="4.5" cy="4.5" r="1.25" fill="#EFEAE2" fill-opacity=".11"/>
        </pattern>
        <radialGradient id="wheelGlow">
          <stop offset="0" stop-color="#EFEAE2" stop-opacity=".2"/>
          <stop offset="1" stop-color="#EFEAE2" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <circle class="wheel__shadow" cx="${c + 8}" cy="${c + 8}" r="${WHEEL.outer}"/>
      <circle class="wheel__base" cx="${c}" cy="${c}" r="${WHEEL.outer}"/>
      ${slots}
      <circle class="wheel__hub-bg" cx="${c}" cy="${c}" r="${WHEEL.hub}"/>
      <path class="wheel__pointer" d="M${c + r0} ${c - 8}L${c + r1} ${c}L${c + r0} ${c + 8}Z"/>
    </svg>
    <div class="wheel__hub">
      <div class="wheel__hub-inner" id="wheelHub"></div>
    </div>`;
}

function initWheel(root, items) {
  const slots = [...root.querySelectorAll('.wheel__slot')];
  const pointer = root.querySelector('.wheel__pointer');
  const hub = root.querySelector('#wheelHub');
  const n = items.length;
  const step = 360 / n;
  const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;

  let active = -1;
  let pointerAngle = -90;
  let timer = null;
  let ticks = 0;

  function paintHub(i, animate) {
    const { product } = items[i];
    hub.innerHTML = `
      <p class="wheel__theme">${i === 0 ? '<span class="wheel__tag">новинка</span>' : ''}${titleOfTheme(product.theme)}</p>
      <p class="wheel__name">${shortName(product.name)}</p>
      <p class="wheel__price">${money(product.price)}</p>
      <a class="wheel__open" href="#/product/${product.id}">Смотреть</a>`;
    if (animate) {
      hub.classList.remove('is-swapping');
      void hub.offsetWidth;                        // перезапуск CSS-анимации
      hub.classList.add('is-swapping');
    }
  }

  function select(i) {
    if (i === active) return;
    const first = active === -1;
    active = i;
    slots.forEach((slot, k) => slot.classList.toggle('is-active', k === i));

    // стрелка поворачивается по кратчайшему пути, а не крутится назад через 360°
    const target = -90 + step * i;
    pointerAngle = first ? target : pointerAngle + ((target - pointerAngle + 540) % 360) - 180;
    pointer.style.transform = `rotate(${pointerAngle}deg)`;

    paintHub(i, !first);
  }

  function stopAuto() {
    if (timer) clearInterval(timer);
    timer = null;
  }

  function startAuto() {
    if (reduceMotion || n < 2) return;
    timer = setInterval(() => {
      if (document.hidden) return;
      ticks += 1;
      select((active + 1) % n);
      if (ticks >= n * 2) stopAuto();              // два круга, чтобы привлечь внимание, и хватит
    }, WHEEL.autoEvery);
  }

  // На телефоне первый тап выбирает сектор, второй — открывает вещь.
  let lastPointer = '';
  let wasActive = false;

  slots.forEach((slot, i) => {
    const link = slot.querySelector('a');

    link.addEventListener('pointerenter', (event) => {
      if (event.pointerType === 'touch') return;
      stopAuto();
      select(i);
    });

    link.addEventListener('pointerdown', (event) => {
      lastPointer = event.pointerType;
      wasActive = active === i;
      stopAuto();
      select(i);
    });

    link.addEventListener('keydown', () => { lastPointer = 'key'; });
    link.addEventListener('focus', () => { stopAuto(); select(i); });

    link.addEventListener('click', (event) => {
      if (lastPointer === 'touch' && !wasActive) event.preventDefault();
    });
  });

  hub.addEventListener('pointerdown', stopAuto);

  select(0);
  startAuto();
  return stopAuto;
}

function renderWheel() {
  const root = document.getElementById('heroWheel');
  stopWheel();
  stopWheel = () => {};
  if (!root) return;                               // разметка без колеса (старый index.html)

  const items = wheelItems();

  if (items.length < 3) {                          // из двух секторов колесо не собрать
    root.hidden = true;
    return;
  }
  root.hidden = false;
  root.innerHTML = wheelHTML(items);
  stopWheel = initWheel(root, items);
}

/* ============ ГЛАВНАЯ ============ */
function renderHome() {
  // Колесо — украшение: если с ним что-то не так, остальная главная всё равно рисуется.
  try {
    renderWheel();
  } catch (error) {
    console.error('Колесо принтов не построилось:', error);
    const root = document.getElementById('heroWheel');
    if (root) root.hidden = true;
  }

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

  const word = plural(list.length, 'вещь', 'вещи', 'вещей');
  document.getElementById('resultCount').textContent =
    list.length ? `Показано ${list.length} ${word}` : '';
}

function renderCatalog({ category = 'all', theme = 'all' } = {}) {
  filters.category = category;
  filters.theme = theme;

  const heading = document.getElementById('catalogTitle');
  const info = document.getElementById('catalogInfo');

  // логотип коллекции рядом с заголовком
  const logo = document.getElementById('catalogLogo');
  const art = theme !== 'all' && themeBySlug(theme) ? collectionArt(themeBySlug(theme)) : null;
  if (logo) {
    logo.hidden = !art;
    logo.classList.toggle('tile-art--bleed', art?.fit === 'cover');
    logo.style.cssText = artVars(art);
    logo.innerHTML = art
      ? `<img src="${art.src}" alt="${titleOfTheme(theme)}" decoding="async">`
      : '';
  }

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
  const n = COLLECTIONS.length;
  const info = document.getElementById('collectionsInfo');
  if (info) info.textContent = `${n} ${plural(n, 'вселенная', 'вселенные', 'вселенных')}, по которым у нас есть принты.`;
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

  document.title = `${product.name} — MDK Shop`;
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
  document.title = 'MDK Shop — футболки и худи по манге и аниме';

  if (!cartPanel.hidden) closeCart();
  if (!lightbox.hidden) closeLightbox();

  stopWheel();                                     // автоподсветка колеса не должна жить вне главной

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
