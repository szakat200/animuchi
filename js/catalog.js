// ===== CATALOG =====
let currentCat = 'all';
let currentSearch = '';
let currentSort = 'default';

const grid = document.getElementById('productsGrid');
const emptyState = document.getElementById('emptyState');
const searchInput = document.getElementById('searchInput');
const sortSelect = document.getElementById('sortSelect');

// Категории на русском
const CAT_LABELS = {
  figures: 'Фигурки',
  posters: 'Постеры',
  pendants: 'Кулоны',
  accessories: 'Аксессуары',
  kpop: 'K-Pop',
};

function getFiltered() {
  let list = [...window.PRODUCTS];

  // Фильтр по категории
  if (currentCat !== 'all') {
    list = list.filter(p => p.category === currentCat);
  }

  // Поиск
  if (currentSearch.trim()) {
    const q = currentSearch.toLowerCase();
    list = list.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.title.toLowerCase().includes(q)
    );
  }

  // Сортировка
  if (currentSort === 'price-asc') list.sort((a, b) => a.price - b.price);
  if (currentSort === 'price-desc') list.sort((a, b) => b.price - a.price);
  if (currentSort === 'name-asc') list.sort((a, b) => a.name.localeCompare(b.name, 'ru'));

  return list;
}

function renderProducts() {
  const list = getFiltered();
  grid.innerHTML = '';

  if (list.length === 0) {
    emptyState.style.display = 'block';
    return;
  }
  emptyState.style.display = 'none';

  list.forEach(p => {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.innerHTML = `
      <a href="product.html?id=${p.id}" class="product-card__link">
      <div class="product-card__img">
        ${p.photoUrl
          ? `<img src="${p.photoUrl}" alt="${p.name}" style="width:100%;height:100%;object-fit:cover;">`
          : `<span>${p.emoji}</span>`}
        ${p.badge ? `<span class="product-card__badge badge--${p.badge}">${badgeLabel(p.badge)}</span>` : ''}
      </div>
      <div class="product-card__body">
        <div class="product-card__cat">${CAT_LABELS[p.category] || p.category}</div>
        <div class="product-card__name">${p.name}</div>
        <div class="product-card__title">${p.title}</div>
      </div>
      </a>
      <div class="product-card__footer">
        <div>
          <span class="product-card__price">${p.price} ₽</span>
          ${p.oldPrice ? `<span class="product-card__price-old">${p.oldPrice} ₽</span>` : ''}
        </div>
        <button class="add-to-cart-btn" data-id="${p.id}" data-name="${p.name}" data-price="${p.price}" data-emoji="${p.emoji || '📦'}" data-photo="${p.photoUrl || ''}">
          <i class="fas fa-cart-plus"></i> В корзину
        </button>
      </div>
    `;
    grid.appendChild(card);
  });

  // Кнопки "В корзину"
  grid.querySelectorAll('.add-to-cart-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      const name = btn.dataset.name;
      const price = Number(btn.dataset.price);
      const emoji = btn.dataset.emoji;
      const photoUrl = btn.dataset.photo;
      addToCart(id, name, price, emoji, photoUrl);
      btn.classList.add('added');
      btn.innerHTML = '<i class="fas fa-check"></i> Добавлено';
      setTimeout(() => {
        btn.classList.remove('added');
        btn.innerHTML = '<i class="fas fa-cart-plus"></i> В корзину';
      }, 1500);
    });
  });
}

function badgeLabel(badge) {
  if (badge === 'new') return 'Новинка';
  if (badge === 'sale') return 'Скидка';
  if (badge === 'order') return 'Под заказ';
  return badge;
}

function addToCart(id, name, price, emoji, photoUrl) {
  // Поддержка вызова как с параметрами так и по id из PRODUCTS
  if (!name) {
    const product = window.PRODUCTS.find(p => String(p.id) === String(id));
    if (!product) return;
    name = product.name;
    price = product.price;
    emoji = product.emoji;
    photoUrl = product.photoUrl;
  }

  const cart = getCart();
  const existing = cart.find(item => String(item.id) === String(id));
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ id: String(id), name, price, emoji: emoji || '📦', photoUrl: photoUrl || null, qty: 1 });
  }
  saveCart(cart);
  updateCartCount();
  showToast(`«${name}» добавлен в корзину 🛒`);
}

function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2500);
}

// ===== EVENTS =====
document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentCat = btn.dataset.cat;
    renderProducts();
  });
});

searchInput && searchInput.addEventListener('input', e => {
  currentSearch = e.target.value;
  renderProducts();
});

sortSelect && sortSelect.addEventListener('change', e => {
  currentSort = e.target.value;
  renderProducts();
});

// Читаем параметр ?cat= из URL
const urlParams = new URLSearchParams(window.location.search);
const catParam = urlParams.get('cat');
if (catParam) {
  currentCat = catParam;
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.cat === catParam);
  });
}

// Инициализация
document.addEventListener('DOMContentLoaded', async () => {
  // Пробуем загрузить товары из Firebase
  try {
    const { loadProductsFromFirebase } = await import('./firebase.js');
    const firebaseProducts = await loadProductsFromFirebase();
    if (firebaseProducts && firebaseProducts.length > 0) {
      // Заменяем локальные товары на Firebase
      window.PRODUCTS = firebaseProducts.map((p, i) => ({
        id: p.firebaseId || String(i + 1),
        name: p.name,
        title: p.title || '',
        category: p.category,
        price: p.price,
        oldPrice: p.oldPrice || null,
        emoji: p.emoji || '📦',
        photoUrl: p.photoUrl || null,
        badge: p.badge || null,
        inStock: p.inStock !== false,
      }));
    }
  } catch (e) {
    console.log('Используем локальные товары');
  }
  renderProducts();
  updateCartCount();
});
