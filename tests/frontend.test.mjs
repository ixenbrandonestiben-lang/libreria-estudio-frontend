import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  isRequired,
  isValidEmail,
  isStrongPassword,
  isValidPhone,
  isValidPostalCode
} from '../src/utils/validators.js';

import {
  formatCurrency,
  formatDate,
  formatTimer,
  truncateText
} from '../src/utils/formatters.js';

describe('validators.js', () => {
  it('isRequired validates non-empty trimmed values', () => {
    assert.equal(isRequired('hola'), true);
    assert.equal(isRequired('  a  '), true);
    assert.equal(isRequired('   '), false);
    assert.equal(isRequired(''), false);
    assert.equal(isRequired(null), false);
    assert.equal(isRequired(undefined), false);
  });

  it('isValidEmail validates standard email addresses', () => {
    assert.equal(isValidEmail('estudiante@libreria.mx'), true);
    assert.equal(isValidEmail('  docente.1@escuela.edu.mx '), true);
    assert.equal(isValidEmail('sin-arroba.com'), false);
    assert.equal(isValidEmail('usuario@dominio'), false);
    assert.equal(isValidEmail(''), false);
  });

  it('isStrongPassword requires >=8 chars with at least one letter and one digit', () => {
    assert.equal(isStrongPassword('Clave123'), true);
    assert.equal(isStrongPassword('ab123456'), true);
    assert.equal(isStrongPassword('Corta1'), false);
    assert.equal(isStrongPassword('SoloLetras'), false);
    assert.equal(isStrongPassword('12345678'), false);
    assert.equal(isStrongPassword(null), false);
  });

  it('isValidPhone accepts 10 to 15 digits ignoring formatting characters', () => {
    assert.equal(isValidPhone('5512345678'), true);
    assert.equal(isValidPhone('+52 (55) 1234-5678'), true);
    assert.equal(isValidPhone('12345'), false);
    assert.equal(isValidPhone('1234567890123456'), false);
  });

  it('isValidPostalCode requires exactly 5 digits', () => {
    assert.equal(isValidPostalCode('06600'), true);
    assert.equal(isValidPostalCode(' 12345 '), true);
    assert.equal(isValidPostalCode('1234'), false);
    assert.equal(isValidPostalCode('123456'), false);
    assert.equal(isValidPostalCode('ABCDE'), false);
  });
});

describe('formatters.js', () => {
  it('formatCurrency formats valid numbers and falls back safely for invalid input', () => {
    const mxn = formatCurrency(125.5, 'MXN');
    assert.match(mxn, /125\.50/);

    const fallback = formatCurrency('no-numero', 'MXN');
    assert.match(fallback, /0\.00/);

    const invalidCurrency = formatCurrency(50, 'INVALID_CODE');
    assert.equal(invalidCurrency, '$50.00');
  });

  it('formatDate formats valid ISO dates and returns em-dash for invalid/empty', () => {
    assert.equal(formatDate(''), '—');
    assert.equal(formatDate(null), '—');
    assert.equal(formatDate('fecha-invalida'), '—');
    const formatted = formatDate('2026-05-15T12:00:00Z');
    assert.match(formatted, /2026/);
  });

  it('formatTimer formats seconds as MM:SS and clamps negatives to 00:00', () => {
    assert.equal(formatTimer(0), '00:00');
    assert.equal(formatTimer(65), '01:05');
    assert.equal(formatTimer(1200), '20:00');
    assert.equal(formatTimer(-10), '00:00');
    assert.equal(formatTimer('abc'), '00:00');
  });

  it('truncateText truncates strings longer than maxLength with ellipsis', () => {
    assert.equal(truncateText('Corto', 10), 'Corto');
    assert.equal(truncateText('1234567890', 10), '1234567890');
    assert.equal(truncateText('12345678901', 10), '123456789…');
    assert.equal(truncateText(null, 10), '');
  });
});

