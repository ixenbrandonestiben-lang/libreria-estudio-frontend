import {
  ORDER_STATUS_OPTIONS,
  TICKET_STATUS_OPTIONS,
  USER_ROLE_OPTIONS,
  adminService,
} from '../services/adminService.js';
import { authService } from '../services/authService.js';
import { appStore } from '../state/appStore.js';
import { clearElement, createElement, setSafeText } from '../utils/domSanitizer.js';
import { formatCurrency, formatDate } from '../utils/formatters.js';
import { isRequired } from '../utils/validators.js';

const ORDER_STATUS_LABELS = {
  paid: 'Pagado',
  processing: 'En preparación',
  shipped: 'Enviado',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
  refunded: 'Reembolsado',
};

const TICKET_STATUS_LABELS = {
  open: 'Abierto',
  in_progress: 'En progreso',
  resolved: 'Resuelto',
  closed: 'Cerrado',
};

const USER_ROLE_LABELS = {
  customer: 'Cliente (customer)',
  admin: 'Administrador (admin)',
};

function getOrderBadgeClass(status) {
  if (status === 'delivered' || status === 'paid') return 'badge badge--success';
  if (status === 'shipped' || status === 'processing') return 'badge badge--primary';
  if (status === 'cancelled' || status === 'refunded') return 'badge badge--danger';
  return 'badge badge--neutral';
}

function getTicketBadgeClass(status) {
  if (status === 'resolved') return 'badge badge--success';
  if (status === 'in_progress') return 'badge badge--primary';
  if (status === 'open') return 'badge badge--warning';
  return 'badge badge--neutral';
}

