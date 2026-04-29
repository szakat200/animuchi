// ===== СТРАНИЦА "ПОД ЗАКАЗ" =====

// Функции корзины (модуль не видит main.js)
function updateCartCount() {
  const cart = JSON.parse(localStorage.getItem('animuchi_cart') || '[]');
  const total = cart.reduce((s, i) => s + i.qty, 0);
  document.querySelectorAll('#cartCount').forEach(el => { el.textContent = total; });
}

const orderForm = document.getElementById('orderForm');

// Маска телефона
const oPhone = document.getElementById('oPhone');
if (oPhone) {
  oPhone.addEventListener('keydown', function (e) {
    if (['Backspace','Delete','ArrowLeft','ArrowRight','Tab','Home','End'].includes(e.key)) return;
    if (!/[\d+]/.test(e.key)) e.preventDefault();
  });
  oPhone.addEventListener('input', function () {
    let digits = this.value.replace(/\D/g, '');
    if (digits.startsWith('8')) digits = '7' + digits.slice(1);
    if (digits.startsWith('7')) digits = digits.slice(1);
    digits = digits.slice(0, 10);

    let formatted = '';
    if (digits.length > 0) formatted = '+7 (' + digits.slice(0, 3);
    if (digits.length >= 4) formatted += ') ' + digits.slice(3, 6);
    if (digits.length >= 7) formatted += '-' + digits.slice(6, 8);
    if (digits.length >= 9) formatted += '-' + digits.slice(8, 10);

    this.value = formatted;
  });
}

// Валидация
function validateOrderForm() {
  let ok = true;

  const firstName = document.getElementById('oFirstName');
  const phone = document.getElementById('oPhone');
  const anime = document.getElementById('oAnime');
  const type = document.getElementById('oType');
  const desc = document.getElementById('oDesc');

  // Сброс ошибок
  [
    ['oFirstNameError', firstName],
    ['oPhoneError', phone],
    ['oAnimeError', anime],
    ['oTypeError', type],
    ['oDescError', desc],
  ].forEach(([errId, el]) => {
    document.getElementById(errId).textContent = '';
    el && el.classList.remove('error');
  });

  if (!firstName.value.trim()) {
    document.getElementById('oFirstNameError').textContent = 'Введите имя';
    firstName.classList.add('error');
    ok = false;
  }

  const phoneDigits = phone.value.replace(/\D/g, '');
  if (phoneDigits.length < 10) {
    document.getElementById('oPhoneError').textContent = 'Введите корректный номер';
    phone.classList.add('error');
    ok = false;
  }

  if (!anime.value.trim()) {
    document.getElementById('oAnimeError').textContent = 'Укажи аниме или тайтл';
    anime.classList.add('error');
    ok = false;
  }

  if (!type.value) {
    document.getElementById('oTypeError').textContent = 'Выбери тип товара';
    type.classList.add('error');
    ok = false;
  }

  if (!desc.value.trim() || desc.value.trim().length < 10) {
    document.getElementById('oDescError').textContent = 'Опиши подробнее (минимум 10 символов)';
    desc.classList.add('error');
    ok = false;
  }

  return ok;
}

// Отправка формы
if (orderForm) {
  orderForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    if (!validateOrderForm()) return;

    const requestData = {
      id: 'REQ-' + Date.now().toString().slice(-6),
      name: document.getElementById('oFirstName').value.trim(),
      phone: document.getElementById('oPhone').value.trim(),
      contactWay: document.querySelector('input[name="contactWay"]:checked').value,
      anime: document.getElementById('oAnime').value.trim(),
      character: document.getElementById('oCharacter').value.trim(),
      type: document.getElementById('oType').value,
      budget: document.getElementById('oBudget').value,
      description: document.getElementById('oDesc').value.trim(),
      delivery: document.querySelector('input[name="oDelivery"]:checked').value,
      date: new Date().toLocaleString('ru-RU'),
    };

    // Сохраняем в Firebase
    try {
      const { saveRequestToFirebase } = await import('./firebase.js');
      await saveRequestToFirebase(requestData);
    } catch (err) {
      console.warn('Firebase недоступен:', err);
    }

    // Резервно в localStorage
    const requests = JSON.parse(localStorage.getItem('animuchi_requests') || '[]');
    requests.push(requestData);
    localStorage.setItem('animuchi_requests', JSON.stringify(requests));

    // Показываем модалку
    document.getElementById('orderNum').textContent = requestData.id;
    document.getElementById('successModal').classList.add('show');
    document.getElementById('modalOverlay').classList.add('show');

    // Сбрасываем форму
    orderForm.reset();
  });
}

document.addEventListener('DOMContentLoaded', () => {
  updateCartCount();
});
