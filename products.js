// products.js
// Каталог MDK Shop.
// Файл сгенерирован ботом 19.09.2026 19:48. Правки удобнее делать через бота:
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
      "images/tshka_berserk_1.jpg",
      "images/tshka_berserk_2.jpg"
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
      "images/tshka_grif_1.jpg",
      "images/tshka_grif_2.jpg"
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
      "images/tshka_berserk_21.jpg",
      "images/tshka_berserk_22.jpg"
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
      "images/tshka_witcher_1.jpg",
      "images/tshka_witcher_2.jpg"
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
      "images/tshka_dmc_1.jpg",
      "images/tshka_dmc_2.jpg"
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
      "images/tshka_higuruma_1.jpg",
      "images/tshka_higuruma_2.jpg"
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
      "images/tshka_toji_1.jpg",
      "images/tshka_toji_2.jpg"
    ],
  },
];

// Доступ к данным из app.js
window.STORE_DATA = { categories: CATEGORIES, themes: THEMES, products: PRODUCTS };