export async function initAdminController() {
  const userSummary = document.getElementById('admin-user-summary');
  const restrictedView = document.getElementById('admin-restricted-view');
  const demoBtn = document.getElementById('admin-demo-btn');
  const workspace = document.getElementById('admin-workspace');
  const demoBanner = document.getElementById('admin-demo-banner');

  const productsRoot = document.getElementById('admin-products-root');
  const ordersRoot = document.getElementById('admin-orders-root');
  const ticketsRoot = document.getElementById('admin-tickets-root');
  const usersRoot = document.getElementById('admin-users-root');

  const createProductForm = document.getElementById('admin-create-product-form');
  const productError = document.getElementById('admin-product-error');

  const refreshProductsBtn = document.getElementById('admin-refresh-products');
  const refreshOrdersBtn = document.getElementById('admin-refresh-orders');
  const refreshTicketsBtn = document.getElementById('admin-refresh-tickets');
  const refreshUsersBtn = document.getElementById('admin-refresh-users');

  const tabButtons = Array.from(document.querySelectorAll('.admin-tab'));
  const tabPanels = {
    products: document.getElementById('panel-products'),
    orders: document.getElementById('panel-orders'),
    tickets: document.getElementById('panel-tickets'),
    users: document.getElementById('panel-users'),
  };

  let activeTab = 'products';
  let demoMode = false;

  function showDemoBannerIfNeeded(isDemo) {
    if (!demoBanner) return;
    if (isDemo || demoMode) {
      demoBanner.classList.remove('hidden');
    } else {
      demoBanner.classList.add('hidden');
    }
  }

  function renderEmptyState(container, message) {
    clearElement(container);
    container.appendChild(
      createElement('div', { className: 'card' }, [
        createElement('p', { className: 'text-sm', text: message }),
      ])
    );
  }

  function buildTable(headers, rows) {
    const thead = createElement('thead', {}, [
      createElement(
        'tr',
        {},
        headers.map((h) => createElement('th', { text: h, attrs: { scope: 'col' } }))
      ),
    ]);
    const tbody = createElement('tbody', {}, rows);
    return createElement('div', { className: 'admin-table-wrap' }, [
      createElement('table', { className: 'admin-table' }, [thead, tbody]),
    ]);
  }

  async function loadProducts() {
    if (!productsRoot) return;
    setSafeText(productsRoot, 'Cargando productos...');
    const res = await adminService.getProducts();
    showDemoBannerIfNeeded(res.isDemo);

    if (!res.success) {
      renderEmptyState(productsRoot, res.message || 'No se pudieron cargar los productos.');
      return;
    }

    const products = res.data || [];
    if (products.length === 0) {
      renderEmptyState(productsRoot, 'No hay productos registrados.');
      return;
    }

    const rows = products.map((product) => {
      const priceInput = createElement('input', {
        className: 'admin-input-compact',
        attrs: {
          type: 'number',
          step: '0.01',
          min: '0',
          value: String(product.price),
          'aria-label': `Precio de ${product.name}`,
        },
      });

      const stockInput = createElement('input', {
        className: 'admin-input-compact',
        attrs: {
          type: 'number',
          step: '1',
          min: '0',
          value: String(product.stock),
          'aria-label': `Stock de ${product.name}`,
        },
      });

      const activeSelect = createElement(
        'select',
        {
          className: 'admin-select-compact',
          attrs: { 'aria-label': `Estado de ${product.name}` },
        },
        [
          createElement('option', {
            text: 'Activo',
            attrs: { value: 'true', selected: product.isActive },
          }),
          createElement('option', {
            text: 'Inactivo',
            attrs: { value: 'false', selected: !product.isActive },
          }),
        ]
      );

      const saveBtn = createElement('button', {
        className: 'btn btn--primary btn--sm',
        text: 'Guardar',
        attrs: { type: 'button' },
        events: {
          click: async () => {
            const nextPrice = Number(priceInput.value);
            const nextStock = Number(stockInput.value);
            if (!Number.isFinite(nextPrice) || nextPrice < 0 || !Number.isFinite(nextStock) || nextStock < 0) {
              appStore.showToast('Precio y stock deben ser números válidos mayores o iguales a 0.', 'error');
              return;
            }
            saveBtn.disabled = true;
            const updateRes = await adminService.updateProduct(product.id, {
              price: nextPrice,
              stock: Math.floor(nextStock),
              isActive: activeSelect.value === 'true',
            });
            saveBtn.disabled = false;
            if (!updateRes.success) {
              appStore.showToast(updateRes.message || 'Error al actualizar producto.', 'error');
              return;
            }
            appStore.showToast(`Producto ${product.sku || product.name} actualizado.`, 'success');
          },
        },
      });

      return createElement('tr', {}, [
        createElement('td', {}, [
          createElement('strong', { text: product.name }),
          createElement('div', {
            className: 'text-xs',
            text: `SKU: ${product.sku || '—'} · ${product.brand}`,
          }),
        ]),
        createElement('td', { text: product.category }),
        createElement('td', {}, [priceInput]),
        createElement('td', {}, [stockInput]),
        createElement('td', {}, [activeSelect]),
        createElement('td', {}, [saveBtn]),
      ]);
    });

    clearElement(productsRoot);
    productsRoot.appendChild(
      buildTable(['Producto', 'Categoría', 'Precio (MXN)', 'Stock', 'Estado', 'Acción'], rows)
    );
  }

  async function loadOrders() {
    if (!ordersRoot) return;
    setSafeText(ordersRoot, 'Cargando órdenes...');
    const res = await adminService.getOrders();
    showDemoBannerIfNeeded(res.isDemo);

    if (!res.success) {
      renderEmptyState(ordersRoot, res.message || 'No se pudieron cargar las órdenes.');
      return;
    }

    const orders = res.data || [];
    if (orders.length === 0) {
      renderEmptyState(ordersRoot, 'No hay órdenes registradas.');
      return;
    }

    const rows = orders.map((order) => {
      const badge = createElement('span', {
        className: getOrderBadgeClass(order.status),
        text: ORDER_STATUS_LABELS[order.status] || order.status,
      });

      const statusSelect = createElement(
        'select',
        {
          className: 'admin-select-compact',
          attrs: { 'aria-label': `Cambiar estado de orden ${order.orderNumber}` },
          events: {
            change: async () => {
              const nextStatus = statusSelect.value;
              statusSelect.disabled = true;
              const updateRes = await adminService.updateOrderStatus(order.orderNumber, nextStatus);
              statusSelect.disabled = false;
              if (!updateRes.success) {
                appStore.showToast(updateRes.message || 'No se pudo actualizar la orden.', 'error');
                statusSelect.value = order.status;
                return;
              }
              order.status = nextStatus;
              badge.className = getOrderBadgeClass(nextStatus);
              setSafeText(badge, ORDER_STATUS_LABELS[nextStatus] || nextStatus);
              appStore.showToast(`Orden ${order.orderNumber} actualizada a ${nextStatus}.`, 'success');
            },
          },
        },
        ORDER_STATUS_OPTIONS.map((opt) =>
          createElement('option', {
            text: `${ORDER_STATUS_LABELS[opt] || opt} (${opt})`,
            attrs: { value: opt, selected: order.status === opt },
          })
        )
      );

      return createElement('tr', {}, [
        createElement('td', {}, [createElement('strong', { text: order.orderNumber })]),
        createElement('td', {}, [
          createElement('div', { text: order.customerName }),
          createElement('div', { className: 'text-xs', text: order.customerEmail }),
        ]),
        createElement('td', { text: formatDate(order.createdAt) }),
        createElement('td', { text: formatCurrency(order.total) }),
        createElement('td', {}, [badge]),
        createElement('td', {}, [statusSelect]),
      ]);
    });

    clearElement(ordersRoot);
    ordersRoot.appendChild(
      buildTable(['Orden', 'Cliente', 'Fecha', 'Total', 'Estado actual', 'Transición'], rows)
    );
  }

  async function loadTickets() {
    if (!ticketsRoot) return;
    setSafeText(ticketsRoot, 'Cargando tickets...');
    const res = await adminService.getTickets();
    showDemoBannerIfNeeded(res.isDemo);

    if (!res.success) {
      renderEmptyState(ticketsRoot, res.message || 'No se pudieron cargar los tickets.');
      return;
    }

    const tickets = res.data || [];
    if (tickets.length === 0) {
      renderEmptyState(ticketsRoot, 'No hay tickets de soporte registrados.');
      return;
    }

    const rows = tickets.map((ticket) => {
      const badge = createElement('span', {
        className: getTicketBadgeClass(ticket.status),
        text: TICKET_STATUS_LABELS[ticket.status] || ticket.status,
      });

      const statusSelect = createElement(
        'select',
        {
          className: 'admin-select-compact',
          attrs: { 'aria-label': `Estado de ticket ${ticket.ticketCode}` },
          events: {
            change: async () => {
              const nextStatus = statusSelect.value;
              statusSelect.disabled = true;
              const updateRes = await adminService.updateTicketStatus(ticket.id, nextStatus);
              statusSelect.disabled = false;
              if (!updateRes.success) {
                appStore.showToast(updateRes.message || 'No se pudo actualizar el ticket.', 'error');
                statusSelect.value = ticket.status;
                return;
              }
              ticket.status = nextStatus;
              badge.className = getTicketBadgeClass(nextStatus);
              setSafeText(badge, TICKET_STATUS_LABELS[nextStatus] || nextStatus);
              appStore.showToast(`Ticket ${ticket.ticketCode} actualizado.`, 'success');
            },
          },
        },
        TICKET_STATUS_OPTIONS.map((opt) =>
          createElement('option', {
            text: `${TICKET_STATUS_LABELS[opt] || opt} (${opt})`,
            attrs: { value: opt, selected: ticket.status === opt },
          })
        )
      );

      return createElement('tr', {}, [
        createElement('td', {}, [createElement('strong', { text: ticket.ticketCode })]),
        createElement('td', { text: ticket.contactEmail }),
        createElement('td', {}, [
          createElement('div', { text: ticket.subject }),
          createElement('div', {
            className: 'text-xs',
            text: ticket.orderNumber ? `Orden: ${ticket.orderNumber}` : 'Consulta general',
          }),
        ]),
        createElement('td', { text: formatDate(ticket.createdAt) }),
        createElement('td', {}, [badge]),
        createElement('td', {}, [statusSelect]),
      ]);
    });

    clearElement(ticketsRoot);
    ticketsRoot.appendChild(
      buildTable(['Ticket', 'Contacto', 'Asunto', 'Fecha', 'Estado', 'Actualizar'], rows)
    );
  }

  async function loadUsers() {
    if (!usersRoot) return;
    setSafeText(usersRoot, 'Cargando usuarios...');
    const res = await adminService.getUsers();
    showDemoBannerIfNeeded(res.isDemo);

    if (!res.success) {
      renderEmptyState(usersRoot, res.message || 'No se pudieron cargar los usuarios.');
      return;
    }

    const users = res.data || [];
    if (users.length === 0) {
      renderEmptyState(usersRoot, 'No hay usuarios registrados.');
      return;
    }

    const rows = users.map((usr) => {
      const roleSelect = createElement(
        'select',
        {
          className: 'admin-select-compact',
          attrs: { 'aria-label': `Rol de ${usr.email}` },
          events: {
            change: async () => {
              const nextRole = roleSelect.value;
              roleSelect.disabled = true;
              const updateRes = await adminService.updateUser(usr.id, { role: nextRole });
              roleSelect.disabled = false;
              if (!updateRes.success) {
                appStore.showToast(updateRes.message || 'No se pudo actualizar el rol.', 'error');
                roleSelect.value = usr.role;
                return;
              }
              usr.role = nextRole;
              appStore.showToast(`Rol de ${usr.email} actualizado a ${nextRole}.`, 'success');
            },
          },
        },
        USER_ROLE_OPTIONS.map((opt) =>
          createElement('option', {
            text: USER_ROLE_LABELS[opt] || opt,
            attrs: { value: opt, selected: usr.role === opt },
          })
        )
      );

      const activeSelect = createElement(
        'select',
        {
          className: 'admin-select-compact',
          attrs: { 'aria-label': `Estado de cuenta de ${usr.email}` },
          events: {
            change: async () => {
              const nextActive = activeSelect.value === 'true';
              activeSelect.disabled = true;
              const updateRes = await adminService.updateUser(usr.id, { isActive: nextActive });
              activeSelect.disabled = false;
              if (!updateRes.success) {
                appStore.showToast(updateRes.message || 'No se pudo actualizar el estado.', 'error');
                activeSelect.value = String(usr.isActive);
                return;
              }
              usr.isActive = nextActive;
              appStore.showToast(
                `Usuario ${usr.email} ${nextActive ? 'activado' : 'desactivado'}.`,
                'success'
              );
            },
          },
        },
        [
          createElement('option', {
            text: 'Activo',
            attrs: { value: 'true', selected: usr.isActive },
          }),
          createElement('option', {
            text: 'Inactivo',
            attrs: { value: 'false', selected: !usr.isActive },
          }),
        ]
      );

      return createElement('tr', {}, [
        createElement('td', {}, [createElement('strong', { text: usr.fullName })]),
        createElement('td', { text: usr.email }),
        createElement('td', {}, [roleSelect]),
        createElement('td', {}, [activeSelect]),
      ]);
    });

    clearElement(usersRoot);
    usersRoot.appendChild(buildTable(['Nombre', 'Correo', 'Rol', 'Estado'], rows));
  }

  function switchTab(tabKey) {
    activeTab = tabKey;
    for (const btn of tabButtons) {
      const isSelected = btn.dataset.tab === tabKey;
      btn.setAttribute('aria-selected', String(isSelected));
    }
    for (const [key, panel] of Object.entries(tabPanels)) {
      if (!panel) continue;
      if (key === tabKey) {
        panel.classList.remove('hidden');
      } else {
        panel.classList.add('hidden');
      }
    }

    if (tabKey === 'products') loadProducts();
    if (tabKey === 'orders') loadOrders();
    if (tabKey === 'tickets') loadTickets();
    if (tabKey === 'users') loadUsers();
  }

  for (const btn of tabButtons) {
    btn.addEventListener('click', () => {
      switchTab(btn.dataset.tab || 'products');
    });
  }

  if (refreshProductsBtn) refreshProductsBtn.addEventListener('click', loadProducts);
  if (refreshOrdersBtn) refreshOrdersBtn.addEventListener('click', loadOrders);
  if (refreshTicketsBtn) refreshTicketsBtn.addEventListener('click', loadTickets);
  if (refreshUsersBtn) refreshUsersBtn.addEventListener('click', loadUsers);

  if (createProductForm) {
    createProductForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      setSafeText(productError, '');
      const data = new FormData(createProductForm);
      const sku = String(data.get('sku') || '');
      const title = String(data.get('title') || '');
      const brandName = String(data.get('brandName') || '');
      const categorySlug = String(data.get('categorySlug') || 'cuadernos');
      const price = Number(data.get('price'));
      const stockAvailable = Number(data.get('stockAvailable'));
      const description = String(data.get('description') || '');
      const isActive = Boolean(data.get('isActive'));

      if (
        !isRequired(sku) ||
        !isRequired(title) ||
        !isRequired(brandName) ||
        !Number.isFinite(price) ||
        price <= 0 ||
        !Number.isFinite(stockAvailable) ||
        stockAvailable < 0
      ) {
        setSafeText(
          productError,
          'Completa SKU, nombre, marca, precio mayor a 0 y stock válido.'
        );
        return;
      }

      const res = await adminService.createProduct({
        sku,
        title,
        brandName,
        categorySlug,
        price,
        stockAvailable: Math.floor(stockAvailable),
        description,
        isActive,
      });

      if (!res.success) {
        setSafeText(productError, res.message || 'No se pudo crear el producto.');
        return;
      }

      createProductForm.reset();
      appStore.showToast('Producto creado correctamente.', 'success');
      await loadProducts();
    });
  }

  function enterWorkspace() {
    if (restrictedView) restrictedView.classList.add('hidden');
    if (workspace) workspace.classList.remove('hidden');
    showDemoBannerIfNeeded(demoMode);
    switchTab(activeTab);
  }

  const user = authService.getCurrentUser();
  if (user && user.role === 'admin') {
    const displayName = user.name || user.fullName || user.email;
    setSafeText(userSummary, `Sesión de administrador: ${displayName} (${user.email})`);
    enterWorkspace();
    return;
  }

  setSafeText(
    userSummary,
    user
      ? `Sesión actual: ${user.email} (rol: ${user.role || 'customer'}) — Se requiere rol admin.`
      : 'No has iniciado sesión como administrador.'
  );
  if (restrictedView) restrictedView.classList.remove('hidden');
  if (workspace) workspace.classList.add('hidden');

  const offline = await adminService.isBackendOffline();
  if (offline && demoBtn) {
    demoBtn.classList.remove('hidden');
    demoBtn.addEventListener('click', () => {
      demoMode = true;
      setSafeText(userSummary, 'Vista Demo Admin (modo demostración local)');
      enterWorkspace();
    });
  }
}
