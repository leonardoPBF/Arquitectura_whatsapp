import type { CartItem } from '../context/CartContext';

// Consume once, only after the server reports the order as paid.
export function takePurchasedCart(userId: string, orderId: string): CartItem[] {
  const key = `purchase:${userId}:${orderId}`;
  const saved = localStorage.getItem(key);
  if (!saved) return [];
  localStorage.removeItem(key);
  try {
    const purchase = JSON.parse(saved);
    if (typeof purchase.storageKey === 'string') sessionStorage.removeItem(purchase.storageKey);
    return Array.isArray(purchase.items) ? purchase.items.filter((item: CartItem) =>
      item && typeof item._id === 'string' && Number.isSafeInteger(item.quantity) && item.quantity > 0) : [];
  } catch { return []; }
}
