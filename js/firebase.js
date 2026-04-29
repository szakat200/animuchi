// ===== FIREBASE для основного сайта =====
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc, query, orderBy }
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
const db = getFirestore(app);

// Загрузить товары из Firebase
export async function loadProductsFromFirebase() {
  try {
    const snap = await getDocs(query(collection(db, 'products'), orderBy('createdAt', 'desc')));
    if (snap.empty) return null; // нет товаров в Firebase — используем локальные
    const products = [];
    snap.forEach(d => products.push({ ...d.data(), firebaseId: d.id }));
    return products;
  } catch (e) {
    console.warn('Firebase недоступен, используем локальные товары:', e.message);
    return null;
  }
}

// Сохранить заказ в Firebase
export async function saveOrderToFirebase(orderData) {
  try {
    await addDoc(collection(db, 'orders'), orderData);
    return true;
  } catch (e) {
    console.warn('Не удалось сохранить заказ в Firebase:', e.message);
    return false;
  }
}

// Сохранить заявку в Firebase
export async function saveRequestToFirebase(requestData) {
  try {
    await addDoc(collection(db, 'requests'), requestData);
    return true;
  } catch (e) {
    console.warn('Не удалось сохранить заявку в Firebase:', e.message);
    return false;
  }
}
