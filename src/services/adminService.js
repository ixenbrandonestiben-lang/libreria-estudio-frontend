import { appStore } from '../state/appStore.js';
import { DEMO_PRODUCTS } from '../utils/constants.js';
import { getStorageItem, setStorageItem } from '../utils/storageHelper.js';
import { apiRequest } from './apiClient.js';

export const ORDER_STATUS_OPTIONS = [
  'paid',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
  'refunded',
];

export const TICKET_STATUS_OPTIONS = ['open', 'in_progress', 'resolved', 'closed'];

export const USER_ROLE_OPTIONS = ['customer', 'admin'];

const DEFAULT_DEMO_TICKETS = [
  {
    id: 'TK-2026-01',
    ticketCode: 'TK-2026-01',
    contactEmail: 'familia.hernandez@ejemplo.mx',
    orderNumber: 'LE-2026-0842',
    subject: 'Consulta sobre entrega de paquete escolar',
    message: '¿El paquete llega antes del lunes?',
    status: 'open',
    createdAt: '2026-11-10T14:20:00Z',
  },
  {
    id: 'TK-2026-02',
    ticketCode: 'TK-2026-02',
    contactEmail: 'docente.mora@escuela.edu.mx',
    orderNumber: '',
    subject: 'Cotización por volumen para 30 alumnos',
    message: 'Requiero factura electrónica para primaria.',
    status: 'in_progress',
    createdAt: '2026-11-12T09:15:00Z',
  },
];

const DEFAULT_DEMO_USERS = [
  {
    id: 'usr-1',
    fullName: 'Administración Estudio',
    email: 'admin@libreriaestudio.mx',
    role: 'admin',
    isActive: true,
    createdAt: '2026-08-01T10:00:00Z',
  },
  {
    id: 'usr-2',
    fullName: 'Laura Hernández',
    email: 'familia@ejemplo.mx',
    role: 'customer',
    isActive: true,
    createdAt: '2026-09-12T16:40:00Z',
  },
  {
    id: 'usr-3',
    fullName: 'Prof. Carlos Mora',
    email: 'docente.mora@escuela.edu.mx',
    role: 'customer',
    isActive: false,
    createdAt: '2026-10-05T11:10:00Z',
  },
];

function normalizeProduct(item) {
  if (!item || typeof item !== 'object') return null;
  return {
    id: item.id,
    sku: item.sku || '',
    name: item.title || item.name || 'Producto sin nombre',
    brand: item.brand_name || item.brand || 'Librería Estudio',
    category: item.category_slug || item.category || 'cuadernos',
    price: Number(item.price ?? 0),
    stock: Number(item.stock_available ?? item.stock ?? 0),
    isActive: item.is_active !== undefined ? Boolean(item.is_active) : item.isActive !== false,
    description: item.description || '',
  };
}

function normalizeOrder(item) {
  if (!item || typeof item !== 'object') return null;
  const orderNumber = item.order_number || item.orderNumber || String(item.id || '');
  return {
    id: item.id ?? orderNumber,
    orderNumber,
    customerEmail: item.customer_email || item.customerEmail || item.email || '—',
    customerName: item.customer_name || item.customerName || 'Cliente',
    total: Number(item.total_amount ?? item.totalAmount ?? item.total ?? 0),
    status: item.status || 'paid',
    createdAt: item.created_at || item.createdAt || new Date().toISOString(),
  };
}

function normalizeTicket(item) {
  if (!item || typeof item !== 'object') return null;
  const ticketCode = item.ticket_code || item.ticketCode || String(item.id || '');
  return {
    id: item.id ?? ticketCode,
    ticketCode,
    contactEmail: item.contact_email || item.contactEmail || item.email || '—',
    orderNumber: item.order_number || item.orderNumber || '',
    subject: item.subject || 'Sin asunto',
    message: item.message || '',
    status: item.status || 'open',
    createdAt: item.created_at || item.createdAt || new Date().toISOString(),
  };
}

function normalizeUser(item) {
  if (!item || typeof item !== 'object') return null;
  return {
    id: item.id,
    fullName: item.full_name || item.fullName || item.name || 'Usuario',
    email: item.email || '',
    role: item.role || 'customer',
    isActive: item.is_active !== undefined ? Boolean(item.is_active) : item.isActive !== false,
    createdAt: item.created_at || item.createdAt || '',
  };
}

function getDemoProducts() {
  const stored = getStorageItem('admin_demo_products', null);
  if (Array.isArray(stored) && stored.length > 0) return stored.map(normalizeProduct);
  const seeded = DEMO_PRODUCTS.map((p) => normalizeProduct({ ...p, isActive: true }));
  setStorageItem('admin_demo_products', seeded);
  return seeded;
}

