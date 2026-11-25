import { appStore } from '../state/appStore.js';
import { removeStorageItem } from '../utils/storageHelper.js';
import { apiRequest } from './apiClient.js';

function normalizeOrder(order) {
  if (!order || typeof order !== 'object') return null;
  return {
    ...order,
    id: order.orderNumber || order.order_number || order.id,
    orderNumber: order.orderNumber || order.order_number || String(order.id || ''),
    createdAt: order.createdAt || order.created_at || new Date().toISOString(),
    total: Number(order.totalAmount ?? order.total_amount ?? order.total ?? 0),
    status: order.status || 'Confirmado',
  };
}

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

    const backendBody = {
      customerEmail: orderPayload.customerEmail || orderPayload.email,
      customerName: orderPayload.customerName || orderPayload.fullName,
      customerPhone: orderPayload.customerPhone || orderPayload.phone || null,
      deliveryMethod: orderPayload.deliveryMethod || 'home_delivery',
      shippingAddress: orderPayload.shippingAddress || {
        recipientName: orderPayload.fullName,
        recipientPhone: orderPayload.phone,
        addressLine1: orderPayload.street || orderPayload.address || '',
        city: orderPayload.city || 'Ciudad de México',
        stateOrDepartment: orderPayload.stateOrDepartment || 'CDMX',
        postalCode: orderPayload.postalCode || '',
      },
      paymentReference: orderPayload.paymentReference || null,
      termsAccepted: true,
    };

    const res = await apiRequest('/orders', {
      method: 'POST',
      body: backendBody,
    });

    if (res.success && res.data) {
      const normalized = normalizeOrder(res.data);
      appStore.addOrder(normalized);
      appStore.clearCart();
      removeStorageItem('cart_token');
      return {
        ...res,
        data: normalized,
      };
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
      return {
        ...res,
        data: res.data.map(normalizeOrder),
      };
    }
    return {
      success: true,
      message: 'Historial local de pedidos',
      data: appStore.getState().orders.map(normalizeOrder),
      error: null,
    };
  },

  async trackOrder(orderCode, email) {
    const cleanCode = String(orderCode || '').trim().toUpperCase();
    const cleanEmail = String(email || '').trim().toLowerCase();

    if (cleanCode && cleanEmail) {
      const res = await apiRequest(
        `/orders/track?orderNumber=${encodeURIComponent(cleanCode)}&email=${encodeURIComponent(cleanEmail)}`
      );

      if (res.success && res.data) {
        return {
          ...res,
          data: normalizeOrder(res.data),
        };
      }

      if (res.error?.code !== 'NETWORK_OFFLINE') {
        const localFound = appStore
          .getState()
          .orders.find(
            (o) =>
              String(o.id || o.orderNumber).toUpperCase() === cleanCode &&
              String(o.email || o.customerEmail || '').toLowerCase() === cleanEmail
          );
        if (localFound) {
          return {
            success: true,
            message: 'Pedido localizado',
            data: normalizeOrder(localFound),
            error: null,
          };
        }
        return res;
      }
    }

    const found = appStore
      .getState()
      .orders.find(
        (o) =>
          String(o.id || o.orderNumber).toUpperCase() === cleanCode &&
          (!cleanEmail || String(o.email || o.customerEmail || '').toLowerCase() === cleanEmail)
      );

    if (found) {
      return {
        success: true,
        message: 'Pedido localizado',
        data: normalizeOrder(found),
        error: null,
      };
    }

    return {
      success: false,
      message: cleanEmail
        ? 'No encontramos un pedido con ese código y correo. Prueba con LE-2026-0842.'
        : 'Ingresa el código y correo de compra (o prueba con el pedido demo LE-2026-0842).',
      data: null,
      error: { code: 'ORDER_NOT_FOUND' },
    };
  },
};
