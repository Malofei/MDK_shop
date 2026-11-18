const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');

const root = path.join(__dirname, '..');
const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
const wheelSource = app.slice(app.indexOf('const WHEEL = {'), app.indexOf('/* ============ ГЛАВНАЯ'));

function wheel(products, prints) {
  const context = vm.createContext({
    ITEMS: products,
    PRINT_ART: prints,
    cover: product => product.images[0],
    preview: src => src.replace('images/prints/', 'images/prints/sm/'),
    titleOfTheme: () => 'Collection',
    money: value => `${value} RUB`,
  });
  vm.runInContext(wheelSource, context);
  return {
    items: () => context.wheelItems(),
    html: items => context.wheelHTML(items),
  };
}

function product(id, category = 'tshirts') {
  return { id, category, name: `Shirt ${id}`, price: 3500, images: [`images/prints/shirt-${id}.webp`] };
}

test('a new shirt without separate artwork is the first item in the wheel', () => {
  const products = Array.from({ length: 8 }, (_, i) => product(i + 1));
  const prints = Object.fromEntries(products.slice(0, 7).map(p => [p.id, `images/prints/art-${p.id}.webp`]));
  const result = wheel(products, prints).items();
  assert.deepEqual(Array.from(result, item => item.product.id), [8, 7, 6, 5, 4]);
  assert.equal(result[0].src, 'images/prints/sm/shirt-8.webp');
  assert.equal(result[0].isPrint, false);
  assert.ok(result.slice(1).every(item => item.src === prints[item.product.id] && item.isPrint));
  assert.equal(products.length, 8);
  assert.deepEqual(products.map(p => p.id), [1, 2, 3, 4, 5, 6, 7, 8]);
});

test('new products stay in the wheel even when none has separate artwork', () => {
  const products = Array.from({ length: 10 }, (_, i) => product(i + 1));
  const prints = Object.fromEntries(products.slice(0, 5).map(p => [p.id, `art-${p.id}.webp`]));
  assert.deepEqual(Array.from(wheel(products, prints).items(), x => x.product.id), [10, 9, 8, 7, 6]);
});

test('a new shirt enters the wheel as soon as its separate artwork is supplied', () => {
  const products = [product(1), product(2), product(3)];
  const prints = { 1: 'one.webp', 2: 'two.webp', 3: 'three.webp' };
  assert.deepEqual(Array.from(wheel(products, prints).items(), x => x.product.id), [3, 2, 1]);
});

test('hoodies and artwork for deleted products do not enter the shirt wheel', () => {
  const result = wheel([product(1), product(2, 'hoodies')], { 1: 'one.webp', 2: 'two.webp', 99: 'deleted.webp' }).items();
  assert.deepEqual(Array.from(result, x => x.product.id), [1]);
});

test('empty and invalid artwork values safely use product photos', () => {
  const result = wheel([product(1), product(2), product(3), product(4)], { 1: '', 2: '  ', 3: null, 4: {} }).items();
  assert.equal(result.length, 4);
  assert.ok(result.every(item => item.src.includes('/sm/') && !item.isPrint));
});

test('Doflamingo uses the supplied transparent artwork', () => {
  const context = vm.createContext({window: {}});
  for (const name of ['products.js', 'art.js']) vm.runInContext(fs.readFileSync(path.join(root, name), 'utf8'), context);
  const products = context.window.STORE_DATA.products;
  const current = wheel(products, context.window.PRINT_ART);
  const result = current.items();
  assert.deepEqual(Array.from(result, x => x.product.id), [14, 13, 12, 11, 8]);
  assert.ok(products.some(p => p.id === 14));
  const html = current.html(result);
  assert.equal((html.match(/<image class="wheel__print/g) || []).length, 5);
  assert.equal(result[0].src, 'images/prints/doflamingo-wheel.png');
  assert.equal(result[0].isPrint, true);
  assert.ok(fs.existsSync(path.join(root, result[0].src)));
  assert.ok(!html.includes('is-photo'));
  assert.ok(html.includes('href="#/product/14"'));
});

test('uploaded artwork takes priority and stays out of gallery photos', () => {
  const p = { ...product(1), wheelImage: ' images/prints/uploaded-wheel.webp ' };
  const current = wheel([p], {1: 'legacy.webp'});
  const result = current.items();
  assert.equal(result[0].src, 'images/prints/uploaded-wheel.webp');
  assert.equal(result[0].isPrint, true);
  assert.deepEqual(p.images, ['images/prints/shirt-1.webp']);
  assert.ok(current.html(result).includes('class="wheel__print" href="images/prints/uploaded-wheel.webp"'));
});

test('empty uploaded artwork keeps legacy artwork or a product photo', () => {
  const products = [{...product(1), wheelImage: ' '}, {...product(2), wheelImage: null}];
  const result = wheel(products, {1:'legacy.webp'}).items();
  assert.equal(result[0].isPrint, false);
  assert.equal(result[1].src, 'legacy.webp');
});

test('each photo has its own clipping region while prepared prints retain their rendering', () => {
  const current = wheel([product(1), product(2), product(3)], {1:'one.webp'});
  const html = current.html(current.items());
  assert.equal((html.match(/<clipPath /g) || []).length, 2);
  assert.ok(html.includes('id="wheel-photo-clip-0"'));
  assert.ok(html.includes('id="wheel-photo-clip-1"'));
  assert.ok(!html.includes('id="wheel-photo-clip-2"'));
  assert.ok(html.includes('class="wheel__print" href="one.webp"'));
});
