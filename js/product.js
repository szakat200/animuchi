// ===== СТРАНИЦА ТОВАРА =====
import { loadProductsFromFirebase } from './firebase.js';
import { getCart, saveCart, updateCartCount } from './cart-utils.js';

const CAT_LABELS = {
  figures: 'Фигурки', posters: 'Постеры', pendants: 'Кулоны',
  accessories: 'Аксессуары', kpop: 'K-Pop',
};

let qty = 1;
let currentProduct = null;

async function loadProduct() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  if (!id) { window.location.href = 'catalog.html'; return; }

  const layout = document.getElementById('productLayout');

  // Сначала пробуем Firebase
  let product = null;
  try {
    const firebaseProducts = await loadProductsFromFirebase();
    if (firebaseProducts) {
      product = firebaseProducts.find(p => p.firebaseId === id);
    }
  } catch (e) {}

  // Если не нашли в Firebase — ищем в локальных (через window.PRODUCTS если доступно)
  if (!product && typeof window.PRODUCTS !== 'undefined') {
    product = window.PRODUCTS.find(p => String(p.id) === String(id));
  }

  if (!product) {
    layout.innerHTML = `
      <div class="loading-state">
        <p>Товар не найден</p>
        <a href="catalog.html" class="btn btn--primary" style="margin-top:16px;">Вернуться в каталог</a>
      </div>`;
    return;
  }

  currentProduct = product;

  // Breadcrumb
  document.getElementById('breadcrumbName').textContent = product.name;
  document.title = product.name + ' — Animuchi';

  // Скидка
  let discountHtml = '';
  if (product.oldPrice && product.price) {
    const pct = Math.round((1 - product.price / product.oldPrice) * 100);
    discountHtml = `<span class="product-info__discount">−${pct}%</span>`;
  }

  // Наличие
  const inStock = product.inStock !== false;
  const stockHtml = inStock
    ? `<span class="stock-dot stock-dot--in"></span><span class="stock-in">Есть в наличии</span>`
    : `<span class="stock-dot stock-dot--out"></span><span class="stock-out">Нет в наличии</span>`;

  layout.innerHTML = `
    <div class="product-gallery">
      <div class="product-gallery__main">
        ${product.photoUrl
          ? `<img src="${product.photoUrl}" alt="${product.name}" loading="lazy" />`
          : `<span class="product-emoji-big">${product.emoji || '📦'}</span>`}
      </div>
    </div>

    <div class="product-info">
      <div class="product-info__cat">${CAT_LABELS[product.category] || product.category}</div>
      <h1 class="product-info__name">${product.name}</h1>
      <div class="product-info__rating" id="productRating"></div>
      <div class="product-info__title">${product.title || ''}</div>

      ${product.badge ? `
        <div class="product-info__badges">
          <span class="product-card__badge badge--${product.badge}" style="position:static;">
            ${product.badge === 'new' ? 'Новинка' : 'Скидка'}
          </span>
        </div>` : ''}

      <div class="product-info__price-row">
        <span class="product-info__price">${Number(product.price).toLocaleString('ru-RU')} ₽</span>
        ${product.oldPrice ? `<span class="product-info__price-old">${Number(product.oldPrice).toLocaleString('ru-RU')} ₽</span>` : ''}
        ${discountHtml}
      </div>

      <div class="product-info__stock">${stockHtml}</div>

      ${inStock ? `
        <div class="product-info__qty">
          <label>Количество:</label>
          <div class="qty-control-big">
            <button id="qtyMinus">−</button>
            <span id="qtyVal">1</span>
            <button id="qtyPlus">+</button>
          </div>
        </div>` : ''}

      <div class="product-info__actions">
        ${inStock ? `
          <button class="btn btn--primary" id="addToCartBtn">
            <i class="fas fa-cart-plus"></i> В корзину
          </button>` : `
          <a href="order.html" class="btn btn--primary">
            <i class="fas fa-search"></i> Заказать под заказ
          </a>`}
        <button class="btn btn--outline" id="wishlistProductBtn">
          <i class="fas fa-heart"></i> В избранное
        </button>
        <a href="catalog.html" class="btn btn--outline">
          <i class="fas fa-arrow-left"></i> Назад
        </a>
      </div>

      ${product.description ? `
        <div class="product-info__desc">
          <h4>Описание</h4>
          <p>${product.description}</p>
        </div>` : ''}

      <div class="product-info__meta">
        <div class="product-info__meta-row">
          <i class="fas fa-truck"></i>
          <span>Самовывоз: <strong>Лесной, ул. Ленина 64, 2 этаж</strong></span>
        </div>
        <div class="product-info__meta-row">
          <i class="fas fa-box"></i>
          <span>Доставка по России: <strong>Почта России, СДЭК</strong></span>
        </div>
        <div class="product-info__meta-row">
          <i class="fas fa-money-bill-wave"></i>
          <span>Оплата: <strong>Наличные, СБП</strong></span>
        </div>
      </div>
    </div>
  `;

  const pid = String(product.firebaseId || product.id);

  // Рейтинг под заголовком
  const ratingEl = document.getElementById('productRating');
  if (ratingEl && typeof getAverageRating === 'function') {
    const avg = getAverageRating(pid);
    const reviews = getProductReviews(pid);
    if (avg > 0) {
      ratingEl.innerHTML = `${starsHtml(avg)} <span class="rating-count">${reviews.length} ${pluralRu(reviews.length, 'отзыв', 'отзыва', 'отзывов')}</span>`;
    }
  }

  // Избранное
  const wishlistProductBtn = document.getElementById('wishlistProductBtn');
  if (wishlistProductBtn && typeof isInWishlist === 'function') {
    const updateWishlistBtn = () => {
      const active = isInWishlist(pid);
      wishlistProductBtn.innerHTML = active
        ? '<i class="fas fa-heart" style="color:#e74c3c"></i> В избранном'
        : '<i class="fas fa-heart"></i> В избранное';
    };
    updateWishlistBtn();
    wishlistProductBtn.addEventListener('click', () => {
      toggleWishlist({
        id: pid,
        name: product.name,
        price: product.price,
        emoji: product.emoji || '📦',
        photoUrl: product.photoUrl || null,
        category: product.category,
      });
      updateWishlistBtn();
      updateWishlistCount();
    });
  }

  // Отзывы
  if (typeof renderProductReviews === 'function') {
    renderProductReviews(pid);
    initReviewForm(pid);
  }

  // Количество
  const qtyMinus = document.getElementById('qtyMinus');
  const qtyPlus = document.getElementById('qtyPlus');
  const qtyVal = document.getElementById('qtyVal');

  if (qtyMinus && qtyPlus) {
    qtyMinus.addEventListener('click', () => {
      if (qty > 1) { qty--; qtyVal.textContent = qty; }
    });
    qtyPlus.addEventListener('click', () => {
      qty++;
      qtyVal.textContent = qty;
    });
  }

  // В корзину
  const addBtn = document.getElementById('addToCartBtn');
  if (addBtn) {
    addBtn.addEventListener('click', () => {
      const cart = JSON.parse(localStorage.getItem('animuchi_cart') || '[]');
      const pid = String(product.firebaseId || product.id);
      const existing = cart.find(i => String(i.id) === pid);
      if (existing) {
        existing.qty += qty;
      } else {
        cart.push({
          id: pid,
          name: product.name,
          price: product.price,
          emoji: product.emoji || '📦',
          photoUrl: product.photoUrl || null,
          qty,
        });
      }
      localStorage.setItem('animuchi_cart', JSON.stringify(cart));

      // Обновляем счётчик
      const total = cart.reduce((s, i) => s + i.qty, 0);
      document.querySelectorAll('#cartCount').forEach(el => {
        el.textContent = total;
      });

      // Анимация кнопки
      addBtn.classList.add('added');
      addBtn.innerHTML = '<i class="fas fa-check"></i> Добавлено!';
      setTimeout(() => {
        addBtn.classList.remove('added');
        addBtn.innerHTML = '<i class="fas fa-cart-plus"></i> В корзину';
      }, 1500);

      // Toast
      const toast = document.getElementById('toast');
      if (toast) {
        toast.textContent = `«${product.name}» добавлен в корзину 🛒`;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 2500);
      }
    });
  }
}

