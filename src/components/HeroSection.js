import { resolveAssetUrl, resolvePageUrl } from '../utils/constants.js';
import { clearElement, createElement } from '../utils/domSanitizer.js';
import { createSearchBar } from './SearchBar.js';

export function mountHeroSection(container) {
  if (!container) return;
  clearElement(container);

  const searchBar = createSearchBar({
    placeholder: 'Ej. Cuaderno cuadro chico 90g, Calculadora Casio, Lápices HB...',
  });

  const leftCol = createElement('div', {}, [
    createElement('span', {
      className: 'hero__eyebrow',
      text: 'Para estudiantes, padres de familia y docentes',
    }),
    createElement('h1', {
      className: 'hero__title',
      text: 'Todo tu regreso a clases y papelería técnica en un solo lugar',
    }),
    createElement('p', {
      className: 'hero__subtitle',
      text: 'Encuentra útiles escolares con especificaciones claras, cotiza la lista completa de tu colegio en segundos y reserva tu inventario al instante.',
    }),
    createElement('div', { className: 'hero__search-wrap' }, [searchBar]),
    createElement('div', { className: 'hero__actions' }, [
      createElement('a', {
        className: 'btn btn--accent btn--lg',
        text: 'Cotizar Lista Escolar',
        attrs: { href: resolvePageUrl('listBuilder') },
      }),
      createElement('a', {
        className: 'btn btn--outline btn--lg',
        text: 'Explorar Catálogo',
        attrs: { href: resolvePageUrl('catalog') },
      }),
    ]),
    createElement('div', { className: 'hero__trust' }, [
      createElement('span', { className: 'hero__trust-item', text: '✓ Reserva de carrito 15 min' }),
      createElement('span', { className: 'hero__trust-item', text: '✓ Facturación electrónica' }),
      createElement('span', { className: 'hero__trust-item', text: '✓ Envío 24-48h' }),
    ]),
  ]);

  const rightCol = createElement('div', { className: 'hero__visual' }, [
    createElement('img', {
      className: 'hero__illustration',
      attrs: {
        src: resolveAssetUrl('src/assets/images/hero-illustration.svg'),
        alt: 'Ilustración de cuadernos, escuadras y lista escolar organizada',
        width: 520,
        height: 380,
      },
    }),
  ]);

  const section = createElement('section', { className: 'hero' }, [
    createElement('div', { className: 'container hero__grid' }, [leftCol, rightCol]),
  ]);

  container.appendChild(section);
}