function getDemoOrders() {
  const stored = getStorageItem('admin_demo_orders', null);
  if (Array.isArray(stored) && stored.length > 0) return stored.map(normalizeOrder);
  const storeOrders = appStore.getState().orders || [];
  const seeded = storeOrders.map((o) =>
    normalizeOrder({
      ...o,
      status: ORDER_STATUS_OPTIONS.includes(o.status) ? o.status : 'processing',
    })
  );
  setStorageItem('admin_demo_orders', seeded);
  return seeded;
}

function getDemoTickets() {
  const stored = getStorageItem('admin_demo_tickets', null);
  if (Array.isArray(stored) && stored.length > 0) return stored.map(normalizeTicket);
  const supportTickets = getStorageItem('support_tickets', []);
  const combined = [...supportTickets, ...DEFAULT_DEMO_TICKETS].map((t) =>
    normalizeTicket({
      ...t,
      status: TICKET_STATUS_OPTIONS.includes(t.status) ? t.status : 'open',
    })
  );
  setStorageItem('admin_demo_tickets', combined);
  return combined;
}

function getDemoUsers() {
  const stored = getStorageItem('admin_demo_users', null);
  if (Array.isArray(stored) && stored.length > 0) return stored.map(normalizeUser);
  setStorageItem('admin_demo_users', DEFAULT_DEMO_USERS);
  return DEFAULT_DEMO_USERS.map(normalizeUser);
}

