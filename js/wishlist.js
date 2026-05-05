// ===== WISHLIST PAGE =====

const CAT_LABELS = {
  figures: 'Фигурки', posters: 'Постеры', pendants: 'Кулоны',
  accessories: 'Аксессуары', kpop: 'K-Pop',
};

function renderWishlist() {
  const list = getWishlist();
  const grid = document.getElementById('wishlistGrid');
  const empty = document.getElementById('wishlistEmpty');
  const desc = document.getElementById('wishlistDesc');

  if (list.length === 0) {
    grid.style.display = 'none';
    empty.style.display = 'block';
    desc.textContent = 'Товары, которые ты отложил';
    return;
  }

  empty.style.display = 'none';
  grid.style.display = 'grid';
  desc.textContent = `${list.length} ${plural(list.length, 'товар', 'товара', 'товаров')} в избранном`;

  grid.innerHTML = '';
  list.forEach(p => {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.innerHTML = `
      <button class="wishlist-card-btn active" data-id="${p.id}" aria-label="Убрать из избранного">
        <i class="fas fa-heart"></i>
      </button>
      <a href="product.html?id=${p.id}" class="product-card__link">
        <div class="product-card__img">
          ${p.photoUrl
            ? `<img src="${p.photoUrl}" alt="${p.name}" loading="lazy" style="width:100%;height:100%;object-fit:cover;">`
            : `<span>${p.emoji || '📦'}</span>`}
        </div>
        <div class="product-card__body">
          <div class="product-card__cat">${CAT_LABELS[p.category] || p.category || ''}</div>
          <div class="product-card__name">${p.name}</div>
        </div>
      </a>
      <div class="product-card__footer">
        <span class="product-card__price">${p.price.toLocaleString('ru-RU')} ₽</span>
        <button class="add-to-cart-btn" data-id="${p.id}" data-name="${p.name}" data-price="${p.price}" data-emoji="${p.emoji || '📦'}" data-photo="${p.photoUrl || ''}">
          <i class="fas fa-cart-plus"></i> В корзину
        </button>
      </div>
    `;
    grid.appendChild(card);
  });

  // Убрать из избранного
  grid.querySelectorAll('.wishlist-card-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      const item = getWishlist().find(i => String(i.id) === String(id));
      toggleWishlist(item || { id });
      renderWishlist();
      showToast('Убрано из избранного');
    });
  });

  // В корзину
  grid.querySelectorAll('.add-to-cart-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      const name = btn.dataset.name;
      const price = Number(btn.dataset.price);
      const emoji = btn.dataset.emoji;
      const photoUrl = btn.dataset.photo;

      const cart = getCart();
      const existing = cart.find(i => String(i.id) === String(id));
      if (existing) {
        existing.qty += 1;
      } else {
        cart.push({ id: String(id), name, price, emoji, photoUrl: photoUrl || null, qty: 1 });
      }
      saveCart(cart);
      updateCartCount();

      btn.classList.add('added');
      btn.innerHTML = '<i class="fas fa-check"></i> Добавлено';
      setTimeout(() => {
        btn.classList.remove('added');
        btn.innerHTML = '<i class="fas fa-cart-plus"></i> В корзину';
      }, 1500);
      showToast(`«${name}» добавлен в корзину 🛒`);
    });
  });
}

function plural(n, one, few, many) {
  const mod10 = n % 10, mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few;
  return many;
}

function showToast(msg) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2500);
}

document.addEventListener('DOMContentLoaded', () => {
  renderWishlist();
});
