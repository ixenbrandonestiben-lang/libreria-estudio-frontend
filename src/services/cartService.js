import { appStore } from '../state/appStore.js';
import { apiRequest } from './apiClient.js';

function isDemoProductId(productId) {
  return String(productId ?? '').startsWith('prod-');
}

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

  async addItem(product, qty = 1, { silentToast = false } = {}) {
    if (!product || product.id === undefined || product.id === null) {
      return { success: false, message: 'Producto no válido' };
    }

    const stock = Number.isFinite(Number(product.stock)) ? Number(product.stock) : 20;
    if (stock <= 0) {
      if (!silentToast) {
        appStore.showToast(`Sin stock disponible para ${product.name || 'este artículo'}.`, 'warning');
      }
      return { success: false, message: 'Sin stock disponible' };
    }

    if (!isDemoProductId(product.id)) {
      const res = await apiRequest('/cart/items', {
        method: 'POST',
        body: { productId: Number(product.id) || product.id, quantity: qty },
      });

      if (!res.success && res.error?.code !== 'NETWORK_OFFLINE') {
        if (!silentToast) {
          appStore.showToast(res.message || 'No se pudo agregar al carrito.', 'danger');
        }
        return res;
      }
    }

    const added = appStore.addToCart(product, qty);
    if (!added) {
      return { success: false, message: 'No se pudo agregar al carrito' };
    }

    if (!silentToast) {
      appStore.showToast(`Agregado: ${product.name}`, 'success');
    }
    return { success: true, message: 'Producto agregado' };
  },

  async updateQuantity(productId, delta) {
    const existing = appStore.getState().cart.find((i) => String(i.id) === String(productId));
    appStore.updateCartQty(productId, delta);

    if (existing && !isDemoProductId(productId)) {
      const nextQty = Math.max(0, Math.min(existing.stock || 99, existing.qty + delta));
      await apiRequest(`/cart/items/${encodeURIComponent(productId)}`, {
        method: 'PUT',
        body: { quantity: nextQty },
      }).catch(() => null);
    }
  },

  async removeItem(productId) {
    appStore.removeFromCart(productId);
    if (!isDemoProductId(productId)) {
      await apiRequest(`/cart/items/${encodeURIComponent(productId)}`, {
        method: 'DELETE',
      }).catch(() => null);
    }
  },

  async clearCart() {
    appStore.clearCart();
    await apiRequest('/cart', { method: 'DELETE' }).catch(() => null);
  },
};
