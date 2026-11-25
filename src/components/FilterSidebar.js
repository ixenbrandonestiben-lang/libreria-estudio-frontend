import { clearElement, createElement } from '../utils/domSanitizer.js';

export function renderFilterSidebar(container, { categories, brands, filters, onChange, onReset }) {
  if (!container) return;
  clearElement(container);

  const aside = createElement('aside', {
    className: 'filter-sidebar',
    attrs: { 'aria-label': 'Filtros técnicos de librería' },
  });

  const header = createElement('div', { className: 'filter-sidebar__header' }, [
    createElement('h2', { text: 'Filtros', className: 'text-lg' }),
    createElement('button', {
      className: 'btn btn--ghost btn--sm',
      text: 'Limpiar',
      attrs: { type: 'button' },
      events: { click: onReset },
    }),
  ]);
  aside.appendChild(header);

  // Categoría
  const catSelect = createElement(
    'select',
    {
      className: 'form-select',
      attrs: { id: 'filter-category', 'aria-label': 'Filtrar por categoría' },
      events: { change: (e) => onChange({ category: e.target.value, page: 1 }) },
    },
    [
      createElement('option', { text: 'Todas las categorías', attrs: { value: '' } }),
      ...categories.map((c) =>
        createElement('option', {
          text: c.name,
          attrs: { value: c.id, selected: filters.category === c.id },
        })
      ),
    ]
  );

  aside.appendChild(
    createElement('div', { className: 'filter-sidebar__group' }, [
      createElement('label', {
        className: 'filter-sidebar__group-title',
        text: 'Categoría',
        attrs: { for: 'filter-category' },
      }),
      catSelect,
    ])
  );

  // Marca
  const brandSelect = createElement(
    'select',
    {
      className: 'form-select',
      attrs: { id: 'filter-brand', 'aria-label': 'Filtrar por marca' },
      events: { change: (e) => onChange({ brand: e.target.value, page: 1 }) },
    },
    [
      createElement('option', { text: 'Todas las marcas', attrs: { value: '' } }),
      ...brands.map((b) =>
        createElement('option', {
          text: b,
          attrs: { value: b, selected: filters.brand === b },
        })
      ),
    ]
  );

  aside.appendChild(
    createElement('div', { className: 'filter-sidebar__group' }, [
      createElement('label', {
        className: 'filter-sidebar__group-title',
        text: 'Marca',
        attrs: { for: 'filter-brand' },
      }),
      brandSelect,
    ])
  );

  // Nivel Escolar
  const levels = ['Primaria', 'Secundaria', 'Preparatoria', 'Universidad'];
  const levelSelect = createElement(
    'select',
    {
      className: 'form-select',
      attrs: { id: 'filter-level', 'aria-label': 'Filtrar por nivel escolar' },
      events: { change: (e) => onChange({ level: e.target.value, page: 1 }) },
    },
    [
      createElement('option', { text: 'Todos los niveles', attrs: { value: '' } }),
      ...levels.map((lvl) =>
        createElement('option', {
          text: lvl,
          attrs: { value: lvl, selected: filters.level === lvl },
        })
      ),
    ]
  );

  aside.appendChild(
    createElement('div', { className: 'filter-sidebar__group' }, [
      createElement('label', {
        className: 'filter-sidebar__group-title',
        text: 'Nivel escolar',
        attrs: { for: 'filter-level' },
      }),
      levelSelect,
    ])
  );

  // Rango de Precio
  const minInput = createElement('input', {
    className: 'form-input',
    attrs: {
      type: 'number',
      min: '0',
      placeholder: 'Mín $',
      value: filters.minPrice || '',
      'aria-label': 'Precio mínimo',
    },
    events: {
      change: (e) => onChange({ minPrice: e.target.value, page: 1 }),
    },
  });

  const maxInput = createElement('input', {
    className: 'form-input',
    attrs: {
      type: 'number',
      min: '0',
      placeholder: 'Máx $',
      value: filters.maxPrice || '',
      'aria-label': 'Precio máximo',
    },
    events: {
      change: (e) => onChange({ maxPrice: e.target.value, page: 1 }),
    },
  });

  aside.appendChild(
    createElement('div', { className: 'filter-sidebar__group' }, [
      createElement('div', { className: 'filter-sidebar__group-title', text: 'Precio (MXN)' }),
      createElement('div', { className: 'filter-sidebar__range' }, [minInput, maxInput]),
    ])
  );

  // Solo en stock
  const stockCheck = createElement('input', {
    attrs: { type: 'checkbox', checked: Boolean(filters.inStockOnly), id: 'filter-stock' },
    events: { change: (e) => onChange({ inStockOnly: e.target.checked, page: 1 }) },
  });

  aside.appendChild(
    createElement('label', { className: 'form-check', attrs: { for: 'filter-stock' } }, [
      stockCheck,
      createElement('span', { text: 'Solo artículos con envío inmediato' }),
    ])
  );

  container.appendChild(aside);
}
