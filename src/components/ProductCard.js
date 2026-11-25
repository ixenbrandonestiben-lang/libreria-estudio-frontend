import { cartService } from '../services/cartService.js';
import { resolveAssetUrl, resolvePageUrl } from '../utils/constants.js';
import { createElement } from '../utils/domSanitizer.js';
import { formatCurrency } from '../utils/formatters.js';

export function createProductCard(product) {
  const inStock = Number(product.stock) > 0;
  const specValues = Object.entries(product.specs || {})
    .filter(([, v]) => v && v !== 'N/A')
    .slice(0, 2);

  const media = createElement('div', { className: 'product-card__media' }, [
    createElement('span', {
      className: `badge product-card__stock-badge ${inStock ? 'badge--success' : 'badge--danger'}`,
      text: inStock ? `Disponible (${product.stock})` : 'Agotado',
    }),
    createElement('img', {
      className: 'product-card__img',
      attrs: {
        src: resolveAssetUrl(product.image),
        alt: product.name,
        width: 220,
        height: 165,
        loading: 'lazy',
      },
    }),
  ]);

  const titleLink = createElement('a', {
    className: 'product-card__title',
    text: product.name,
    attrs: { href: resolvePageUrl('product', { id: product.id }) },
  });

  const specsWrap = createElement(
    'div',
    { className: 'product-card__specs' },
    specValues.map(([, value]) =>
      createElement('span', { className: 'badge badge--neutral', text: value })
    )
  );

  const addBtn = createElement('button', {
    className: 'btn btn--primary btn--sm',
    text: inStock ? 'Agregar' : 'Sin stock',
    attrs: { type: 'button', disabled: !inStock },
    events: {
      click: () => cartService.addItem(product, 1),
    },
  });

  const footer = createElement('div', { className: 'product-card__footer' }, [
    createElement('span', {
      className: 'product-card__price',
      text: formatCurrency(product.price),
    }),
    addBtn,
  ]);

  const body = createElement('div', { className: 'product-card__body' }, [
    createElement('span', { className: 'product-card__brand', text: product.brand }),
    titleLink,
    specsWrap,
    footer,
  ]);

  return createElement('article', { className: 'product-card' }, [media, body]);
}
