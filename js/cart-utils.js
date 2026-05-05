export function getCart() {
  return JSON.parse(localStorage.getItem('animuchi_cart') || '[]');
}

export function saveCart(cart) {
  localStorage.setItem('animuchi_cart', JSON.stringify(cart));
}

export function updateCartCount() {
  const cart = getCart();
  const total = cart.reduce((sum, item) => sum + item.qty, 0);
  document.querySelectorAll('#cartCount').forEach(el => {
    el.textContent = total;
    el.style.display = total > 0 ? 'flex' : 'none';
  });
}
