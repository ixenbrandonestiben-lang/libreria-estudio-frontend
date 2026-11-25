import { createElement } from '../utils/domSanitizer.js';
import { formatCurrency } from '../utils/formatters.js';

const STATUS_META = {
  exact_match: { label: 'Coincidencia exacta', cls: 'badge--success' },
  alternative: { label: 'Alternativa', cls: 'badge--warning' },
  out_of_stock: { label: 'Sin stock', cls: 'badge--danger' },
  not_found: { label: 'Sin coincidencia', cls: 'badge--danger' },
};

export function createSchoolListItemRow(row, { onToggle, onChangeProduct, onChangeQty }) {
  const product = row.selectedProduct || null;
  const hasAvailableProduct = Boolean(product && Number(product.stock) > 0);
  const statusInfo = STATUS_META[row.matchStatus] || (product ? STATUS_META.exact_match : STATUS_META.not_found);
  const alternatives = Array.isArray(row.alternatives) ? row.alternatives : [];

  const checkbox = createElement('input', {
    attrs: {
      type: 'checkbox',
      checked: Boolean(row.included && product),
      disabled: !hasAvailableProduct,
      'aria-label': `Incluir ${row.requestedText}`,
    },
    events: { change: (e) => onToggle(row.id, e.target.checked) },
  });

  const badges = [
    createElement('span', {
      className: `badge ${statusInfo.cls}`,
      text: statusInfo.label,
    }),
  ];
  if (product?.brand) {
    badges.push(
      createElement('span', {
        className: 'badge badge--secondary',
        text: product.brand,
      })
    );
  }

  const requestedCol = createElement('div', {}, [
    createElement('div', { className: 'text-sm', text: row.requestedText }),
    createElement('div', { className: 'navbar__actions' }, badges),
  ]);

  const optionNodes = [];
  if (!product) {
    optionNodes.push(
      createElement('option', {
        text:
          alternatives.length > 0
            ? 'Selecciona un artículo sugerido...'
            : 'Sin producto disponible en catálogo',
        attrs: { value: '', selected: true, disabled: true },
      })
    );
  }

  for (const alt of alternatives) {
    optionNodes.push(
      createElement('option', {
        text: `${alt.name} (${formatCurrency(alt.price)})`,
        attrs: {
          value: String(alt.id),
          selected: Boolean(product && String(alt.id) === String(product.id)),
        },
      })
    );
  }

  const select = createElement(
    'select',
    {
      className: 'form-select',
      attrs: {
        disabled: alternatives.length === 0,
        'aria-label': `Producto asignado para ${row.requestedText}`,
      },
      events: { change: (e) => onChangeProduct(row.id, e.target.value) },
    },
    optionNodes
  );

  const qtyInput = createElement('input', {
    className: 'form-input',
    attrs: {
      type: 'number',
      min: '1',
      max: '100',
      disabled: !product,
      value: String(row.qty || 1),
      'aria-label': `Cantidad para ${row.requestedText}`,
    },
    events: {
      change: (e) => {
        const clamped = Math.min(100, Math.max(1, Math.floor(Number(e.target.value) || 1)));
        onChangeQty(row.id, clamped);
      },
    },
  });

  const lineAmount = row.included && product ? Number(product.price) * Number(row.qty || 1) : 0;
  const subtotalCol = createElement('strong', {
    text: formatCurrency(lineAmount),
  });

  return createElement('div', { className: 'list-row' }, [
    checkbox,
    requestedCol,
    select,
    qtyInput,
    subtotalCol,
  ]);
}
