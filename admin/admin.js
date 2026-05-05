// ===== FIREBASE CONFIG =====
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged }
  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, collection, getDocs, addDoc, updateDoc, deleteDoc, doc, orderBy, query }
  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyC_MYXFbn20OCluZF4DU8eU6FhTSdRxAjA",
  authDomain: "animuchi-ad047.firebaseapp.com",
  projectId: "animuchi-ad047",
  storageBucket: "animuchi-ad047.firebasestorage.app",
  messagingSenderId: "662811286779",
  appId: "1:662811286779:web:5475d0bdd1d2ace4caa45e",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ===== TOAST =====
function toast(msg, color = '#c8521a') {
  const t = document.getElementById('adminToast');
  t.textContent = msg;
  t.style.background = color;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2800);
}

// ===== AUTH =====
onAuthStateChanged(auth, user => {
  if (user) {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('adminWrap').style.display = 'grid';
    loadProducts();
  } else {
    document.getElementById('loginScreen').style.display = 'flex';
    document.getElementById('adminWrap').style.display = 'none';
  }
});

document.getElementById('loginBtn').addEventListener('click', async () => {
  const email = document.getElementById('loginEmail').value.trim();
  const pass = document.getElementById('loginPassword').value;
  const errEl = document.getElementById('loginError');
  errEl.textContent = '';
  try {
    await signInWithEmailAndPassword(auth, email, pass);
  } catch (e) {
    errEl.textContent = 'Неверный email или пароль';
  }
});

document.getElementById('loginPassword').addEventListener('keydown', e => {
  if (e.key === 'Enter') document.getElementById('loginBtn').click();
});

document.getElementById('logoutBtn').addEventListener('click', () => signOut(auth));

// ===== TABS =====
document.querySelectorAll('.sidebar__link').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.sidebar__link').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');
    const tab = btn.dataset.tab;
    document.getElementById('tab-' + tab).classList.add('active');
    if (tab === 'orders') loadOrders();
    if (tab === 'requests') loadRequests();
  });
});

// ===== КАТЕГОРИИ =====
const CAT_LABELS = {
  figures: 'Фигурки', posters: 'Постеры', pendants: 'Кулоны',
  accessories: 'Аксессуары', kpop: 'K-Pop',
};

