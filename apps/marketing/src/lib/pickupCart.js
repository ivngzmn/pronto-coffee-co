import { formatOrderItem } from '@pronto/menu';

export const PICKUP_CART_STORAGE_KEY = 'pronto.pickupCart.v1';
export const PICKUP_CART_UPDATED_EVENT = 'pronto:pickup-cart-updated';
export const PICKUP_CART_PROMO_STORAGE_KEY = 'pronto.pickupCartPromo.v1';
export const PICKUP_SAVED_CART_STORAGE_KEY = 'pronto.savedPickupCart.v1';
export const PICKUP_ORDER_HISTORY_STORAGE_KEY = 'pronto.pickupOrderHistory.v1';

export const PICKUP_TAX_RATE = 0.0775;

const promoCodes = {
  PRONTO10: { code: 'PRONTO10', label: '10% off', type: 'percent', value: 0.1 },
  PICKUP5: { code: 'PICKUP5', label: '$5 off', type: 'fixed', value: 5 },
};

function isBrowser() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function safeParseCart(value) {
  if (!value) return [];

  try {
    const parsed = JSON.parse(value);
    return normalizeCart(parsed);
  } catch {
    return [];
  }
}

function safeParseObject(value) {
  if (!value) return null;

  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

function safeParseArray(value) {
  if (!value) return [];

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function normalizeQuantity(quantity) {
  const parsed = Number(quantity);
  if (!Number.isFinite(parsed)) return 1;
  return Math.max(1, Math.min(99, Math.round(parsed)));
}

function normalizeSelections(selections = {}) {
  return {
    size: typeof selections.size === 'string' ? selections.size : '',
    temperature:
      typeof selections.temperature === 'string' ? selections.temperature : '',
    milk: typeof selections.milk === 'string' ? selections.milk : '',
  };
}

function normalizeCartLine(line) {
  if (!line || typeof line !== 'object') return null;

  const itemId = typeof line.itemId === 'string' ? line.itemId : line.id;
  const name = typeof line.name === 'string' ? line.name : '';

  if (!itemId || !name) return null;

  return {
    uid:
      typeof line.uid === 'string' && line.uid
        ? line.uid
        : `${itemId}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    itemId,
    name,
    image: typeof line.image === 'string' ? line.image : '',
    description:
      typeof line.description === 'string' ? line.description : '',
    price: typeof line.price === 'string' ? line.price : '',
    category: typeof line.category === 'string' ? line.category : '',
    quantity: normalizeQuantity(line.quantity),
    selections: normalizeSelections(line.selections),
    formatted: typeof line.formatted === 'string' ? line.formatted : name,
  };
}

function normalizeCart(cart) {
  if (!Array.isArray(cart)) return [];
  return cart.map(normalizeCartLine).filter(Boolean);
}

function selectionsKey(selections) {
  const normalized = normalizeSelections(selections);
  return JSON.stringify([
    normalized.size,
    normalized.temperature,
    normalized.milk,
  ]);
}

function sameCartLine(line, itemId, selections) {
  return line.itemId === itemId && selectionsKey(line.selections) === selectionsKey(selections);
}

function dispatchCartUpdated(cart) {
  if (!isBrowser()) return;
  window.dispatchEvent(
    new CustomEvent(PICKUP_CART_UPDATED_EVENT, { detail: { cart } }),
  );
}

export function getPickupCart() {
  if (!isBrowser()) return [];
  return safeParseCart(window.localStorage.getItem(PICKUP_CART_STORAGE_KEY));
}

export function setPickupCart(cart) {
  const normalized = normalizeCart(cart);

  if (isBrowser()) {
    window.localStorage.setItem(
      PICKUP_CART_STORAGE_KEY,
      JSON.stringify(normalized),
    );
    dispatchCartUpdated(normalized);
  }

  return normalized;
}

export function addPickupCartItem(item, selections = {}, quantity = 1) {
  const itemId = item.id || item.itemId;
  const normalizedSelections = normalizeSelections(selections);
  const formatted = formatOrderItem(
    {
      ...item,
      name: item.name,
    },
    normalizedSelections,
  );
  const nextQuantity = normalizeQuantity(quantity);
  const current = getPickupCart();
  const existing = current.find((line) =>
    sameCartLine(line, itemId, normalizedSelections),
  );

  if (existing) {
    return setPickupCart(
      current.map((line) =>
        line.uid === existing.uid
          ? {
              ...line,
              quantity: normalizeQuantity(line.quantity + nextQuantity),
            }
          : line,
      ),
    );
  }

  return setPickupCart([
    ...current,
    {
      uid: `${itemId}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      itemId,
      name: item.name,
      image: item.image || '',
      description: item.description || '',
      price: item.basePrice || item.price || '',
      category: item.category || '',
      quantity: nextQuantity,
      selections: normalizedSelections,
      formatted,
    },
  ]);
}

