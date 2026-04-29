// ===== CART PAGE =====

// Защита: если main.js не загрузился раньше
if (typeof getCart === 'undefined') {
  window.getCart = () => JSON.parse(localStorage.getItem('animuchi_cart') || '[]');
  window.saveCart = (cart) => localStorage.setItem('animuchi_cart', JSON.stringify(cart));
  window.updateCartCount = () => {
    const cart = getCart();
    const total = cart.reduce((s, i) => s + i.qty, 0);
    document.querySelectorAll('#cartCount').forEach(el => { el.textContent = total; });
  };
}

function renderCart() {
  const cart = getCart();
  const cartEmpty = document.getElementById('cartEmpty');
  const cartLayout = document.getElementById('cartLayout');
  const cartItemsEl = document.getElementById('cartItems');
  const summaryRows = document.getElementById('summaryRows');
  const totalPriceEl = document.getElementById('totalPrice');

  if (!cartItemsEl) return;

  if (cart.length === 0) {
    cartEmpty.style.display = 'block';
    cartLayout.style.display = 'none';
    updateCartCount();
    return;
  }

  cartEmpty.style.display = 'none';
  cartLayout.style.display = 'grid';

  // Рендер товаров
  cartItemsEl.innerHTML = '';
  cart.forEach(item => {
    const row = document.createElement('div');
    row.className = 'cart-item';
    row.dataset.id = item.id;
    row.innerHTML = `
      <div class="cart-item__img">
        ${item.photoUrl
          ? `<img src="${item.photoUrl}" alt="${item.name}" style="width:100%;height:100%;object-fit:cover;border-radius:var(--radius);">`
          : (item.emoji || '📦')}
      </div>
      <div class="cart-item__body">
        <div class="cart-item__name">${item.name}</div>
        <div class="cart-item__price">${(item.price * item.qty).toLocaleString('ru-RU')} ₽</div>
        <div class="cart-item__controls">
          <div class="qty-control">
            <button class="qty-minus" data-id="${item.id}" ${item.qty <= 1 ? 'disabled' : ''}>
              <i class="fas fa-minus"></i>
            </button>
            <span>${item.qty}</span>
            <button class="qty-plus" data-id="${item.id}">
              <i class="fas fa-plus"></i>
            </button>
          </div>
          <button class="cart-item__remove" data-id="${item.id}">
            <i class="fas fa-trash"></i> Удалить
          </button>
        </div>
      </div>
    `;
    cartItemsEl.appendChild(row);
  });

  // Итого
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const itemCount = cart.reduce((sum, item) => sum + item.qty, 0);

  summaryRows.innerHTML = `
    <div class="cart-summary__row">
      <span>Товаров:</span>
      <span>${itemCount} шт.</span>
    </div>
    <div class="cart-summary__row">
      <span>Сумма:</span>
      <span>${subtotal.toLocaleString('ru-RU')} ₽</span>
    </div>
  `;
  totalPriceEl.textContent = subtotal.toLocaleString('ru-RU') + ' ₽';

  updateCartCount();

  // Обработчики кнопок
  cartItemsEl.querySelectorAll('.qty-minus').forEach(btn => {
    btn.addEventListener('click', () => changeQty(parseInt(btn.dataset.id), -1));
  });
  cartItemsEl.querySelectorAll('.qty-plus').forEach(btn => {
    btn.addEventListener('click', () => changeQty(parseInt(btn.dataset.id), 1));
  });
  cartItemsEl.querySelectorAll('.cart-item__remove').forEach(btn => {
    btn.addEventListener('click', () => removeFromCart(parseInt(btn.dataset.id)));
  });
}

function changeQty(id, delta) {
  const cart = getCart();
  const item = cart.find(i => i.id === id);
  if (!item) return;
  item.qty = Math.max(1, item.qty + delta);
  saveCart(cart);
  renderCart();
}

function removeFromCart(id) {
  let cart = getCart();
  const item = cart.find(i => i.id === id);
  cart = cart.filter(i => i.id !== id);
  saveCart(cart);
  renderCart();
  if (item) showToast(`«${item.name}» удалён из корзины`);
}

function showToast(msg) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2500);
}

// Очистить корзину
const clearBtn = document.getElementById('clearCartBtn');
if (clearBtn) {
  clearBtn.addEventListener('click', () => {
    if (confirm('Очистить всю корзину?')) {
      saveCart([]);
      renderCart();
      showToast('Корзина очищена');
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  renderCart();
});
