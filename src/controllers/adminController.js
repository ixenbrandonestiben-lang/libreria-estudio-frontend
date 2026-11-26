import {
  ORDER_STATUS_OPTIONS,
  TICKET_STATUS_OPTIONS,
  USER_ROLE_OPTIONS,
  adminService,
} from '../services/adminService.js';
import { authService } from '../services/authService.js';
import { productService } from '../services/productService.js';
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

  const analyticsRoot = document.getElementById('admin-analytics-root');
  const productsRoot = document.getElementById('admin-products-root');
  const ordersRoot = document.getElementById('admin-orders-root');
  const ticketsRoot = document.getElementById('admin-tickets-root');
  const usersRoot = document.getElementById('admin-users-root');

  const createProductForm = document.getElementById('admin-create-product-form');
  const productError = document.getElementById('admin-product-error');
  const prodCategorySelect = document.getElementById('prod-category');
  const prodBrandSelect = document.getElementById('prod-brand');

  const refreshAnalyticsBtn = document.getElementById('admin-refresh-analytics');
  const refreshProductsBtn = document.getElementById('admin-refresh-products');
  const refreshOrdersBtn = document.getElementById('admin-refresh-orders');
  const refreshTicketsBtn = document.getElementById('admin-refresh-tickets');
  const refreshUsersBtn = document.getElementById('admin-refresh-users');

  const tabButtons = Array.from(document.querySelectorAll('.admin-tab'));
  const tabPanels = {
    analytics: document.getElementById('panel-analytics'),
    products: document.getElementById('panel-products'),
    orders: document.getElementById('panel-orders'),
    tickets: document.getElementById('panel-tickets'),
    users: document.getElementById('panel-users'),
  };

  let activeTab = 'analytics';
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

  function buildKpiCard(label, value, hint = '', tone = 'default') {
    const cardClass =
      tone === 'warning'
        ? 'card admin-kpi-card admin-kpi-card--warning'
        : tone === 'primary'
          ? 'card admin-kpi-card admin-kpi-card--primary'
          : 'card admin-kpi-card';
    const children = [
      createElement('span', { className: 'admin-kpi-card__label', text: label }),
      createElement('strong', { className: 'admin-kpi-card__value', text: value }),
    ];
    if (hint) {
      children.push(createElement('span', { className: 'text-xs admin-kpi-card__hint', text: hint }));
    }
    return createElement('article', { className: cardClass }, children);
  }

  async function loadAnalytics() {
    if (!analyticsRoot) return;
    setSafeText(analyticsRoot, 'Cargando resumen y métricas...');
    const res = await adminService.getAnalytics();
    showDemoBannerIfNeeded(res.isDemo);

    if (!res.success || !res.data) {
      renderEmptyState(analyticsRoot, res.message || 'No se pudieron cargar las métricas.');
      return;
    }

    const { kpis, topProducts, lowStockAlerts, ordersByStatus } = res.data;

    const kpiGrid = createElement('div', { className: 'admin-kpi-grid' }, [
      buildKpiCard('Ingresos Totales', formatCurrency(kpis.totalRevenue), 'Ventas acumuladas', 'primary'),
      buildKpiCard('Órdenes Totales', String(kpis.totalOrders), 'Pedidos registrados'),
      buildKpiCard('Ticket Promedio', formatCurrency(kpis.averageTicket), 'Promedio por orden'),
      buildKpiCard(
        'Órdenes por Despachar',
        String(kpis.ordersToDispatch),
        'Pagadas o en preparación',
        kpis.ordersToDispatch > 0 ? 'warning' : 'default'
      ),
      buildKpiCard(
        'Tickets Abiertos',
        String(kpis.openTickets),
        'Pendientes de atención',
        kpis.openTickets > 0 ? 'warning' : 'default'
      ),
      buildKpiCard('Usuarios Registrados', String(kpis.registeredUsers), 'Cuentas activas e inactivas'),
    ]);

    const topProductsCard = createElement('section', { className: 'card admin-analytics-card' }, [
      createElement('div', { className: 'admin-panel__header' }, [
        createElement('h3', { text: 'Top Productos Más Demandados' }),
      ]),
      topProducts.length > 0
        ? buildTable(
            ['#', 'SKU', 'Producto', 'Unidades Vendidas', 'Ingresos'],
            topProducts.map((item, index) =>
              createElement('tr', {}, [
                createElement('td', { text: String(index + 1) }),
                createElement('td', { text: item.sku }),
                createElement('td', {}, [createElement('strong', { text: item.title })]),
                createElement('td', { text: String(item.unitsSold) }),
                createElement('td', { text: formatCurrency(item.revenue) }),
              ])
            )
          )
        : createElement('p', {
            className: 'text-sm',
            text: 'Aún no hay ventas suficientes para generar el ranking.',
          }),
    ]);

    const statusList =
      ordersByStatus.length > 0
        ? createElement(
            'ul',
            { className: 'admin-status-list' },
            ordersByStatus.map((entry) =>
              createElement('li', { className: 'admin-status-item' }, [
                createElement('div', { className: 'admin-status-item__info' }, [
                  createElement('span', {
                    className: getOrderBadgeClass(entry.status),
                    text: ORDER_STATUS_LABELS[entry.status] || entry.status,
                  }),
                  createElement('span', {
                    className: 'text-sm',
                    text: `${entry.count} ${entry.count === 1 ? 'orden' : 'órdenes'}`,
                  }),
                ]),
                createElement('strong', {
                  className: 'text-sm',
                  text: formatCurrency(entry.total),
                }),
              ])
            )
          )
        : createElement('p', {
            className: 'text-sm',
            text: 'Sin órdenes registradas por estado.',
          });

    const ordersStatusCard = createElement('section', { className: 'card admin-analytics-card' }, [
      createElement('div', { className: 'admin-panel__header' }, [
        createElement('h3', { text: 'Estado de Órdenes' }),
        createElement('button', {
          className: 'btn btn--outline btn--sm',
          text: 'Ver órdenes',
          attrs: { type: 'button' },
          events: {
            click: () => switchTab('orders'),
          },
        }),
      ]),
      statusList,
    ]);

    const analyticsGrid = createElement('div', { className: 'admin-analytics-grid' }, [
      topProductsCard,
      ordersStatusCard,
    ]);

    const lowStockCard = createElement('section', { className: 'card admin-analytics-card' }, [
      createElement('div', { className: 'admin-panel__header' }, [
        createElement('div', {}, [
          createElement('h3', { text: 'Alertas de Stock Bajo' }),
          createElement('p', {
            className: 'text-xs',
            text: 'Productos con inventario disponible menor o igual a 15 unidades.',
          }),
        ]),
        createElement('button', {
          className: 'btn btn--primary btn--sm',
          text: 'Ir a Productos',
          attrs: { type: 'button' },
          events: {
            click: () => switchTab('products'),
          },
        }),
      ]),
      lowStockAlerts.length > 0
        ? buildTable(
            ['SKU', 'Producto', 'Stock Disponible', 'Acción'],
            lowStockAlerts.map((item) =>
              createElement('tr', {}, [
                createElement('td', { text: item.sku }),
                createElement('td', {}, [createElement('strong', { text: item.title })]),
                createElement('td', {}, [
                  createElement('span', {
                    className:
                      item.stockAvailable <= 5 ? 'badge badge--danger' : 'badge badge--warning',
                    text: `${item.stockAvailable} uds.`,
                  }),
                ]),
                createElement('td', {}, [
                  createElement('button', {
                    className: 'btn btn--outline btn--sm',
                    text: 'Reabastecer',
                    attrs: { type: 'button' },
                    events: {
                      click: () => switchTab('products'),
                    },
                  }),
                ]),
              ])
            )
          )
        : createElement('p', {
            className: 'text-sm',
            text: 'Todo el inventario se encuentra por encima del umbral de 15 unidades.',
          }),
    ]);

    clearElement(analyticsRoot);
    analyticsRoot.appendChild(kpiGrid);
    analyticsRoot.appendChild(analyticsGrid);
    analyticsRoot.appendChild(lowStockCard);
  }

  async function loadProductFormOptions() {
    if (!prodCategorySelect && !prodBrandSelect) return;

    const [categories, brands] = await Promise.all([
      productService.fetchCategories(),
      productService.fetchBrands(),
    ]);

    if (prodCategorySelect) {
      clearElement(prodCategorySelect);
      if (Array.isArray(categories) && categories.length > 0) {
        for (const cat of categories) {
          prodCategorySelect.appendChild(
            createElement('option', {
              text: cat.name || cat.id,
              attrs: { value: cat.id },
            })
          );
        }
      } else {
        prodCategorySelect.appendChild(
          createElement('option', { text: 'Cuadernos y Libretas', attrs: { value: 'cuadernos' } })
        );
      }
    }

    if (prodBrandSelect) {
      clearElement(prodBrandSelect);
      prodBrandSelect.appendChild(
        createElement('option', { text: 'Selecciona una marca...', attrs: { value: '' } })
      );
      if (Array.isArray(brands) && brands.length > 0) {
        for (const brand of brands) {
          const brandName = typeof brand === 'string' ? brand : brand.name || brand.id;
          prodBrandSelect.appendChild(
            createElement('option', {
              text: brandName,
              attrs: { value: brandName },
            })
          );
        }
      }
    }
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

    if (tabKey === 'analytics') loadAnalytics();
    if (tabKey === 'products') loadProducts();
    if (tabKey === 'orders') loadOrders();
    if (tabKey === 'tickets') loadTickets();
    if (tabKey === 'users') loadUsers();
  }

  for (const btn of tabButtons) {
    btn.addEventListener('click', () => {
      switchTab(btn.dataset.tab || 'analytics');
    });
  }

  if (refreshAnalyticsBtn) refreshAnalyticsBtn.addEventListener('click', loadAnalytics);
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
      const unitLabel = String(data.get('unitLabel') || 'unidad').trim() || 'unidad';
      const unitsPerPackRaw = Number(data.get('unitsPerPack'));
      const unitsPerPack =
        Number.isFinite(unitsPerPackRaw) && unitsPerPackRaw >= 1 ? Math.floor(unitsPerPackRaw) : 1;
      const shortDescription = String(data.get('shortDescription') || '');
      const isActive = Boolean(data.get('isActive'));

      const optionalAttrKeys = [
        'ruling_type',
        'sheet_count',
        'paper_weight_gsm',
        'education_level',
      ];
      const attributes = [];
      for (const key of optionalAttrKeys) {
        const val = String(data.get(key) || '').trim();
        if (val) {
          attributes.push({ key, value: val });
        }
      }

      if (
        !isRequired(sku) ||
        !isRequired(title) ||
        !isRequired(brandName) ||
        !isRequired(categorySlug) ||
        !Number.isFinite(price) ||
        price <= 0 ||
        !Number.isFinite(stockAvailable) ||
        stockAvailable < 0
      ) {
        setSafeText(
          productError,
          'Completa SKU, nombre, marca, categoría, precio mayor a 0 y stock válido.'
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
        unitLabel,
        unitsPerPack,
        shortDescription,
        isActive,
        attributes,
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
    loadProductFormOptions();
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
