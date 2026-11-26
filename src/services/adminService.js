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
    brand: item.brand_name || item.brand || item.brandName || 'Librería Estudio',
    category: item.category_slug || item.category || item.categorySlug || 'cuadernos',
    price: Number(item.price ?? 0),
    stock: Number(item.stock_available ?? item.stock ?? item.stockAvailable ?? 0),
    unitLabel: item.unit_label || item.unitLabel || 'unidad',
    unitsPerPack: Number(item.units_per_pack ?? item.unitsPerPack ?? 1),
    isActive: item.is_active !== undefined ? Boolean(item.is_active) : item.isActive !== false,
    description: item.short_description || item.shortDescription || item.description || '',
    attributes: Array.isArray(item.attributes) ? item.attributes : [],
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

function normalizeAnalytics(raw) {
  const data = raw && typeof raw === 'object' ? raw : {};
  const rawKpis = data.kpis && typeof data.kpis === 'object' ? data.kpis : data;

  const totalOrders = Number(rawKpis.totalOrders ?? rawKpis.total_orders ?? 0);
  const totalRevenue = Number(rawKpis.totalRevenue ?? rawKpis.total_revenue ?? 0);
  const averageTicket =
    rawKpis.averageTicket !== undefined || rawKpis.average_ticket !== undefined
      ? Number(rawKpis.averageTicket ?? rawKpis.average_ticket ?? 0)
      : totalOrders > 0
        ? totalRevenue / totalOrders
        : 0;

  const topProductsRaw = Array.isArray(data.topProducts)
    ? data.topProducts
    : Array.isArray(data.top_products)
      ? data.top_products
      : [];

  const topProducts = topProductsRaw.map((item) => ({
    sku: item.sku || '—',
    title: item.title || item.name || 'Producto',
    unitsSold: Number(item.unitsSold ?? item.units_sold ?? item.quantity ?? 0),
    revenue: Number(item.revenue ?? item.total_revenue ?? 0),
  }));

  const lowStockRaw = Array.isArray(data.lowStockAlerts)
    ? data.lowStockAlerts
    : Array.isArray(data.low_stock_alerts)
      ? data.low_stock_alerts
      : [];

  const lowStockAlerts = lowStockRaw.map((item) => ({
    id: item.id,
    sku: item.sku || '—',
    title: item.title || item.name || 'Producto',
    stockAvailable: Number(item.stockAvailable ?? item.stock_available ?? item.stock ?? 0),
  }));

  const statusSource = data.ordersByStatus ?? data.orders_by_status ?? [];
  let ordersByStatus = [];
  if (Array.isArray(statusSource)) {
    ordersByStatus = statusSource.map((item) => ({
      status: item.status || 'paid',
      count: Number(item.count ?? item.total_orders ?? 0),
      total: Number(item.total ?? item.total_amount ?? 0),
    }));
  } else if (statusSource && typeof statusSource === 'object') {
    ordersByStatus = Object.entries(statusSource).map(([status, val]) => {
      if (val && typeof val === 'object') {
        return {
          status,
          count: Number(val.count ?? 0),
          total: Number(val.total ?? 0),
        };
      }
      return { status, count: Number(val ?? 0), total: 0 };
    });
  }

  return {
    kpis: {
      totalRevenue,
      totalOrders,
      averageTicket,
      ordersToDispatch: Number(rawKpis.ordersToDispatch ?? rawKpis.orders_to_dispatch ?? 0),
      openTickets: Number(rawKpis.openTickets ?? rawKpis.open_tickets ?? 0),
      registeredUsers: Number(rawKpis.registeredUsers ?? rawKpis.registered_users ?? 0),
    },
    topProducts,
    lowStockAlerts,
    ordersByStatus,
  };
}

