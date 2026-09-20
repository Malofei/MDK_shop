// art.js — картинки, которые бот не генерирует.
// products.js бот пересобирает целиком и стирает всё лишнее, поэтому логотипы
// коллекций и принты для колеса лежат здесь, отдельно.

/* ---------- Логотипы коллекций ----------
   Ключ — slug коллекции из products.js (THEMES).
   src  — файл логотипа
   bg   — цвет плитки под логотипом
   dot  — цвет растровых точек на плитке (необязательно)
   fit  — 'cover', если картинка должна закрыть плитку целиком (обложка), иначе логотип вписывается
   pos  — какую часть обложки показывать при fit: 'cover' (необязательно)
   h    — максимальная высота логотипа в плитке (необязательно, для «квадратных» логотипов) */
window.COLLECTION_ART = {
  "berserk":   { src: "images/logos/berserk.webp",   bg: "#0C0A0E" },
  "bleach":    { src: "images/logos/bleach.webp",    bg: "#0C0A0E" },
  "jujutsu":   { src: "images/logos/jujutsu.webp",   bg: "#EFEAE2", dot: "rgba(22, 21, 26, .09)" },
  "hollow":    { src: "images/logos/hollow.webp",    bg: "#0C0A0E", fit: "cover", pos: "50% 0%" },
  "dmc":       { src: "images/logos/dmc.webp",       bg: "#0C0A0E" },
  "witcher":   { src: "images/logos/witcher.webp",   bg: "#0C0A0E", h: "74%" },
  "one-piece": { src: "images/logos/one-piece.webp", bg: "#0C0A0E" },
};

/* ---------- Принты для колеса на главной ----------
   Колесо показывает 5 последних футболок из каталога (по id).
   Ключ — id товара, значение — файл принта (PNG/WebP на прозрачном фоне).
   Если для товара принта нет, в колесе временно показывается фото футболки.

   ВРЕМЕННО: эти файлы вырезаны автоматически из фото футболок.
   Когда будут настоящие принты — просто замените пути. */
window.PRINT_ART = {
  8: "images/prints/zoro.webp",
  7: "images/prints/toji.webp",
  6: "images/prints/higuruma.webp",
  5: "images/prints/dmc.webp",
  4: "images/prints/witcher.webp",
};
