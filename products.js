// products.js
// Каталог MDK Shop.
// Файл сгенерирован ботом 20.09.2026 14:49. Правки удобнее делать через бота:
// он пересоберёт этот файл целиком и приложит картинки.

const CATEGORIES = [
  { slug: "tshirts", title: "Футболки", info: "Хлопок 92% / эластан 8%. Плотность 240 г/м². Прямой крой." },
  { slug: "hoodies", title: "Худи", info: "Хлопок 100%. Плотность 280–320 г/м²." },
];

const THEMES = [
  { slug: "berserk", title: "Берсерк", cover: "", info: "Коллекция по мотивам манги «Берсерк»" },
  { slug: "bleach", title: "Блич", cover: "", info: "Коллекция по мотивам аниме «Блич»" },
  { slug: "jujutsu", title: "Магическая битва", cover: "", info: "Коллекция по мотивам Jujutsu Kaisen" },
  { slug: "hollow", title: "Hollow Knight", cover: "", info: "Коллекция по мотивам игры Hollow Knight" },
  { slug: "dmc", title: "Devil May Cry", cover: "", info: "Коллекция по мотивам серии Devil May Cry" },
  { slug: "witcher", title: "Ведьмак", cover: "", info: "Коллекция по мотивам «Ведьмака»" },
  { slug: "one-piece", title: "Ван-Пис", cover: "", info: "Коллекция по мотивам «Ван-Пис»" },
];

const PRODUCTS = [
  {
    id: 1,
    name: "Футболка Berserk 1",
    category: "tshirts",
    theme: "berserk",
    price: 4600,
    sizes: [
      "S",
      "M",
      "L",
      "XL",
      "XXL"
    ],
    images: [
      "images/berserk1.png",
      "images/berserk2.png"
    ],
  },
  {
    id: 2,
    name: "Футболка Griffith",
    category: "tshirts",
    theme: "berserk",
    price: 3000,
    sizes: [
      "S",
      "M",
      "L",
      "XL",
      "XXL"
    ],
    images: [
      "images/griffith1.png",
      "images/griffith2.png"
    ],
  },
  {
    id: 3,
    name: "Футболка Berserk 3",
    category: "tshirts",
    theme: "berserk",
    price: 3600,
    sizes: [
      "S",
      "M",
      "L",
      "XL",
      "XXL"
    ],
    images: [
      "images/berserk_2_1.png",
      "images/berserk_2_2.png"
    ],
  },
  {
    id: 4,
    name: "Футболка Ведьмак",
    category: "tshirts",
    theme: "witcher",
    price: 4000,
    sizes: [
      "S",
      "M",
      "L",
      "XL",
      "XXL"
    ],
    images: [
      "images/witcher1.png",
      "images/witcher2.png"
    ],
  },
  {
    id: 5,
    name: "Футболка DMC 1",
    category: "tshirts",
    theme: "dmc",
    price: 4500,
    sizes: [
      "S",
      "M",
      "L",
      "XL",
      "XXL"
    ],
    images: [
      "images/dmc1.png",
      "images/dmc2.png"
    ],
  },
  {
    id: 6,
    name: "Футболка Hiromi Higuruma",
    category: "tshirts",
    theme: "jujutsu",
    price: 4500,
    sizes: [
      "S",
      "M",
      "L",
      "XL",
      "XXL"
    ],
    images: [
      "images/higuruma1.png",
      "images/higuruma2.png"
    ],
  },
  {
    id: 7,
    name: "Футболка Toji",
    category: "tshirts",
    theme: "jujutsu",
    price: 4500,
    sizes: [
      "S",
      "M",
      "L",
      "XL",
      "XXL"
    ],
    images: [
      "images/toji1.png",
      "images/toji2.png"
    ],
  },
  {
    id: 8,
    name: "Футболка Zoro",
    category: "tshirts",
    theme: "one-piece",
    price: 4500,
    sizes: [
      "S",
      "M",
      "L",
      "XL",
      "XXL"
    ],
    images: [
      "images/zoro1.png",
      "images/zoro2.png"
    ],
  },
  {
    id: 9,
    name: "Худи Berserk",
    category: "hoodies",
    theme: "berserk",
    price: 7000,
    sizes: [
      "S",
      "M",
      "L",
      "XL",
      "XXL"
    ],
    images: [
      "images/berserk_3_1.png",
      "images/berserk_3_2.png",
      "images/berserk_3_3.png",
      "images/berserk_3_4.png"
    ],
  },
  {
    id: 10,
    name: "Худи Griffith",
    category: "hoodies",
    theme: "berserk",
    price: 7000,
    sizes: [
      "S",
      "M",
      "L",
      "XL",
      "XXL"
    ],
    images: [
      "images/berserk_4_1.png",
      "images/berserk_4_2.png",
      "images/berserk_4_3.png",
      "images/berserk_4_4.png"
    ],
  },
];

// Доступ к данным из app.js
window.STORE_DATA = { categories: CATEGORIES, themes: THEMES, products: PRODUCTS };
