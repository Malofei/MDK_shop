// products.js
// Каталог G&E Store.
// Файл сгенерирован ботом 19.09.2026 13:27. Правки удобнее делать через бота:
// он пересоберёт этот файл целиком и приложит картинки.

const CATEGORIES = [
  { slug: "tshirts", title: "Футболки", info: "Хлопок 92% / эластан 8%. Плотность 240 г/м². Прямой крой." },
  { slug: "hoodies", title: "Худи", info: "Хлопок 100%. Плотность 280–320 г/м²." },
];

const THEMES = [
  { slug: "berserk", title: "Берсерк", cover: "images/logo_berserk.png", info: "Коллекция по мотивам манги «Берсерк»" },
  { slug: "bleach", title: "Блич", cover: "images/logo_bleach.jpg", info: "Коллекция по мотивам аниме «Блич»" },
  { slug: "jujutsu", title: "Магическая битва", cover: "images/juj_logo.png", info: "Коллекция по мотивам Jujutsu Kaisen" },
  { slug: "hollow", title: "Hollow Knight", cover: "images/hk_logo.png", info: "Коллекция по мотивам игры Hollow Knight" },
  { slug: "dmc", title: "Devil May Cry", cover: "images/logo_dmc.jpg", info: "Коллекция по мотивам серии Devil May Cry" },
  { slug: "witcher", title: "Ведьмак", cover: "images/logo_witcher.jpg", info: "Коллекция по мотивам «Ведьмака»" },
];

const PRODUCTS = [
  {
    id: 1,
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
        "images/hoodie1.jpg",
        "images/hoddie2.jpg",
        "images/hoddie3.jpg",
        "images/hoddie4.jpg",
        "images/hoodie5.jpg",
        "images/hoodie6.jpg",
        "images/hoodie7.jpg"
    ],
  },
  {
    id: 2,
    name: "Худи Berserk 2",
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
        "images/hoddie_grif_1.jpg",
        "images/hoddie_grif_2.jpg",
        "images/hoddie_grif_3.jpg",
        "images/hoddie_grif_4.jpg",
        "images/hoddie_grif_5.jpg",
        "images/hoddie_grif_6.jpg",
        "images/hoddie_grif_7.jpg",
        "images/hoddie_grif_8.jpg"
    ],
  },
  {
    id: 3,
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
        "images/tshka_berserk_2.jpg",
        "images/tshka_berserk_3.jpg",
        "images/tshka_berserk_4.jpg"
    ],
  },
  {
    id: 4,
    name: "Футболка Berserk 2",
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
    id: 5,
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
    id: 6,
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
        "images/tshka_witcher_2.jpg",
        "images/tshka_witcher_3.jpg",
        "images/tshka_witcher_4.jpg"
    ],
  },
  {
    id: 7,
    name: "Футболка Bleach 1",
    category: "tshirts",
    theme: "bleach",
    price: 4500,
    sizes: [
        "S",
        "M",
        "L",
        "XL",
        "XXL"
    ],
    images: [
        "images/tshka_urahara_1.jpg",
        "images/tshka_urahara_2.jpg",
        "images/tshka_urahara_3.jpg",
        "images/tshka_urahara_4.jpg"
    ],
  },
  {
    id: 8,
    name: "Футболка Bleach 2",
    category: "tshirts",
    theme: "bleach",
    price: 4500,
    sizes: [
        "S",
        "M",
        "L",
        "XL",
        "XXL"
    ],
    images: [
        "images/tshka_kyoraku_1.jpg",
        "images/tshka_kyoraku_2.jpg",
        "images/tshka_kyoraku_3.jpg",
        "images/tshka_kyoraku_4.jpg"
    ],
  },
  {
    id: 9,
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
        "images/tshka_dmc_2.jpg",
        "images/tshka_dmc_3.jpg",
        "images/tshka_dmc_4.jpg"
    ],
  },
  {
    id: 10,
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
        "images/tshka_higuruma.png",
        "images/tshka_higuruma2.png",
        "images/tshka_higuruma3.png",
        "images/tshka_higuruma4.png"
    ],
  },
];

// Доступ к данным из app.js
window.STORE_DATA = { categories: CATEGORIES, themes: THEMES, products: PRODUCTS };