function withDomMocks(fn) {
  const prevWindow = globalThis.window;
  const prevDocument = globalThis.document;
  const prevNode = globalThis.Node;
  const prevFetch = globalThis.fetch;

  class MockNode {}
  function makeEl(tag) {
    const el = new MockNode();
    el.tagName = tag.toUpperCase();
    el.children = [];
    el.attrs = {};
    el.dataset = {};
    el.listeners = {};
    el.className = '';
    el.textContent = '';
    el.value = '';
    el.checked = false;
    el.disabled = false;
    el.classList = { add() {}, remove() {}, toggle() {} };
    el.setAttribute = (k, v) => {
      el.attrs[k] = v;
      if (k === 'value') el.value = v;
      if (k === 'checked') el.checked = true;
      if (k === 'disabled') el.disabled = true;
    };
    el.getAttribute = (k) => el.attrs[k];
    el.addEventListener = (ev, cb) => {
      (el.listeners[ev] ||= []).push(cb);
    };
    el.appendChild = (c) => {
      el.children.push(c);
      return c;
    };
    el.removeChild = (c) => {
      const idx = el.children.indexOf(c);
      if (idx >= 0) el.children.splice(idx, 1);
    };
    Object.defineProperty(el, 'firstChild', {
      get() {
        return el.children[0] || null;
      },
    });
    el.contains = () => false;
    return el;
  }

  const storage = {};
  globalThis.Node = MockNode;
  globalThis.window = {
    location: { pathname: '/src/pages/list-builder.html', search: '', origin: 'http://localhost:8080' },
    localStorage: {
      getItem: (k) => (k in storage ? storage[k] : null),
      setItem: (k, v) => {
        storage[k] = String(v);
      },
      removeItem: (k) => {
        delete storage[k];
      },
    },
    addEventListener() {},
  };
  globalThis.document = {
    body: { dataset: { page: 'list-builder' } },
    createElement: makeEl,
    createTextNode: (t) => {
      const n = new MockNode();
      n.textContent = String(t);
      return n;
    },
    addEventListener() {},
  };

  return Promise.resolve()
    .then(() => fn({ makeEl }))
    .finally(() => {
      globalThis.window = prevWindow;
      globalThis.document = prevDocument;
      globalThis.Node = prevNode;
      globalThis.fetch = prevFetch;
    });
}

describe('schoolListService & SchoolListItemRow regression', () => {
  it('sends rawText to /school-lists/quote and normalizes backend items including not_found', async () => {
    await withDomMocks(async () => {
      let sentBody = null;
      globalThis.fetch = async (_url, opts) => {
        sentBody = JSON.parse(opts.body);
        return {
          ok: true,
          status: 200,
          headers: { get: () => null },
          json: async () => ({
            success: true,
            data: {
              items: [
                {
                  requestedLine: '2 Cuadernos A4',
                  quantity: 2,
                  matchStatus: 'exact_match',
                  selectedProduct: {
                    id: 1,
                    title: 'Cuaderno Norma',
                    brand_name: 'Norma',
                    category_slug: 'cuadernos-y-papel',
                    price: '4.50',
                    stock_available: 100,
                    image_url: '/assets/images/products/placeholder-product.webp',
                  },
                  alternativeProducts: [
                    {
                      id: 2,
                      title: 'Cuaderno Scribe',
                      brand_name: 'Scribe',
                      category_slug: 'cuadernos-y-papel',
                      price: '3.80',
                      stock_available: 50,
                    },
                  ],
                },
                {
                  requestedLine: '1 Producto inexistente',
                  quantity: 1,
                  matchStatus: 'not_found',
                  selectedProduct: null,
                  alternativeProducts: [],
                },
              ],
            },
          }),
        };
      };

      const { schoolListService } = await import('../src/services/schoolListService.js');
      const { createSchoolListItemRow } = await import('../src/components/SchoolListItemRow.js');

      const res = await schoolListService.quoteRawText('2 Cuadernos A4\n1 Producto inexistente');
      assert.equal(sentBody.rawText, '2 Cuadernos A4\n1 Producto inexistente');
      assert.equal(res.success, true);
      assert.equal(res.data.items.length, 2);
      assert.equal(res.data.items[0].selectedProduct.name, 'Cuaderno Norma');
      assert.equal(res.data.items[0].alternatives.length, 2);
      assert.equal(res.data.items[1].selectedProduct, null);
      assert.equal(res.data.items[1].included, false);

      // Should render both matched and not_found rows without throwing
      assert.doesNotThrow(() => {
        for (const row of res.data.items) {
          createSchoolListItemRow(row, {
            onToggle() {},
            onChangeProduct() {},
            onChangeQty() {},
          });
        }
      });
    });
  });

  it('local fallback parses numbering, accents, plurals, and trailing quantities accurately', async () => {
    await withDomMocks(async () => {
      globalThis.fetch = async () => {
        throw new Error('offline');
      };
      const { schoolListService } = await import('../src/services/schoolListService.js');
      const res = await schoolListService.quoteRawText(
        '1. 2x lapices de colores\nCuaderno profesional x3'
      );
      assert.equal(res.data.items[0].qty, 2);
      assert.match(res.data.items[0].selectedProduct.name, /Lápices de Color/i);
      assert.equal(res.data.items[1].qty, 3);
      assert.match(res.data.items[1].selectedProduct.name, /Cuaderno/i);
    });
  });
});

