import { clearElement, createElement } from '../utils/domSanitizer.js';

export function renderPaginationBar(container, { page, totalPages }, onPageChange) {
  if (!container) return;
  clearElement(container);

  if (!totalPages || totalPages <= 1) return;

  const nav = createElement('nav', {
    className: 'pagination',
    attrs: { 'aria-label': 'Paginación de resultados' },
  });

  const prevBtn = createElement('button', {
    className: 'pagination__btn',
    text: 'Anterior',
    attrs: { type: 'button', disabled: page <= 1 },
    events: { click: () => onPageChange(page - 1) },
  });
  nav.appendChild(prevBtn);

  for (let i = 1; i <= totalPages; i++) {
    const isCurrent = i === page;
    nav.appendChild(
      createElement('button', {
        className: `pagination__btn${isCurrent ? ' pagination__btn--active' : ''}`,
        text: String(i),
        attrs: {
          type: 'button',
          'aria-current': isCurrent ? 'page' : null,
        },
        events: { click: () => onPageChange(i) },
      })
    );
  }

  const nextBtn = createElement('button', {
    className: 'pagination__btn',
    text: 'Siguiente',
    attrs: { type: 'button', disabled: page >= totalPages },
    events: { click: () => onPageChange(page + 1) },
  });
  nav.appendChild(nextBtn);

  container.appendChild(nav);
}
