import { resolveAssetUrl, resolvePageUrl } from '../utils/constants.js';
import { clearElement, createElement } from '../utils/domSanitizer.js';

export function renderCategoryGrid(container, categories) {
  if (!container) return;
  clearElement(container);

  const grid = createElement(
    'div',
    { className: 'grid grid--categories' },
    categories.map((cat) =>
      createElement(
        'a',
        {
          className: 'category-card',
          attrs: { href: resolvePageUrl('catalog', { category: cat.id }) },
        },
        [
          createElement('img', {
            className: 'category-card__img',
            attrs: {
              src: resolveAssetUrl(cat.image),
              alt: cat.name,
              width: 64,
              height: 48,
              loading: 'lazy',
            },
          }),
          createElement('h3', { className: 'category-card__title', text: cat.name }),
          createElement('span', {
            className: 'category-card__count',
            text: `${cat.count} artículos`,
          }),
        ]
      )
    )
  );

  container.appendChild(grid);
}
