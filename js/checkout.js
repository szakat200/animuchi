// ===== CHECKOUT =====

// Вспомогательные функции (дублируем из main.js для работы как модуль)
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
  });
}

let currentStep = 1;

// Элементы шагов
const stepBlocks = {
  1: document.getElementById('stepBlock1'),
  2: document.getElementById('stepBlock2'),
  3: document.getElementById('stepBlock3'),
};
const stepIndicators = {
  1: document.getElementById('step1indicator'),
  2: document.getElementById('step2indicator'),
  3: document.getElementById('step3indicator'),
};

function goToStep(n) {
  // Скрываем все блоки
  Object.values(stepBlocks).forEach(b => b && b.classList.add('hidden'));
  // Показываем нужный
  if (stepBlocks[n]) stepBlocks[n].classList.remove('hidden');

  // Обновляем индикаторы
  for (let i = 1; i <= 3; i++) {
    const ind = stepIndicators[i];
    if (!ind) continue;
    ind.classList.remove('active', 'done');
    if (i < n) ind.classList.add('done');
    if (i === n) ind.classList.add('active');
  }

  currentStep = n;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function goToStepForward(n) {
  // Переход вперёд с валидацией
  if (n === 2 && !validateStep1()) return;
  if (n === 3 && !validateStep2()) return;
  goToStep(n);
}

// ===== ВАЛИДАЦИЯ =====
function validateStep1() {
  let ok = true;

  const firstName = document.getElementById('firstName');
  const lastName = document.getElementById('lastName');
  const phone = document.getElementById('phone');

  clearError('firstNameError', firstName);
  clearError('lastNameError', lastName);
  clearError('phoneError', phone);

  if (!firstName.value.trim()) {
    showError('firstNameError', firstName, 'Введите имя');
    ok = false;
  }
  if (!lastName.value.trim()) {
    showError('lastNameError', lastName, 'Введите фамилию');
    ok = false;
  }
  const phoneVal = phone.value.replace(/\D/g, '');
  if (phoneVal.length < 10) {
    showError('phoneError', phone, 'Введите корректный номер телефона');
    ok = false;
  }
  return ok;
}

function validateStep2() {
  const delivery = document.querySelector('input[name="delivery"]:checked').value;
  if (delivery !== 'pickup') {
    const address = document.getElementById('address');
    clearError('addressError', address);
    if (!address.value.trim()) {
      showError('addressError', address, 'Введите адрес доставки');
      return false;
    }
  }
  return true;
}

function showError(errId, input, msg) {
  document.getElementById(errId).textContent = msg;
  input.classList.add('error');
}
function clearError(errId, input) {
  document.getElementById(errId).textContent = '';
  input && input.classList.remove('error');
}

// ===== НАВИГАЦИЯ ПО ШАГАМ =====
document.getElementById('toStep2Btn').addEventListener('click', () => goToStepForward(2));
document.getElementById('toStep1Btn').addEventListener('click', () => goToStep(1));
document.getElementById('toStep3Btn').addEventListener('click', () => goToStepForward(3));
document.getElementById('toStep2Btn2').addEventListener('click', () => goToStep(2));

// ===== АДРЕС: показывать/скрывать при самовывозе =====
const deliveryRadios = document.querySelectorAll('input[name="delivery"]');
const addressBlock = document.getElementById('addressBlock');

function toggleAddressBlock() {
  const val = document.querySelector('input[name="delivery"]:checked').value;
  addressBlock.style.display = val === 'pickup' ? 'none' : 'flex';
}
deliveryRadios.forEach(r => r.addEventListener('change', toggleAddressBlock));
toggleAddressBlock();

// ===== СВОДКА ЗАКАЗА =====
function renderOrderSummary() {
  const cart = getCart();
  const itemsEl = document.getElementById('orderItems');
  const subtotalEl = document.getElementById('orderSubtotal');
  const totalEl = document.getElementById('orderTotal');
  const deliveryEl = document.getElementById('orderDelivery');

  if (!itemsEl) return;

  itemsEl.innerHTML = '';
  let subtotal = 0;

  cart.forEach(item => {
    subtotal += item.price * item.qty;
    const div = document.createElement('div');
    div.className = 'order-summary__item';
    div.innerHTML = `
      <div class="order-summary__item-emoji">
        ${item.photoUrl
          ? `<img src="${item.photoUrl}" alt="${item.name}" style="width:100%;height:100%;object-fit:cover;border-radius:8px;">`
          : (item.emoji || '📦')}
      </div>
      <div class="order-summary__item-info">
        <div class="order-summary__item-name">${item.name}</div>
        <div class="order-summary__item-qty">${item.qty} шт.</div>
      </div>
      <div class="order-summary__item-price">${(item.price * item.qty).toLocaleString('ru-RU')} ₽</div>
    `;
    itemsEl.appendChild(div);
  });

  subtotalEl.textContent = subtotal.toLocaleString('ru-RU') + ' ₽';
  deliveryEl.textContent = 'Бесплатно / уточняется';
  totalEl.textContent = subtotal.toLocaleString('ru-RU') + ' ₽';
}

// ===== ОТПРАВКА ЗАКАЗА =====
document.getElementById('submitOrderBtn').addEventListener('click', async () => {
  const cart = getCart();
  if (cart.length === 0) {
    alert('Корзина пуста!');
    return;
  }

  // Собираем данные
  const orderData = {
    id: 'AN-' + Date.now().toString().slice(-6),
    firstName: document.getElementById('firstName').value.trim(),
    lastName: document.getElementById('lastName').value.trim(),
    phone: document.getElementById('phone').value.trim(),
    email: document.getElementById('email').value.trim(),
    delivery: document.querySelector('input[name="delivery"]:checked').value,
    address: document.getElementById('address').value.trim(),
    payment: document.querySelector('input[name="payment"]:checked').value,
    comment: document.getElementById('comment').value.trim(),
    items: cart,
    total: cart.reduce((s, i) => s + i.price * i.qty, 0),
    date: new Date().toLocaleString('ru-RU'),
  };

  // Сохраняем в Firebase
  try {
    const { saveOrderToFirebase } = await import('./firebase.js');
    await saveOrderToFirebase(orderData);
  } catch (e) {
    console.warn('Не удалось сохранить в Firebase:', e);
  }

  // Сохраняем локально (резерв)
  const orders = JSON.parse(localStorage.getItem('animuchi_orders') || '[]');
  orders.push(orderData);
  localStorage.setItem('animuchi_orders', JSON.stringify(orders));

  // Очищаем корзину
  saveCart([]);
  updateCartCount();

  // Показываем модалку успеха
  document.getElementById('orderNum').textContent = orderData.id;
  document.getElementById('successModal').classList.add('show');
  document.getElementById('modalOverlay').classList.add('show');
});

// ===== ИНИЦИАЛИЗАЦИЯ =====
document.addEventListener('DOMContentLoaded', () => {
  const cart = getCart();
  if (cart.length === 0) {
    window.location.href = 'cart.html';
    return;
  }
  renderOrderSummary();
  updateCartCount();
  goToStep(1);

  // Клик по индикаторам шагов
  Object.entries(stepIndicators).forEach(([num, el]) => {
    if (!el) return;
    el.style.cursor = 'pointer';
    el.addEventListener('click', () => {
      const n = parseInt(num);
      if (n < currentStep) {
        goToStep(n);
      } else if (n === currentStep + 1) {
        goToStepForward(n);
      }
    });
  });
});

// Маска телефона — нормальная, с возможностью удалять посимвольно
const phoneInput = document.getElementById('phone');
if (phoneInput) {
  phoneInput.addEventListener('keydown', function (e) {
    // Разрешаем: backspace, delete, стрелки, tab, home, end
    if (['Backspace','Delete','ArrowLeft','ArrowRight','Tab','Home','End'].includes(e.key)) return;
    // Разрешаем только цифры и +
    if (!/[\d+]/.test(e.key)) e.preventDefault();
  });

  phoneInput.addEventListener('input', function () {
    // Оставляем только цифры
    let digits = this.value.replace(/\D/g, '');
    // Если начинается с 8 — заменяем на 7
    if (digits.startsWith('8')) digits = '7' + digits.slice(1);
    // Если начинается с 7 — форматируем
    if (digits.startsWith('7')) digits = digits.slice(1);
    // Ограничиваем 10 цифрами (без кода страны)
    digits = digits.slice(0, 10);

    let formatted = '';
    if (digits.length > 0) formatted = '+7 (' + digits.slice(0, 3);
    if (digits.length >= 4) formatted += ') ' + digits.slice(3, 6);
    if (digits.length >= 7) formatted += '-' + digits.slice(6, 8);
    if (digits.length >= 9) formatted += '-' + digits.slice(8, 10);

    this.value = formatted;
  });
}