function renderProductReviews(productId) {
  const reviews = getProductReviews(productId);
  const list = document.getElementById('reviewsList');
  if (!list) return;

  if (reviews.length === 0) {
    list.innerHTML = '<p class="no-reviews">Пока нет отзывов. Будь первым!</p>';
    return;
  }

  list.innerHTML = `<div class="reviews-list">${reviews.map(r => `
    <div class="review-card">
      <div class="review-card__header">
        <div class="review-card__name">${r.name}</div>
        ${starsHtml(r.rating)}
        <div class="review-card__date">${r.date}</div>
      </div>
      ${r.text ? `<div class="review-card__text">${r.text}</div>` : ''}
    </div>
  `).join('')}</div>`;

  // Обновляем рейтинг под заголовком товара
  const ratingEl = document.getElementById('productRating');
  if (ratingEl) {
    const avg = getAverageRating(productId);
    ratingEl.innerHTML = `${starsHtml(avg)} <span class="rating-count">${reviews.length} ${pluralRu(reviews.length, 'отзыв', 'отзыва', 'отзывов')}</span>`;
  }
}

function initReviewForm(productId) {
  const form = document.getElementById('reviewForm');
  if (!form) return;

  let selectedRating = 0;
  const stars = document.querySelectorAll('.star-pick');

  stars.forEach((star, idx) => {
    star.addEventListener('mouseover', () => {
      stars.forEach((s, i) => s.classList.toggle('hover', i <= idx));
    });
    star.addEventListener('mouseout', () => {
      stars.forEach((s, i) => {
        s.classList.remove('hover');
        s.classList.toggle('selected', i < selectedRating);
      });
    });
    star.addEventListener('click', () => {
      selectedRating = idx + 1;
      stars.forEach((s, i) => s.classList.toggle('selected', i < selectedRating));
    });
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('reviewName').value.trim();
    const text = document.getElementById('reviewText').value.trim();
    if (!name) { alert('Введите ваше имя'); return; }
    if (!selectedRating) { alert('Выберите оценку'); return; }

    addProductReview(productId, { name, rating: selectedRating, text });
    renderProductReviews(productId);

    form.reset();
    selectedRating = 0;
    stars.forEach(s => s.classList.remove('selected', 'hover'));

    const toast = document.getElementById('toast');
    if (toast) {
      toast.textContent = 'Отзыв добавлен!';
      toast.classList.add('show');
      setTimeout(() => toast.classList.remove('show'), 2500);
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  loadProduct();
  // Счётчик корзины
  const cart = JSON.parse(localStorage.getItem('animuchi_cart') || '[]');
  const total = cart.reduce((s, i) => s + i.qty, 0);
  document.querySelectorAll('#cartCount').forEach(el => { el.textContent = total; });
});