describe('API contracts, Navbar, and Cart regression', () => {
  it('Navbar renders safely with backend user payload containing fullName instead of name', async () => {
    await withDomMocks(async ({ makeEl }) => {
      const { appStore } = await import('../src/state/appStore.js');
      const { mountNavbar } = await import('../src/components/Navbar.js');
      appStore.setAuth({ id: 1, fullName: 'Ana Pérez', email: 'ana@test.com', role: 'customer' }, 'tok');
      assert.doesNotThrow(() => {
        mountNavbar(makeEl('header'));
      });
      appStore.setAuth(null, null);
    });
  });

  it('productService maps sort/level and unwraps backend array response', async () => {
    await withDomMocks(async () => {
      let calledUrl = '';
      globalThis.fetch = async (url) => {
        calledUrl = url;
        return {
          ok: true,
          status: 200,
          headers: { get: () => null },
          json: async () => ({
            success: true,
            data: [
              {
                id: 1,
                sku: 'SKU-1',
                title: 'Cuaderno Norma',
                brand_name: 'Norma',
                category_slug: 'cuadernos-y-papel',
                price: '4.50',
                stock_available: 12,
                image_url: '/assets/images/products/placeholder-product.webp',
                attributes: [{ key: 'education_level', value: 'primaria', label: 'Primaria' }],
              },
            ],
            meta: { page: 1, limit: 8, total: 1, totalPages: 1 },
          }),
        };
      };

      const { productService } = await import('../src/services/productService.js');
      const res = await productService.getProducts({ sort: 'featured', level: 'Primaria', page: 1, limit: 8 });
      assert.match(calledUrl, /\/api\/v1\/products/);
      assert.match(calledUrl, /sort=newest/);
      assert.match(calledUrl, /education_level=primaria/);
      assert.equal(res.data.items.length, 1);
      assert.equal(res.data.items[0].name, 'Cuaderno Norma');
      assert.equal(res.data.items[0].image, 'src/assets/images/products/cuaderno.svg');
      assert.equal(res.data.pagination.total, 1);
    });
  });

  it('appStore.addToCart refuses out-of-stock products (stock === 0)', async () => {
    await withDomMocks(async () => {
      const { appStore } = await import('../src/state/appStore.js');
      appStore.clearCart();
      const added = appStore.addToCart({ id: 99, name: 'Agotado', price: 10, stock: 0 }, 1);
      assert.equal(added, false);
      assert.equal(appStore.getState().cart.length, 0);
    });
  });

  it('orderService.trackOrder sends orderNumber parameter to backend', async () => {
    await withDomMocks(async () => {
      let calledUrl = '';
      globalThis.fetch = async (url) => {
        calledUrl = url;
        return {
          ok: true,
          status: 200,
          headers: { get: () => null },
          json: async () => ({
            success: true,
            data: { order_number: 'LE-2026-0001', status: 'shipped', total_amount: '50.00', created_at: '2026-11-01T00:00:00Z' },
          }),
        };
      };
      const { orderService } = await import('../src/services/orderService.js');
      const res = await orderService.trackOrder('LE-2026-0001', 'test@ejemplo.com');
      assert.match(calledUrl, /orderNumber=LE-2026-0001/);
      assert.equal(res.success, true);
      assert.equal(res.data.id, 'LE-2026-0001');
      assert.equal(res.data.total, 50);
    });
  });
});

