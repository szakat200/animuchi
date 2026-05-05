// ===== WISHLIST =====
function getWishlist() {
  return JSON.parse(localStorage.getItem('animuchi_wishlist') || '[]');
}
function saveWishlist(list) {
  localStorage.setItem('animuchi_wishlist', JSON.stringify(list));
}
function isInWishlist(id) {
  return getWishlist().some(item => String(item.id) === String(id));
}
function toggleWishlist(product) {
  let list = getWishlist();
  const idx = list.findIndex(item => String(item.id) === String(product.id));
  if (idx >= 0) {
    list.splice(idx, 1);
    saveWishlist(list);
    updateWishlistCount();
    return false;
  } else {
    list.push(product);
    saveWishlist(list);
    updateWishlistCount();
    return true;
  }
}
function updateWishlistCount() {
  const list = getWishlist();
  document.querySelectorAll('#wishlistCount').forEach(el => {
    el.textContent = list.length;
    el.style.display = list.length > 0 ? 'flex' : 'none';
  });
}

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

// ===== HEADER SEARCH =====
function initHeaderSearch() {
  const searchToggle = document.getElementById('searchToggle');
  const headerSearchClose = document.getElementById('headerSearchClose');
  const headerSearchForm = document.getElementById('headerSearchForm');
  const headerSearchInput = document.getElementById('headerSearchInput');
  const header = document.querySelector('.header');
  const mobileSearchForm = document.getElementById('mobileSearchForm');
  const mobileSearchInput = document.getElementById('mobileSearchInput');

  function doSearch(q) {
    if (!q) return;
    const catalogInput = document.getElementById('searchInput');
    if (catalogInput) {
      catalogInput.value = q;
      catalogInput.dispatchEvent(new Event('input'));
      if (header) header.classList.remove('search-open');
      const section = document.querySelector('.catalog-section');
      if (section) section.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.location.href = 'catalog.html?search=' + encodeURIComponent(q);
    }
  }

  if (searchToggle && header) {
    searchToggle.addEventListener('click', () => {
      if (window.innerWidth <= 640) {
        if (mobileNav) mobileNav.classList.add('open');
        setTimeout(() => mobileSearchInput && mobileSearchInput.focus(), 100);
      } else {
        header.classList.add('search-open');
        setTimeout(() => headerSearchInput && headerSearchInput.focus(), 50);
      }
    });
  }

  if (headerSearchClose && header) {
    headerSearchClose.addEventListener('click', () => {
      header.classList.remove('search-open');
      if (headerSearchInput) headerSearchInput.value = '';
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && header && header.classList.contains('search-open')) {
      header.classList.remove('search-open');
      if (headerSearchInput) headerSearchInput.value = '';
    }
  });

  if (headerSearchForm) {
    headerSearchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      doSearch(headerSearchInput ? headerSearchInput.value.trim() : '');
    });
  }

  if (mobileSearchForm) {
    mobileSearchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      doSearch(mobileSearchInput ? mobileSearchInput.value.trim() : '');
      if (mobileNav) mobileNav.classList.remove('open');
    });
  }
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  updateCartCount();
  updateWishlistCount();
  initHeaderSearch();
});