// ===== PRODUCTS =====
async function loadProducts() {
  const tbody = document.getElementById('productsTableBody');
  tbody.innerHTML = '<tr><td colspan="8" class="loading">Загрузка...</td></tr>';
  try {
    const snap = await getDocs(collection(db, 'products'));
    if (snap.empty) {
      tbody.innerHTML = '<tr><td colspan="8" class="loading">Товаров пока нет. Добавь первый!</td></tr>';
      return;
    }
    tbody.innerHTML = '';
    snap.forEach(docSnap => {
      const p = docSnap.data();
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td class="product-emoji-cell">
          ${p.photoUrl ? `<img src="${p.photoUrl}" alt="${p.name}" style="width:48px;height:48px;object-fit:cover;border-radius:8px;">` : (p.emoji || '📦')}
        </td>
        <td><strong>${p.name}</strong></td>
        <td style="color:var(--muted)">${p.title || '—'}</td>
        <td><span class="cat-pill">${CAT_LABELS[p.category] || p.category}</span></td>
        <td><strong style="color:var(--accent)">${Number(p.price).toLocaleString('ru-RU')} ₽</strong></td>
        <td style="color:var(--muted)">${p.oldPrice ? Number(p.oldPrice).toLocaleString('ru-RU') + ' ₽' : '—'}</td>
        <td>${p.badge ? `<span class="badge-pill badge-${p.badge}">${p.badge === 'new' ? 'Новинка' : 'Скидка'}</span>` : '—'}</td>
        <td class="actions-cell">
          <button class="btn-icon" onclick="editProduct('${docSnap.id}')"><i class="fas fa-edit"></i></button>
          <button class="btn-icon danger" onclick="deleteProduct('${docSnap.id}', '${p.name}')"><i class="fas fa-trash"></i></button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  } catch (e) {
    tbody.innerHTML = `<tr><td colspan="8" class="loading">Ошибка загрузки: ${e.message}</td></tr>`;
  }
}

// ===== ADD / EDIT PRODUCT =====
let editingId = null;

document.getElementById('addProductBtn').addEventListener('click', () => openModal());

function openModal(data = null, id = null) {
  editingId = id;
  document.getElementById('modalTitle').textContent = id ? 'Редактировать товар' : 'Добавить товар';
  document.getElementById('pName').value = data?.name || '';
  document.getElementById('pTitle').value = data?.title || '';
  document.getElementById('pCategory').value = data?.category || 'figures';
  document.getElementById('pBadge').value = data?.badge || '';
  document.getElementById('pPrice').value = data?.price || '';
  document.getElementById('pOldPrice').value = data?.oldPrice || '';
  document.getElementById('pEmoji').value = data?.emoji || '';
  document.getElementById('pPhotoUrl').value = data?.photoUrl || '';
  document.getElementById('pDesc').value = data?.description || '';
  document.getElementById('pStock').value = data?.stock ?? '';
  document.getElementById('pInStock').checked = data?.inStock !== false;

  const preview = document.getElementById('photoPreview');
  if (data?.photoUrl) {
    preview.innerHTML = `<img src="${data.photoUrl}" alt="фото" />`;
  } else {
    preview.innerHTML = `<i class="fas fa-image"></i><span>Нажми чтобы выбрать фото</span>`;
  }

  document.getElementById('productModal').classList.add('show');
  document.getElementById('productModalOverlay').classList.add('show');
}

function closeModal() {
  document.getElementById('productModal').classList.remove('show');
  document.getElementById('productModalOverlay').classList.remove('show');
  editingId = null;
}

document.getElementById('closeModal').addEventListener('click', closeModal);
document.getElementById('cancelModal').addEventListener('click', closeModal);
document.getElementById('productModalOverlay').addEventListener('click', closeModal);

// Превью фото по URL
document.getElementById('pPhotoUrl').addEventListener('input', function () {
  const preview = document.getElementById('photoPreview');
  if (this.value) {
    preview.innerHTML = `<img src="${this.value}" alt="фото" />`;
  } else {
    preview.innerHTML = `<i class="fas fa-image"></i><span>Нажми чтобы выбрать фото</span>`;
  }
});

// Клик по зоне загрузки
document.getElementById('photoUploadArea').addEventListener('click', () => {
  document.getElementById('pPhoto').click();
});
document.getElementById('pPhoto').addEventListener('change', function () {
  const file = this.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    document.getElementById('pPhotoUrl').value = e.target.result;
    document.getElementById('photoPreview').innerHTML = `<img src="${e.target.result}" alt="фото" />`;
  };
  reader.readAsDataURL(file);
});

document.getElementById('saveProductBtn').addEventListener('click', async () => {
  const name = document.getElementById('pName').value.trim();
  const price = document.getElementById('pPrice').value;
  if (!name || !price) {
    toast('Заполни название и цену!', '#e74c3c');
    return;
  }

  const data = {
    name,
    title: document.getElementById('pTitle').value.trim(),
    category: document.getElementById('pCategory').value,
    badge: document.getElementById('pBadge').value || null,
    price: Number(price),
    oldPrice: Number(document.getElementById('pOldPrice').value) || null,
    emoji: document.getElementById('pEmoji').value.trim() || '📦',
    photoUrl: document.getElementById('pPhotoUrl').value.trim() || null,
    description: document.getElementById('pDesc').value.trim(),
    stock: document.getElementById('pStock').value !== '' ? Number(document.getElementById('pStock').value) : null,
    inStock: document.getElementById('pInStock').checked,
    updatedAt: new Date().toISOString(),
  };

  try {
    if (editingId) {
      await updateDoc(doc(db, 'products', editingId), data);
      toast('Товар обновлён ✓', '#27ae60');
    } else {
      data.createdAt = new Date().toISOString();
      await addDoc(collection(db, 'products'), data);
      toast('Товар добавлен ✓', '#27ae60');
    }
    closeModal();
    loadProducts();
  } catch (e) {
    toast('Ошибка: ' + e.message, '#e74c3c');
  }
});

// Редактировать
window.editProduct = async (id) => {
  try {
    const snap = await getDocs(collection(db, 'products'));
    snap.forEach(d => { if (d.id === id) openModal(d.data(), id); });
  } catch (e) { toast('Ошибка: ' + e.message, '#e74c3c'); }
};

// Удалить
window.deleteProduct = async (id, name) => {
  if (!confirm(`Удалить товар «${name}»?`)) return;
  try {
    await deleteDoc(doc(db, 'products', id));
    toast('Товар удалён', '#e74c3c');
    loadProducts();
  } catch (e) { toast('Ошибка: ' + e.message, '#e74c3c'); }
};

// ===== ORDERS =====
let currentOrderFilter = 'all';

async function loadOrders() {
  const list = document.getElementById('ordersList');
  list.innerHTML = '<div class="loading">Загрузка...</div>';
  try {
    const snap = await getDocs(query(collection(db, 'orders'), orderBy('date', 'desc')));
    if (snap.empty) {
      list.innerHTML = '<div class="loading">Заказов пока нет</div>';
      return;
    }
    list.innerHTML = '';

    // Фильтр — добавляем только один раз
    if (!document.getElementById('orderStatusFilter')) {
      list.insertAdjacentHTML('beforebegin', `
        <div class="status-filter" id="orderStatusFilter">
          <button class="status-filter-btn active" data-status="all">Все</button>
          <button class="status-filter-btn" data-status="new">🟠 Новые</button>
          <button class="status-filter-btn" data-status="inwork">🔵 В работе</button>
          <button class="status-filter-btn" data-status="done">🟢 Выполнены</button>
          <button class="status-filter-btn" data-status="cancelled">⛔ Отменены</button>
        </div>
      `);
    } else {
      // Сбрасываем активную кнопку на "Все"
      document.querySelectorAll('.status-filter-btn').forEach(b => b.classList.remove('active'));
      document.querySelector('.status-filter-btn[data-status="all"]').classList.add('active');
    }

    const allOrders = [];
    snap.forEach(d => allOrders.push({ docId: d.id, ...d.data() }));

    function renderOrders(filterStatus) {
      list.innerHTML = '';
      const filtered = filterStatus === 'all' ? allOrders : allOrders.filter(o => (o.status || 'new') === filterStatus);
      if (filtered.length === 0) {
        list.innerHTML = '<div class="loading">Нет заказов с таким статусом</div>';
        return;
      }
      const deliveryMap = { pickup: 'Самовывоз', city: 'По Лесному', post: 'Почта России', cdek: 'СДЭК' };
      const paymentMap = { cash: 'Наличные', transfer: 'СБП' };
      const statusMap = {
        new:       { label: 'Новый',    cls: 'status-new' },
        inwork:    { label: 'В работе', cls: 'status-inwork' },
        done:      { label: 'Выполнен', cls: 'status-done' },
        cancelled: { label: 'Отменён',  cls: 'status-cancelled' },
      };

      filtered.forEach(o => {
        const status = o.status || 'new';
        const st = statusMap[status] || statusMap.new;
        const div = document.createElement('div');
        div.className = 'order-card';
        div.dataset.docid = o.docId;
        div.innerHTML = `
          <div class="order-card__header">
            <span class="order-card__id">${o.id || o.docId}</span>
            <span class="order-card__date">${o.date || '—'}</span>
            <div class="order-status-wrap">
              <span class="status-badge ${st.cls}">${st.label}</span>
              <div class="status-actions">
                <button class="status-btn" data-docid="${o.docId}" data-status="new" title="Новый">🟠</button>
                <button class="status-btn" data-docid="${o.docId}" data-status="inwork" title="В работе">🔵</button>
                <button class="status-btn" data-docid="${o.docId}" data-status="done" title="Выполнен">🟢</button>
                <button class="status-btn" data-docid="${o.docId}" data-status="cancelled" title="Отменён">⛔</button>
                <button class="status-btn delete-order-btn" data-docid="${o.docId}" data-orderid="${o.id || o.docId}" title="Удалить заказ">🗑️</button>
              </div>
            </div>
          </div>
          <div class="order-card__body">
            <div class="order-card__field"><label>Клиент</label><p>${o.firstName} ${o.lastName}</p></div>
            <div class="order-card__field"><label>Телефон</label><p>${o.phone}</p></div>
            <div class="order-card__field"><label>Доставка</label><p>${deliveryMap[o.delivery] || o.delivery}</p></div>
            <div class="order-card__field"><label>Адрес</label><p>${o.address || 'Самовывоз'}</p></div>
            <div class="order-card__field"><label>Оплата</label><p>${paymentMap[o.payment] || o.payment}</p></div>
            <div class="order-card__field"><label>Сумма</label><p><strong style="color:var(--accent)">${Number(o.total).toLocaleString('ru-RU')} ₽</strong></p></div>
          </div>
          ${o.comment ? `<div style="margin-top:10px;padding:10px;background:var(--bg2);border-radius:8px;font-size:0.88rem;color:var(--muted)"><strong>Комментарий:</strong> ${o.comment}</div>` : ''}
          <div class="order-card__items">
            <div class="order-card__items-title">Товары:</div>
            ${(o.items || []).map(i => `<div class="order-card__item">${i.emoji || '📦'} ${i.name} × ${i.qty} — ${(i.price * i.qty).toLocaleString('ru-RU')} ₽</div>`).join('')}
          </div>
        `;
        list.appendChild(div);
      });

      // Кнопки смены статуса
      list.querySelectorAll('.status-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
          const docId = btn.dataset.docid;
          const newStatus = btn.dataset.status;
          try {
            await updateDoc(doc(db, 'orders', docId), { status: newStatus });
            // Обновляем локально
            const order = allOrders.find(o => o.docId === docId);
            if (order) order.status = newStatus;
            renderOrders(currentFilter);
            toast('Статус обновлён ✓', '#27ae60');
          } catch (e) {
            toast('Ошибка: ' + e.message, '#e74c3c');
          }
        });
      });

      // Кнопки удаления
      list.querySelectorAll('.delete-order-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
          const docId = btn.dataset.docid;
          const orderId = btn.dataset.orderid;
          if (!confirm(`Удалить заказ ${orderId}?\n\nЭто действие нельзя отменить!`)) return;
          try {
            await deleteDoc(doc(db, 'orders', docId));
            // Удаляем локально
            const idx = allOrders.findIndex(o => o.docId === docId);
            if (idx !== -1) allOrders.splice(idx, 1);
            renderOrders(currentFilter);
            toast('Заказ удалён', '#e74c3c');
          } catch (e) {
            toast('Ошибка: ' + e.message, '#e74c3c');
          }
        });
      });
    }

    let currentFilter = currentOrderFilter;
    renderOrders(currentFilter);

    // Фильтр — вешаем обработчики только один раз
    if (!document.getElementById('orderStatusFilter').dataset.bound) {
      document.getElementById('orderStatusFilter').dataset.bound = '1';
      document.querySelectorAll('.status-filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          document.querySelectorAll('.status-filter-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          currentFilter = btn.dataset.status;
          currentOrderFilter = btn.dataset.status;
          renderOrders(currentFilter);
        });
      });
    }

  } catch (e) {
    list.innerHTML = `<div class="loading">Ошибка: ${e.message}</div>`;
  }
}

