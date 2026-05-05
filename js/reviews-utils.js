// ===== REVIEWS =====

function getReviewsData() {
  return JSON.parse(localStorage.getItem('animuchi_reviews') || '{}');
}

function getProductReviews(productId) {
  return getReviewsData()[String(productId)] || [];
}

function addProductReview(productId, review) {
  const data = getReviewsData();
  const id = String(productId);
  if (!data[id]) data[id] = [];
  data[id].unshift({
    name: review.name,
    rating: review.rating,
    text: review.text || '',
    date: new Date().toLocaleDateString('ru-RU'),
  });
  localStorage.setItem('animuchi_reviews', JSON.stringify(data));
}

function getAverageRating(productId) {
  const reviews = getProductReviews(productId);
  if (!reviews.length) return 0;
  return reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
}

function starsHtml(rating) {
  const full = Math.round(rating);
  let html = '<span class="stars-display">';
  for (let i = 1; i <= 5; i++) {
    html += `<span class="star-icon${i <= full ? ' star-icon--filled' : ''}">★</span>`;
  }
  html += '</span>';
  return html;
}

function pluralRu(n, one, few, many) {
  const m10 = n % 10, m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return few;
  return many;
}
