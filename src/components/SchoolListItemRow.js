import { createElement } from '../utils/domSanitizer.js';
import { formatCurrency } from '../utils/formatters.js';

export function createSchoolListItemRow(row, { onToggle, onChangeProduct, onChangeQty }) {
  const checkbox = createElement('input', {
    attrs: {
      type: 'checkbox',
      checked: row.included,
      'aria-label': `Incluir ${row.requestedText}`,
    },
    events: { change: (e) => onToggle(row.id, e.target.checked) },
  });

  const requestedCol = createElement('div', {}, [
    createElement('div', { className: 'text-sm', text: row.requestedText }),
    createElement('span', {
      className: 'badge badge--secondary',
      text: row.selectedProduct.brand,
    }),
  ]);

  const select = createElement(
    'select',
    {
      className: 'form-select',
      attrs: { 'aria-label': `Producto asignado para ${row.requestedText}` },
      events: { change: (e) => onChangeProduct(row.id, e.target.value) },
    },
    row.alternatives.map((alt) =>
      createElement('option', {
        text: `${alt.name} (${formatCurrency(alt.price)})`,
        attrs: { value: alt.id, selected: alt.id === row.selectedProduct.id },
      })
    )
  );

  const qtyInput = createElement('input', {
    className: 'form-input',
    attrs: {
      type: 'number',
      min: '1',
      max: '50',
      value: String(row.qty),
      'aria-label': `Cantidad para ${row.requestedText}`,
    },
    events: {
      change: (e) => onChangeQty(row.id, Math.max(1, Number(e.target.value) || 1)),
    },
  });

  const subtotalCol = createElement('strong', {
    text: formatCurrency(row.included ? row.selectedProduct.price * row.qty : 0),
  });

  return createElement('div', { className: 'list-row' }, [
    checkbox,
    requestedCol,
    select,
    qtyInput,
    subtotalCol,
  ]);
}