export function updatePickupCartQuantity(uid, quantity) {
  const nextQuantity = normalizeQuantity(quantity);
  return setPickupCart(
    getPickupCart().map((line) =>
      line.uid === uid ? { ...line, quantity: nextQuantity } : line,
    ),
  );
}

export function removePickupCartItem(uid) {
  return setPickupCart(getPickupCart().filter((line) => line.uid !== uid));
}

export function clearPickupCart() {
  return setPickupCart([]);
}

export function getPickupCartItemCount(cart = getPickupCart()) {
  return normalizeCart(cart).reduce((total, line) => total + line.quantity, 0);
}

export function getPickupCartSubtotal(cart = getPickupCart()) {
  return normalizeCart(cart).reduce((total, line) => {
    const amount = Number(String(line.price).replace(/[^0-9.]/g, ''));
    return Number.isFinite(amount) ? total + amount * line.quantity : total;
  }, 0);
}

export function getPickupPromo() {
  if (!isBrowser()) return null;

  const stored = safeParseObject(
    window.localStorage.getItem(PICKUP_CART_PROMO_STORAGE_KEY),
  );

  return stored?.code && promoCodes[stored.code] ? promoCodes[stored.code] : null;
}

export function setPickupPromo(code) {
  if (!isBrowser()) return null;

  const normalizedCode = String(code || '').trim().toUpperCase();
  const promo = promoCodes[normalizedCode] || null;

  if (promo) {
    window.localStorage.setItem(
      PICKUP_CART_PROMO_STORAGE_KEY,
      JSON.stringify({ code: promo.code }),
    );
  } else {
    window.localStorage.removeItem(PICKUP_CART_PROMO_STORAGE_KEY);
  }

  dispatchCartUpdated(getPickupCart());
  return promo;
}

export function clearPickupPromo() {
  if (isBrowser()) {
    window.localStorage.removeItem(PICKUP_CART_PROMO_STORAGE_KEY);
    dispatchCartUpdated(getPickupCart());
  }

  return null;
}

export function getPickupCartTotals(cart = getPickupCart(), promo = getPickupPromo()) {
  const subtotal = getPickupCartSubtotal(cart);
  const discount =
    promo?.type === 'percent'
      ? subtotal * promo.value
      : promo?.type === 'fixed'
        ? Math.min(subtotal, promo.value)
        : 0;
  const taxableAmount = Math.max(0, subtotal - discount);
  const tax = taxableAmount * PICKUP_TAX_RATE;
  const total = taxableAmount + tax;

  return {
    subtotal,
    discount,
    tax,
    total,
  };
}

export function savePickupCartSnapshot(cart = getPickupCart()) {
  const normalized = normalizeCart(cart);

  if (isBrowser()) {
    window.localStorage.setItem(
      PICKUP_SAVED_CART_STORAGE_KEY,
      JSON.stringify({
        savedAt: new Date().toISOString(),
        cart: normalized,
      }),
    );
  }

  return normalized;
}

export function getSavedPickupCartSnapshot() {
  if (!isBrowser()) return null;

  const saved = safeParseObject(
    window.localStorage.getItem(PICKUP_SAVED_CART_STORAGE_KEY),
  );

  if (!saved) return null;

  return {
    savedAt: typeof saved.savedAt === 'string' ? saved.savedAt : '',
    cart: normalizeCart(saved.cart),
  };
}

export function restoreSavedPickupCart() {
  const saved = getSavedPickupCartSnapshot();
  if (!saved?.cart.length) return getPickupCart();
  return setPickupCart(saved.cart);
}

export function saveRecentPickupOrder(cart, order = {}) {
  if (!isBrowser()) return [];

  const history = safeParseArray(
    window.localStorage.getItem(PICKUP_ORDER_HISTORY_STORAGE_KEY),
  );
  const entry = {
    id: order.id || `${Date.now()}`,
    orderedAt: new Date().toISOString(),
    items: normalizeCart(cart),
    total: getPickupCartTotals(cart).total,
  };
  const nextHistory = [entry, ...history].slice(0, 5);

  window.localStorage.setItem(
    PICKUP_ORDER_HISTORY_STORAGE_KEY,
    JSON.stringify(nextHistory),
  );

  return nextHistory;
}

export function getRecentPickupOrders() {
  if (!isBrowser()) return [];

  return safeParseArray(
    window.localStorage.getItem(PICKUP_ORDER_HISTORY_STORAGE_KEY),
  ).map((entry) => ({
    id: typeof entry.id === 'string' ? entry.id : `${Date.now()}`,
    orderedAt: typeof entry.orderedAt === 'string' ? entry.orderedAt : '',
    total: Number.isFinite(Number(entry.total)) ? Number(entry.total) : 0,
    items: normalizeCart(entry.items),
  }));
}

export function formatCartLineForOrder(line) {
  return line.quantity > 1 ? `${line.quantity}x ${line.formatted}` : line.formatted;
}
