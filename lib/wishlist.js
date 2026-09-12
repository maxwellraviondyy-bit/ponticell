const KEY = "ponticell_wishlist";

export function getWishlist() {
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; }
}

export function isWishlisted(id) {
  return getWishlist().some(i => i.id === id);
}

export function toggleWishlist(product) {
  const list = getWishlist();
  const exists = list.findIndex(i => i.id === product.id);
  let updated;
  if (exists >= 0) {
    updated = list.filter(i => i.id !== product.id);
  } else {
    updated = [{ ...product }, ...list];
  }
  localStorage.setItem(KEY, JSON.stringify(updated));
  return updated;
}

export function getWishlistCount() {
  return getWishlist().length;
}
