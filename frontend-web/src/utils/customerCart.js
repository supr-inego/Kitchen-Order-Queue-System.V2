const CART_KEY = 'customer_cart';

export function readCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY) || '{}');
  } catch {
    return {};
  }
}

export function writeCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  window.dispatchEvent(new Event('customer-cart-updated'));
}

export function clearCart() {
  writeCart({});
}

export function addToCart(product) {
  const cart = readCart();
  const existing = cart[product.id];
  cart[product.id] = {
    product_id: product.id,
    name: product.name,
    price: product.price,
    quantity: existing ? existing.quantity + 1 : 1,
  };
  writeCart(cart);
  return cart;
}

export function updateCartQuantity(productId, quantity) {
  const cart = readCart();
  if (quantity < 1) delete cart[productId];
  else cart[productId] = { ...cart[productId], quantity };
  writeCart(cart);
  return cart;
}

export function cartSummary(cart) {
  const items = Object.values(cart);
  const total = items.reduce((sum, item) => sum + parseFloat(item.price) * item.quantity, 0);
  return { items, total };
}
