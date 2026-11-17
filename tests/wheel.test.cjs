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

test('a new shirt without separate artwork does not put its product photo in the wheel', () => {
  const products = Array.from({ length: 8 }, (_, i) => product(i + 1));
  const prints = Object.fromEntries(products.slice(0, 7).map(p => [p.id, `images/prints/art-${p.id}.webp`]));
  const result = wheel(products, prints).items();
  assert.deepEqual(Array.from(result, item => item.product.id), [7, 6, 5, 4, 3]);
  assert.ok(result.every(item => item.src === prints[item.product.id]));
  assert.equal(products.length, 8);
  assert.deepEqual(products.map(p => p.id), [1, 2, 3, 4, 5, 6, 7, 8]);
});

test('five prepared artworks are selected even when newer products have no artwork', () => {
  const products = Array.from({ length: 10 }, (_, i) => product(i + 1));
  const prints = Object.fromEntries(products.slice(0, 5).map(p => [p.id, `art-${p.id}.webp`]));
  assert.deepEqual(Array.from(wheel(products, prints).items(), x => x.product.id), [5, 4, 3, 2, 1]);
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

test('empty and invalid artwork values never fall back to product photos', () => {
  const result = wheel([product(1), product(2), product(3), product(4)], { 1: '', 2: '  ', 3: null, 4: {} }).items();
  assert.equal(result.length, 0);
});

test('the supplied catalog excludes Doflamingo from the wheel and keeps the product in the store', () => {
  const context = vm.createContext({window: {}});
  for (const name of ['products.js', 'art.js']) vm.runInContext(fs.readFileSync(path.join(root, name), 'utf8'), context);
  const products = context.window.STORE_DATA.products;
  const current = wheel(products, context.window.PRINT_ART);
  const result = current.items();
  assert.deepEqual(Array.from(result, x => x.product.id), [13, 12, 11, 8, 7]);
  assert.ok(products.some(p => p.id === 14));
  const html = current.html(result);
  assert.equal((html.match(/<image class="wheel__print"/g) || []).length, 5);
  assert.ok(!html.includes('is-photo'));
  assert.ok(!html.includes('doflamingo-14-1.webp'));
});
