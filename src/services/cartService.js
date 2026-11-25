import { appStore } from '../state/appStore.js';
import { apiRequest } from './apiClient.js';

export const cartService = {
  getCart() {
    return appStore.getState().cart;
  },

  getTotalCount() {
    return appStore.getState().cart.reduce((sum, item) => sum + item.qty, 0);
  },

  getSubtotal() {
    return appStore.getState().cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  },

  async addItem(product, qty = 1) {
    appStore.addToCart(product, qty);
    appStore.showToast(`Agregado: ${product.name}`, 'success');

    if (appStore.getState().token) {
      await apiRequest('/cart/items', {
        method: 'POST',
        body: { productId: product.id, quantity: qty },
      }).catch(() => null);
    }
  },

  updateQuantity(productId, delta) {
    appStore.updateCartQty(productId, delta);
  },

  removeItem(productId) {
    appStore.removeFromCart(productId);
  },

  clearCart() {
    appStore.clearCart();
  },
};
