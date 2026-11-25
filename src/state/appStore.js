import { RESERVATION_MINUTES } from '../utils/constants.js';
import { getStorageItem, removeStorageItem, setStorageItem } from '../utils/storageHelper.js';

const initialState = {
  user: getStorageItem('user', null),
  token: getStorageItem('token', null),
  cart: getStorageItem('cart', []),
  cartDrawerOpen: false,
  reservationExpiresAt: getStorageItem('reservation_expires', null),
  cookieConsent: getStorageItem('cookie_consent', null),
  cookieModalOpen: false,
  addresses: getStorageItem('addresses', [
    {
      id: 'addr-1',
      label: 'Casa',
      recipient: 'Familia Hernández',
      street: 'Av. Universidad 420, Col. Narvarte',
      city: 'Ciudad de México',
      postalCode: '03020',
      phone: '5512345678',
      isDefault: true,
    },
  ]),
  orders: getStorageItem('orders', [
    {
      id: 'LE-2026-0842',
      createdAt: '2026-10-14T15:30:00Z',
      status: 'En camino',
      total: 423.5,
      email: 'familia@ejemplo.mx',
      items: [
        { name: 'Cuaderno Profesional Cuadro Chico 100 Hojas', qty: 3, price: 78.5 },
        { name: 'Set 4 Bolígrafos Gel Punta Fina 0.7 mm', qty: 1, price: 145.0 },
      ],
    },
  ]),
  filters: {
    search: '',
    category: '',
    brand: '',
    level: '',
    minPrice: '',
    maxPrice: '',
    inStockOnly: false,
    sort: 'featured',
    page: 1,
    limit: 8,
  },
  toasts: [],
};

let state = { ...initialState };
const listeners = new Set();

function notify() {
  for (const listener of listeners) {
    listener(state);
  }
}

export const appStore = {
  getState() {
    return state;
  },

  subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  setState(partial) {
    state = { ...state, ...partial };
    notify();
  },

  setAuth(user, token) {
    state = { ...state, user, token };
    if (user && token) {
      setStorageItem('user', user);
      setStorageItem('token', token);
    } else {
      removeStorageItem('user');
      removeStorageItem('token');
    }
    notify();
  },

  setCart(cart) {
    const cleanCart = Array.isArray(cart) ? cart : [];
    let expiresAt = state.reservationExpiresAt;
    if (cleanCart.length === 0) {
      expiresAt = null;
      removeStorageItem('reservation_expires');
    } else if (!expiresAt || expiresAt < Date.now()) {
      expiresAt = Date.now() + RESERVATION_MINUTES * 60 * 1000;
      setStorageItem('reservation_expires', expiresAt);
    }
    state = { ...state, cart: cleanCart, reservationExpiresAt: expiresAt };
    setStorageItem('cart', cleanCart);
    notify();
  },

  addToCart(product, quantity = 1) {
    const qty = Math.max(1, Number(quantity) || 1);
    const existing = state.cart.find((item) => item.id === product.id);
    let nextCart;
    if (existing) {
      nextCart = state.cart.map((item) =>
        item.id === product.id
          ? { ...item, qty: Math.min(product.stock || 99, item.qty + qty) }
          : item
      );
    } else {
      nextCart = [
        ...state.cart,
        {
          id: product.id,
          name: product.name,
          brand: product.brand,
          price: Number(product.price),
          image: product.image,
          stock: product.stock || 20,
          qty: Math.min(product.stock || 99, qty),
        },
      ];
    }
    this.setCart(nextCart);
  },

  updateCartQty(productId, delta) {
    const nextCart = state.cart
      .map((item) =>
        item.id === productId ? { ...item, qty: Math.max(0, Math.min(item.stock || 99, item.qty + delta)) } : item
      )
      .filter((item) => item.qty > 0);
    this.setCart(nextCart);
  },

  removeFromCart(productId) {
    this.setCart(state.cart.filter((item) => item.id !== productId));
  },

  clearCart() {
    this.setCart([]);
  },

  refreshReservation() {
    if (state.cart.length === 0) return;
    const expiresAt = Date.now() + RESERVATION_MINUTES * 60 * 1000;
    state = { ...state, reservationExpiresAt: expiresAt };
    setStorageItem('reservation_expires', expiresAt);
    notify();
  },

  setCartDrawerOpen(isOpen) {
    state = { ...state, cartDrawerOpen: Boolean(isOpen) };
    notify();
  },

  setCookieConsent(consent) {
    state = { ...state, cookieConsent: consent };
    setStorageItem('cookie_consent', consent);
    notify();
  },

  setCookieModalOpen(isOpen) {
    state = { ...state, cookieModalOpen: Boolean(isOpen) };
    notify();
  },

  setAddresses(addresses) {
    state = { ...state, addresses };
    setStorageItem('addresses', addresses);
    notify();
  },

  addOrder(order) {
    const nextOrders = [order, ...state.orders];
    state = { ...state, orders: nextOrders };
    setStorageItem('orders', nextOrders);
    notify();
  },

  setFilters(partialFilters) {
    state = {
      ...state,
      filters: { ...state.filters, ...partialFilters },
    };
    notify();
  },

  showToast(message, type = 'info') {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    state = {
      ...state,
      toasts: [...state.toasts, { id, message, type }],
    };
    notify();

    setTimeout(() => {
      this.dismissToast(id);
    }, 4200);
  },

  dismissToast(id) {
    state = {
      ...state,
      toasts: state.toasts.filter((t) => t.id !== id),
    };
    notify();
  },
};
