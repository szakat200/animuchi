// ===== CART =====
function getCart() {
  return JSON.parse(localStorage.getItem('animuchi_cart') || '[]');
}
function saveCart(cart) {
  localStorage.setItem('animuchi_cart', JSON.stringify(cart));
}
function updateCartCount() {
  const cart = getCart();
  const total = cart.reduce((sum, item) => sum + item.qty, 0);
  document.querySelectorAll('#cartCount').forEach(el => {
    el.textContent = total;
    el.style.display = total > 0 ? 'flex' : 'none';
  });
}

// ===== BURGER MENU =====
const burger = document.getElementById('burger');
const mobileNav = document.getElementById('mobileNav');
if (burger && mobileNav) {
  burger.addEventListener('click', () => {
    mobileNav.classList.toggle('open');
  });
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  updateCartCount();
});