function getDemoAnalytics() {
  const products = getDemoProducts();
  const orders = getDemoOrders();
  const tickets = getDemoTickets();
  const users = getDemoUsers();

  const hasOrders = orders.length > 0;
  const totalOrders = hasOrders ? orders.length : 18;
  const totalRevenue = hasOrders
    ? orders.reduce((sum, o) => sum + Number(o.total || 0), 0)
    : 14850.5;
  const averageTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  const ordersToDispatch = hasOrders
    ? orders.filter((o) => o.status === 'paid' || o.status === 'processing').length
    : 5;

  const openTickets = tickets.filter(
    (t) => t.status === 'open' || t.status === 'in_progress'
  ).length;

  const lowStockAlerts = products
    .filter((p) => Number(p.stock) <= 15)
    .map((p) => ({
      id: p.id,
      sku: p.sku || '—',
      title: p.name,
      stockAvailable: Number(p.stock),
    }));

  const ordersByStatus = hasOrders
    ? ORDER_STATUS_OPTIONS.map((status) => {
        const matching = orders.filter((o) => o.status === status);
        return {
          status,
          count: matching.length,
          total: matching.reduce((sum, o) => sum + Number(o.total || 0), 0),
        };
      }).filter((entry) => entry.count > 0)
    : [
        { status: 'paid', count: 3, total: 2450 },
        { status: 'processing', count: 2, total: 1890 },
        { status: 'shipped', count: 4, total: 3620 },
        { status: 'delivered', count: 8, total: 6410.5 },
        { status: 'cancelled', count: 1, total: 480 },
      ];

  const topProducts = products.slice(0, 5).map((p, idx) => {
    const unitsSold = Math.max(4, 32 - idx * 6);
    return {
      sku: p.sku || `SKU-0${idx + 1}`,
      title: p.name,
      unitsSold,
      revenue: Number((unitsSold * Number(p.price || 0)).toFixed(2)),
    };
  });

  return normalizeAnalytics({
    kpis: {
      totalRevenue,
      totalOrders,
      averageTicket,
      ordersToDispatch,
      openTickets,
      registeredUsers: users.length,
    },
    topProducts,
    lowStockAlerts,
    ordersByStatus,
  });
}

export const adminService = {
  async isBackendOffline() {
    const res = await apiRequest('/health', { timeoutMs: 2500 });
    return res.error?.code === 'NETWORK_OFFLINE';
  },

  async getAnalytics() {
    const res = await apiRequest('/admin/analytics');
    if (res.success && res.data) {
      return {
        ...res,
        data: normalizeAnalytics(res.data),
        isDemo: false,
      };
    }

    if (res.error?.code === 'NETWORK_OFFLINE') {
      return {
        success: true,
        message: 'Resumen analítico cargado en modo demostración local',
        data: getDemoAnalytics(),
        error: null,
        isDemo: true,
      };
    }

    return res;
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
    const title = String(payload.title || payload.name || '').trim();
    const toSlug = (text) =>
      String(text || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

    const slug = toSlug(payload.slug || title);
    const shortDescription = String(payload.shortDescription ?? payload.description ?? '').trim();
    const unitsPerPack = Number(payload.unitsPerPack ?? payload.units_per_pack ?? 1);
    const attributes = Array.isArray(payload.attributes)
      ? payload.attributes.filter((a) => a && a.key && String(a.value || '').trim() !== '')
      : [];

    const categoryId = Number(payload.categoryId);
    const brandId = Number(payload.brandId);

    const body = {
      sku: String(payload.sku || '').trim(),
      title,
      slug,
      price: Number(payload.price),
      stockAvailable: Number(payload.stockAvailable ?? payload.stock ?? 0),
      unitLabel: String(payload.unitLabel || payload.unit_label || 'unidad').trim(),
      unitsPerPack: Number.isFinite(unitsPerPack) && unitsPerPack >= 1 ? Math.floor(unitsPerPack) : 1,
      shortDescription,
      isActive: payload.isActive !== false,
      attributes,
    };

    if (Number.isInteger(categoryId) && categoryId >= 1) body.categoryId = categoryId;
    if (Number.isInteger(brandId) && brandId >= 1) body.brandId = brandId;

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
        brandName: String(payload.brandName || payload.brand || '').trim(),
        categorySlug: String(payload.categorySlug || payload.category || 'cuadernos').trim(),
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
