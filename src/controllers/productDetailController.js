import { cartService } from '../services/cartService.js';
import { productService } from '../services/productService.js';
import { resolveAssetUrl, resolvePageUrl } from '../utils/constants.js';
import { clearElement, createElement } from '../utils/domSanitizer.js';
import { formatCurrency } from '../utils/formatters.js';

export async function initProductDetailController() {
  const root = document.getElementById('product-detail-root');
  if (!root) return;

  const params = new URLSearchParams(window.location.search);
  const id = params.get('id') || 'prod-101';
  const res = await productService.getProductById(id);
  const product = res.data;

  clearElement(root);
  if (!product) {
    root.appendChild(createElement('p', { text: 'Producto no encontrado.' }));
    return;
  }

  document.title = `${product.name} | Librería Estudio`;

  const gallery = createElement('div', { className: 'product-detail__gallery' }, [
    createElement('img', {
      attrs: {
        src: resolveAssetUrl(product.image),
        alt: product.name,
        width: 320,
        height: 240,
      },
    }),
  ]);

  let qty = 1;
  const qtyInput = createElement('input', {
    className: 'form-input',
    attrs: { type: 'number', min: '1', max: String(product.stock || 20), value: '1' },
    events: {
      change: (e) => {
        qty = Math.max(1, Math.min(product.stock || 20, Number(e.target.value) || 1));
        qtyInput.value = String(qty);
      },
    },
  });

  const addBtn = createElement('button', {
    className: 'btn btn--primary btn--lg',
    text: product.stock > 0 ? 'Agregar al carrito' : 'Agotado',
    attrs: { type: 'button', disabled: product.stock <= 0 },
    events: { click: () => cartService.addItem(product, qty) },
  });

  const specsRows = Object.entries(product.specs || {}).map(([k, v]) =>
    createElement('tr', {}, [
      createElement('th', { text: k.charAt(0).toUpperCase() + k.slice(1) }),
      createElement('td', { text: v }),
    ])
  );

  const info = createElement('div', { className: 'card' }, [
    createElement('span', { className: 'badge badge--secondary', text: product.brand }),
    createElement('h1', { text: product.name }),
    createElement('p', {
      className: 'text-sm text-muted',
      text: `SKU: ${product.sku} · Nivel: ${product.level}`,
    }),
    createElement('p', { text: product.description }),
    createElement('div', { className: 'product-card__price', text: formatCurrency(product.price) }),
    createElement('div', { className: 'form-group' }, [
      createElement('label', { className: 'form-label', text: 'Cantidad' }),
      qtyInput,
    ]),
    createElement('div', { className: 'hero__actions' }, [
      addBtn,
      createElement('a', {
        className: 'btn btn--outline btn--lg',
        text: 'Volver al catálogo',
        attrs: { href: resolvePageUrl('catalog') },
      }),
    ]),
    createElement('h2', { text: 'Especificaciones técnicas' }),
    createElement('table', { className: 'product-detail__specs-table' }, [
      createElement('tbody', {}, specsRows),
    ]),
  ]);

  root.appendChild(createElement('div', { className: 'product-detail' }, [gallery, info]));
}