// ===== REQUESTS =====
async function loadRequests() {
  const list = document.getElementById('requestsList');
  list.innerHTML = '<div class="loading">Загрузка...</div>';
  try {
    const snap = await getDocs(query(collection(db, 'requests'), orderBy('date', 'desc')));
    if (snap.empty) {
      list.innerHTML = '<div class="loading">Заявок пока нет</div>';
      return;
    }
    list.innerHTML = '';
    const allRequests = [];
    snap.forEach(d => allRequests.push({ docId: d.id, ...d.data() }));

    const typeMap = { figure: 'Фигурка', poster: 'Постер', pendant: 'Кулон', accessory: 'Аксессуар', cosplay: 'Косплей', kpop: 'K-Pop', other: 'Другое' };
    const contactMap = { phone: 'Звонок', vk: 'ВКонтакте', whatsapp: 'WhatsApp', telegram: 'Telegram' };
    snap.forEach(d => {
      const r = d.data();
      const div = document.createElement('div');
      div.className = 'order-card';
      div.innerHTML = `
        <div class="order-card__header">
          <span class="order-card__id">${r.id || d.id}</span>
          <span class="order-card__date">${r.date || '—'}</span>
          <div class="order-status-wrap">
            <span class="status-badge status-new">Новая</span>
            <div class="status-actions">
              <button class="status-btn delete-request-btn" data-docid="${d.id}" data-reqid="${r.id || d.id}" title="Удалить заявку">🗑️</button>
            </div>
          </div>
        </div>
        <div class="order-card__body">
          <div class="order-card__field"><label>Имя</label><p>${r.name}</p></div>
          <div class="order-card__field"><label>Телефон</label><p>${r.phone}</p></div>
          <div class="order-card__field"><label>Связь</label><p>${contactMap[r.contactWay] || r.contactWay}</p></div>
          <div class="order-card__field"><label>Аниме / тайтл</label><p>${r.anime}</p></div>
          <div class="order-card__field"><label>Персонаж</label><p>${r.character || '—'}</p></div>
          <div class="order-card__field"><label>Тип товара</label><p>${typeMap[r.type] || r.type}</p></div>
          <div class="order-card__field"><label>Бюджет</label><p>${r.budget || 'Не указан'}</p></div>
          <div class="order-card__field"><label>Доставка</label><p>${r.delivery === 'pickup' ? 'Самовывоз' : 'По России'}</p></div>
        </div>
        <div style="margin-top:12px;padding:12px;background:var(--bg2);border-radius:8px;font-size:0.88rem;">
          <strong>Описание:</strong> ${r.description}
        </div>
      `;
      list.appendChild(div);
    });

    // Удаление заявок
    list.querySelectorAll('.delete-request-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const docId = btn.dataset.docid;
        const reqId = btn.dataset.reqid;
        if (!confirm(`Удалить заявку ${reqId}?\n\nЭто действие нельзя отменить!`)) return;
        try {
          await deleteDoc(doc(db, 'requests', docId));
          btn.closest('.order-card').remove();
          toast('Заявка удалена', '#e74c3c');
          if (list.children.length === 0) {
            list.innerHTML = '<div class="loading">Заявок пока нет</div>';
          }
        } catch (e) {
          toast('Ошибка: ' + e.message, '#e74c3c');
        }
      });
    });
  } catch (e) {
    list.innerHTML = `<div class="loading">Ошибка: ${e.message}</div>`;
  }
}
