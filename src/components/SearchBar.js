import { productService } from '../services/productService.js';
import { resolvePageUrl, SEARCH_DEBOUNCE_MS } from '../utils/constants.js';
import { clearElement, createElement } from '../utils/domSanitizer.js';
import { formatCurrency } from '../utils/formatters.js';

/**
 * Buscador predictivo con debounce de 300ms y cancelación de peticiones con AbortController.
 */
export function createSearchBar({ placeholder = 'Buscar cuadernos, plumas, calculadoras...', initialValue = '' } = {}) {
  const wrapper = createElement('div', { className: 'search-bar' });
  const resultsBox = createElement('div', {
    className: 'search-bar__results hidden',
    attrs: { role: 'listbox', 'aria-label': 'Sugerencias de productos' },
  });

  const input = createElement('input', {
    className: 'search-bar__input',
    attrs: {
      type: 'search',
      placeholder,
      value: initialValue,
      'aria-label': 'Buscar útiles escolares y papelería',
      autocomplete: 'off',
    },
  });

  const submitBtn = createElement('button', {
    className: 'search-bar__submit',
    text: 'Buscar',
    attrs: { type: 'submit' },
  });

  const form = createElement(
    'form',
    {
      className: 'search-bar__form',
      attrs: { role: 'search' },
      events: {
        submit: (e) => {
          e.preventDefault();
          const q = input.value.trim();
          window.location.href = resolvePageUrl('catalog', q ? { q } : null);
        },
      },
    },
    [input, submitBtn]
  );

  let debounceTimer = null;
  let activeController = null;

  function hideResults() {
    resultsBox.classList.add('hidden');
  }

  function renderResults(items, query) {
    clearElement(resultsBox);
    if (!query) {
      hideResults();
      return;
    }

    if (items.length === 0) {
      resultsBox.appendChild(
        createElement('div', {
          className: 'search-bar__empty',
          text: `Sin resultados para "${query}". Intenta con otra palabra.`,
        })
      );
      resultsBox.classList.remove('hidden');
      return;
    }

    for (const item of items) {
      const row = createElement(
        'a',
        {
          className: 'search-bar__item',
          attrs: {
            href: resolvePageUrl('product', { id: item.id }),
            role: 'option',
          },
        },
        [
          createElement('div', {}, [
            createElement('div', { className: 'search-bar__item-title', text: item.name }),
            createElement('div', {
              className: 'search-bar__item-meta',
              text: `${item.brand} · ${item.level}`,
            }),
          ]),
          createElement('span', {
            className: 'search-bar__item-price',
            text: formatCurrency(item.price),
          }),
        ]
      );
      resultsBox.appendChild(row);
    }

    resultsBox.classList.remove('hidden');
  }

  input.addEventListener('input', () => {
    const query = input.value.trim();
    clearTimeout(debounceTimer);
    if (activeController) {
      activeController.abort();
    }

    if (query.length < 2) {
      hideResults();
      return;
    }

    debounceTimer = setTimeout(async () => {
      activeController = new AbortController();
      const res = await productService.searchProducts(query, activeController.signal);
      if (res.success && res.data?.items) {
        renderResults(res.data.items, query);
      }
    }, SEARCH_DEBOUNCE_MS);
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      hideResults();
    }
  });

  document.addEventListener('click', (e) => {
    if (!wrapper.contains(e.target)) {
      hideResults();
    }
  });

  wrapper.appendChild(form);
  wrapper.appendChild(resultsBox);
  return wrapper;
}