describe('adminService & Admin Navbar regression', () => {
  it('Navbar shows Panel Admin link only when user role is admin', async () => {
    await withDomMocks(async ({ makeEl }) => {
      const { appStore } = await import('../src/state/appStore.js');
      const { mountNavbar } = await import('../src/components/Navbar.js');

      const headerAdmin = makeEl('header');
      appStore.setAuth({ id: 1, fullName: 'Admin User', email: 'admin@test.com', role: 'admin' }, 'tok');
      mountNavbar(headerAdmin);

      const collectLinks = (node) => {
        const list = [];
        if (node.tagName === 'A') list.push(node.textContent);
        for (const child of node.children || []) {
          list.push(...collectLinks(child));
        }
        return list;
      };

      const adminLinks = collectLinks(headerAdmin);
      assert.ok(adminLinks.includes('Panel Admin'));

      const headerCustomer = makeEl('header');
      appStore.setAuth({ id: 2, fullName: 'Cliente', email: 'cli@test.com', role: 'customer' }, 'tok2');
      mountNavbar(headerCustomer);
      const customerLinks = collectLinks(headerCustomer);
      assert.equal(customerLinks.includes('Panel Admin'), false);

      appStore.setAuth(null, null);
    });
  });

  it('adminService consumes backend admin endpoints and PATCH /orders/:orderNumber/status', async () => {
    await withDomMocks(async () => {
      const calls = [];
      globalThis.fetch = async (url, opts = {}) => {
        calls.push({ url, method: opts.method || 'GET', body: opts.body ? JSON.parse(opts.body) : null });

        if (url.endsWith('/admin/products')) {
          return {
            ok: true,
            status: 200,
            headers: { get: () => null },
            json: async () => ({
              success: true,
              data: [
                {
                  id: 10,
                  sku: 'SKU-ADM',
                  title: 'Cuaderno Admin',
                  brand_name: 'Scribe',
                  category_slug: 'cuadernos',
                  price: '85.00',
                  stock_available: 20,
                  is_active: true,
                },
              ],
            }),
          };
        }

        if (url.endsWith('/orders/LE-2026-0999/status')) {
          return {
            ok: true,
            status: 200,
            headers: { get: () => null },
            json: async () => ({
              success: true,
              data: {
                id: 99,
                order_number: 'LE-2026-0999',
                customer_email: 'cliente@test.com',
                total_amount: '150.00',
                status: 'shipped',
                created_at: '2026-11-20T12:00:00Z',
              },
            }),
          };
        }

        if (url.endsWith('/admin/users/5')) {
          return {
            ok: true,
            status: 200,
            headers: { get: () => null },
            json: async () => ({
              success: true,
              data: { id: 5, full_name: 'Docente', email: 'doc@test.com', role: 'admin', is_active: true },
            }),
          };
        }

        return {
          ok: true,
          status: 200,
          headers: { get: () => null },
          json: async () => ({ success: true, data: [] }),
        };
      };

      const { adminService } = await import('../src/services/adminService.js');

      const prodRes = await adminService.getProducts();
      assert.equal(prodRes.success, true);
      assert.equal(prodRes.isDemo, false);
      assert.equal(prodRes.data[0].name, 'Cuaderno Admin');
      assert.equal(prodRes.data[0].stock, 20);

      const orderRes = await adminService.updateOrderStatus('LE-2026-0999', 'shipped');
      assert.equal(orderRes.success, true);
      assert.equal(orderRes.data.status, 'shipped');
      assert.equal(calls[1].method, 'PATCH');
      assert.deepEqual(calls[1].body, { status: 'shipped' });

      const userRes = await adminService.updateUser(5, { role: 'admin', isActive: true });
      assert.equal(userRes.success, true);
      assert.equal(userRes.data.role, 'admin');
    });
  });

  it('adminService falls back to local demo mode when NETWORK_OFFLINE', async () => {
    await withDomMocks(async () => {
      globalThis.fetch = async () => {
        throw new Error('offline');
      };

      const { adminService } = await import('../src/services/adminService.js');

      const prods = await adminService.getProducts();
      assert.equal(prods.success, true);
      assert.equal(prods.isDemo, true);
      assert.ok(prods.data.length > 0);

      const created = await adminService.createProduct({
        sku: 'DEMO-01',
        title: 'Regla Demo',
        brandName: 'Maped',
        categorySlug: 'arte',
        price: 45,
        stockAvailable: 10,
      });
      assert.equal(created.success, true);
      assert.equal(created.isDemo, true);
      assert.equal(created.data.sku, 'DEMO-01');

      const orders = await adminService.getOrders();
      assert.equal(orders.success, true);
      assert.equal(orders.isDemo, true);
      const firstOrder = orders.data[0];
      const updatedOrder = await adminService.updateOrderStatus(firstOrder.orderNumber, 'delivered');
      assert.equal(updatedOrder.success, true);
      assert.equal(updatedOrder.data.status, 'delivered');

      const tickets = await adminService.getTickets();
      assert.equal(tickets.success, true);
      assert.equal(tickets.isDemo, true);
      const updatedTicket = await adminService.updateTicketStatus(tickets.data[0].id, 'resolved');
      assert.equal(updatedTicket.success, true);
      assert.equal(updatedTicket.data.status, 'resolved');

      const users = await adminService.getUsers();
      assert.equal(users.success, true);
      assert.equal(users.isDemo, true);
      const updatedUser = await adminService.updateUser(users.data[1].id, { role: 'admin', isActive: false });
      assert.equal(updatedUser.success, true);
      assert.equal(updatedUser.data.role, 'admin');
      assert.equal(updatedUser.data.isActive, false);
    });
  });
});