export const adminService = {
  async isBackendOffline() {
    const res = await apiRequest('/health', { timeoutMs: 2500 });
    return res.error?.code === 'NETWORK_OFFLINE';
  },

  async getProducts() {
    const res = await apiRequest('/admin/products');
    if (res.success && Array.isArray(res.data)) {
      return {
        ...res,
        data: res.data.map(normalizeProduct),
        isDemo: false,
      };
    }

    if (res.error?.code === 'NETWORK_OFFLINE') {
      return {
        success: true,
        message: 'Productos cargados en modo demostración local',
        data: getDemoProducts(),
        error: null,
        isDemo: true,
      };
    }

    return res;
  },

  async createProduct(payload) {
    const body = {
      sku: String(payload.sku || '').trim(),
      title: String(payload.title || payload.name || '').trim(),
      brandName: String(payload.brandName || payload.brand || '').trim(),
      categorySlug: String(payload.categorySlug || payload.category || 'cuadernos').trim(),
      price: Number(payload.price),
      stockAvailable: Number(payload.stockAvailable ?? payload.stock ?? 0),
      description: String(payload.description || '').trim(),
      isActive: payload.isActive !== false,
    };

    const res = await apiRequest('/admin/products', {
      method: 'POST',
      body,
    });

    if (res.success && res.data) {
      return { ...res, data: normalizeProduct(res.data), isDemo: false };
    }

    if (res.error?.code === 'NETWORK_OFFLINE') {
      const current = getDemoProducts();
      const created = normalizeProduct({
        id: `prod-${Date.now().toString().slice(-4)}`,
        ...body,
      });
      setStorageItem('admin_demo_products', [created, ...current]);
      return {
        success: true,
        message: 'Producto creado en modo demostración local',
        data: created,
        error: null,
        isDemo: true,
      };
    }

    return res;
  },

  async updateProduct(id, payload) {
    const body = {};
    if (payload.price !== undefined) body.price = Number(payload.price);
    if (payload.stock !== undefined || payload.stockAvailable !== undefined) {
      body.stockAvailable = Number(payload.stockAvailable ?? payload.stock);
    }
    if (payload.isActive !== undefined) body.isActive = Boolean(payload.isActive);

    const res = await apiRequest(`/admin/products/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body,
    });

    if (res.success && res.data) {
      return { ...res, data: normalizeProduct(res.data), isDemo: false };
    }

    if (res.error?.code === 'NETWORK_OFFLINE') {
      const current = getDemoProducts();
      let updatedItem = null;
      const next = current.map((item) => {
        if (String(item.id) !== String(id)) return item;
        updatedItem = {
          ...item,
          price: body.price !== undefined ? body.price : item.price,
          stock: body.stockAvailable !== undefined ? body.stockAvailable : item.stock,
          isActive: body.isActive !== undefined ? body.isActive : item.isActive,
        };
        return updatedItem;
      });
      setStorageItem('admin_demo_products', next);
      return {
        success: Boolean(updatedItem),
        message: updatedItem ? 'Producto actualizado en modo demostración' : 'Producto no encontrado',
        data: updatedItem,
        error: updatedItem ? null : { code: 'NOT_FOUND' },
        isDemo: true,
      };
    }

    return res;
  },

  async getOrders() {
    const res = await apiRequest('/admin/orders');
    if (res.success && Array.isArray(res.data)) {
      return {
        ...res,
        data: res.data.map(normalizeOrder),
        isDemo: false,
      };
    }

    if (res.error?.code === 'NETWORK_OFFLINE') {
      return {
        success: true,
        message: 'Órdenes cargadas en modo demostración local',
        data: getDemoOrders(),
        error: null,
        isDemo: true,
      };
    }

    return res;
  },

  async updateOrderStatus(orderNumber, status) {
    const res = await apiRequest(`/orders/${encodeURIComponent(orderNumber)}/status`, {
      method: 'PATCH',
      body: { status },
    });

    if (res.success && res.data) {
      return { ...res, data: normalizeOrder(res.data), isDemo: false };
    }

    if (res.error?.code === 'NETWORK_OFFLINE') {
      const current = getDemoOrders();
      let updatedOrder = null;
      const next = current.map((o) => {
        if (String(o.orderNumber) !== String(orderNumber)) return o;
        updatedOrder = { ...o, status };
        return updatedOrder;
      });
      setStorageItem('admin_demo_orders', next);
      return {
        success: Boolean(updatedOrder),
        message: updatedOrder
          ? `Orden ${orderNumber} actualizada a ${status}`
          : 'Orden no encontrada',
        data: updatedOrder,
        error: updatedOrder ? null : { code: 'NOT_FOUND' },
        isDemo: true,
      };
    }

    return res;
  },

  async getTickets() {
    const res = await apiRequest('/admin/tickets');
    if (res.success && Array.isArray(res.data)) {
      return {
        ...res,
        data: res.data.map(normalizeTicket),
        isDemo: false,
      };
    }

    if (res.error?.code === 'NETWORK_OFFLINE') {
      return {
        success: true,
        message: 'Tickets cargados en modo demostración local',
        data: getDemoTickets(),
        error: null,
        isDemo: true,
      };
    }

    return res;
  },

  async updateTicketStatus(ticketId, status) {
    const res = await apiRequest(`/admin/tickets/${encodeURIComponent(ticketId)}/status`, {
      method: 'PATCH',
      body: { status },
    });

    if (res.success && res.data) {
      return { ...res, data: normalizeTicket(res.data), isDemo: false };
    }

    if (res.error?.code === 'NETWORK_OFFLINE') {
      const current = getDemoTickets();
      let updatedTicket = null;
      const next = current.map((t) => {
        if (String(t.id) !== String(ticketId) && String(t.ticketCode) !== String(ticketId)) {
          return t;
        }
        updatedTicket = { ...t, status };
        return updatedTicket;
      });
      setStorageItem('admin_demo_tickets', next);
      return {
        success: Boolean(updatedTicket),
        message: updatedTicket ? `Ticket actualizado a ${status}` : 'Ticket no encontrado',
        data: updatedTicket,
        error: updatedTicket ? null : { code: 'NOT_FOUND' },
        isDemo: true,
      };
    }

    return res;
  },

  async getUsers() {
    const res = await apiRequest('/admin/users');
    if (res.success && Array.isArray(res.data)) {
      return {
        ...res,
        data: res.data.map(normalizeUser),
        isDemo: false,
      };
    }

    if (res.error?.code === 'NETWORK_OFFLINE') {
      return {
        success: true,
        message: 'Usuarios cargados en modo demostración local',
        data: getDemoUsers(),
        error: null,
        isDemo: true,
      };
    }

    return res;
  },

  async updateUser(userId, payload) {
    const body = {};
    if (payload.role !== undefined) body.role = payload.role;
    if (payload.isActive !== undefined) body.isActive = Boolean(payload.isActive);

    const res = await apiRequest(`/admin/users/${encodeURIComponent(userId)}`, {
      method: 'PATCH',
      body,
    });

    if (res.success && res.data) {
      return { ...res, data: normalizeUser(res.data), isDemo: false };
    }

    if (res.error?.code === 'NETWORK_OFFLINE') {
      const current = getDemoUsers();
      let updatedUser = null;
      const next = current.map((u) => {
        if (String(u.id) !== String(userId)) return u;
        updatedUser = {
          ...u,
          role: body.role !== undefined ? body.role : u.role,
          isActive: body.isActive !== undefined ? body.isActive : u.isActive,
        };
        return updatedUser;
      });
      setStorageItem('admin_demo_users', next);
      return {
        success: Boolean(updatedUser),
        message: updatedUser ? 'Usuario actualizado en modo demostración' : 'Usuario no encontrado',
        data: updatedUser,
        error: updatedUser ? null : { code: 'NOT_FOUND' },
        isDemo: true,
      };
    }

    return res;
  },
};
