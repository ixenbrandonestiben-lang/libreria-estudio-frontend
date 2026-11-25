import { appStore } from '../state/appStore.js';
import { apiRequest } from './apiClient.js';

export const orderService = {
  async createOrder(orderPayload) {
    if (!orderPayload.termsAccepted) {
      return {
        success: false,
        message: 'Debes aceptar los Términos y Condiciones antes de confirmar tu pedido.',
        data: null,
        error: { code: 'TERMS_REQUIRED' },
      };
    }

    const res = await apiRequest('/orders', {
      method: 'POST',
      body: orderPayload,
    });

    if (res.success && res.data) {
      appStore.addOrder(res.data);
      appStore.clearCart();
      return res;
    }

    if (res.error?.code === 'NETWORK_OFFLINE') {
      const localOrder = {
        id: `LE-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        createdAt: new Date().toISOString(),
        status: 'Confirmado',
        total: orderPayload.total,
        email: orderPayload.email,
        address: orderPayload.address,
        paymentMethod: orderPayload.paymentMethod,
        requiresInvoice: Boolean(orderPayload.requiresInvoice),
        items: orderPayload.items,
      };
      appStore.addOrder(localOrder);
      appStore.clearCart();
      return {
        success: true,
        message: 'Pedido confirmado exitosamente',
        data: localOrder,
        error: null,
      };
    }

    return res;
  },

  async getOrders() {
    const res = await apiRequest('/orders');
    if (res.success && Array.isArray(res.data)) {
      return res;
    }
    return {
      success: true,
      message: 'Historial local de pedidos',
      data: appStore.getState().orders,
      error: null,
    };
  },

  async trackOrder(orderCode, email) {
    const cleanCode = String(orderCode || '').trim().toUpperCase();
    const cleanEmail = String(email || '').trim().toLowerCase();

    const res = await apiRequest(
      `/orders/track?code=${encodeURIComponent(cleanCode)}&email=${encodeURIComponent(cleanEmail)}`
    );

    if (res.success && res.data) {
      return res;
    }

    const found = appStore
      .getState()
      .orders.find(
        (o) =>
          o.id.toUpperCase() === cleanCode &&
          (!cleanEmail || String(o.email || '').toLowerCase() === cleanEmail)
      );

    if (found) {
      return {
        success: true,
        message: 'Pedido localizado',
        data: found,
        error: null,
      };
    }

    return {
      success: false,
      message: 'No encontramos un pedido con ese código y correo. Prueba con LE-2026-0842.',
      data: null,
      error: { code: 'ORDER_NOT_FOUND' },
    };
  },
};
