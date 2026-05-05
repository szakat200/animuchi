// ===== SCROLL REVEAL =====
function initScrollReveal() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  // Секции и заголовки
  document.querySelectorAll('.section__title').forEach(el => {
    el.classList.add('reveal');
    observer.observe(el);
  });

  // Карточки категорий со stagger
  document.querySelectorAll('.cat-card').forEach((el, i) => {
    el.classList.add('reveal', `reveal-d${Math.min(i + 1, 6)}`);
    observer.observe(el);
  });

  // Feature карточки со stagger
  document.querySelectorAll('.feature-card').forEach((el, i) => {
    el.classList.add('reveal', `reveal-d${Math.min(i + 1, 6)}`);
    observer.observe(el);
  });

  // About блок
  document.querySelectorAll('.about__text, .about__image').forEach((el, i) => {
    el.classList.add('reveal', i === 1 ? 'reveal-d2' : '');
    observer.observe(el);
  });
}

// ===== RIPPLE EFFECT ON BUTTONS =====
function initRipple() {
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.btn');
    if (!btn) return;

    const rect = btn.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;

    const ripple = document.createElement('span');
    ripple.className = 'ripple';
    ripple.style.cssText = `width:${size}px;height:${size}px;left:${x}px;top:${y}px;`;
    btn.appendChild(ripple);
    ripple.addEventListener('animationend', () => ripple.remove());
  });
}

// ===== CATALOG CARD STAGGER ENTER =====
// Вызывается из catalog.js после рендера
function animateCatalogCards() {
  document.querySelectorAll('.product-card').forEach((card, i) => {
    card.classList.add('entering');
    card.style.animationDelay = `${i * 0.06}s`;
    card.addEventListener('animationend', () => {
      card.classList.remove('entering');
      card.style.animationDelay = '';
    }, { once: true });
  });
}

// ===== BADGE POP при изменении счётчика =====
function popBadge(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.remove('pop');
  void el.offsetWidth; // reflow
  el.classList.add('pop');
  el.addEventListener('animationend', () => el.classList.remove('pop'), { once: true });
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  initScrollReveal();
  initRipple();
});
