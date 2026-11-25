import { appStore } from '../state/appStore.js';
import { resolvePageUrl } from '../utils/constants.js';
import { clearElement, createElement } from '../utils/domSanitizer.js';

export function mountFooter(container) {
  if (!container) return;
  clearElement(container);
  container.className = 'site-footer';

  const grid = createElement('div', { className: 'container site-footer__grid' }, [
    createElement('div', {}, [
      createElement('h2', { className: 'site-footer__title', text: 'Librería Estudio' }),
      createElement('p', {
        className: 'site-footer__text',
        text: 'Papelería técnica, libros y surtido escolar confiable para estudiantes, padres de familia y docentes.',
      }),
    ]),
    createElement('div', {}, [
      createElement('h3', { className: 'site-footer__title', text: 'Compra Escolar' }),
      createElement('ul', {}, [
        createElement('li', {}, [
          createElement('a', {
            className: 'site-footer__link',
            text: 'Catálogo completo',
            attrs: { href: resolvePageUrl('catalog') },
          }),
        ]),
        createElement('li', {}, [
          createElement('a', {
            className: 'site-footer__link',
            text: 'Cotizador de Listas',
            attrs: { href: resolvePageUrl('listBuilder') },
          }),
        ]),
        createElement('li', {}, [
          createElement('a', {
            className: 'site-footer__link',
            text: 'Mis Pedidos',
            attrs: { href: resolvePageUrl('orders') },
          }),
        ]),
      ]),
    ]),
    createElement('div', {}, [
      createElement('h3', { className: 'site-footer__title', text: 'Soporte' }),
      createElement('ul', {}, [
        createElement('li', {}, [
          createElement('a', {
            className: 'site-footer__link',
            text: 'Centro de Ayuda y Tickets',
            attrs: { href: resolvePageUrl('help') },
          }),
        ]),
        createElement('li', {}, [
          createElement('a', {
            className: 'site-footer__link',
            text: 'Rastrear Pedido',
            attrs: { href: resolvePageUrl('trackOrder') },
          }),
        ]),
        createElement('li', {}, [
          createElement('a', {
            className: 'site-footer__link',
            text: 'Mi Cuenta y Direcciones',
            attrs: { href: resolvePageUrl('account') },
          }),
        ]),
      ]),
    ]),
    createElement('div', {}, [
      createElement('h3', { className: 'site-footer__title', text: 'Legal y Privacidad' }),
      createElement('ul', {}, [
        createElement('li', {}, [
          createElement('a', {
            className: 'site-footer__link',
            text: 'Términos y Condiciones',
            attrs: { href: resolvePageUrl('terms') },
          }),
        ]),
        createElement('li', {}, [
          createElement('a', {
            className: 'site-footer__link',
            text: 'Aviso de Privacidad',
            attrs: { href: resolvePageUrl('privacy') },
          }),
        ]),
        createElement('li', {}, [
          createElement('a', {
            className: 'site-footer__link',
            text: 'Política de Cookies',
            attrs: { href: resolvePageUrl('cookiesPolicy') },
          }),
        ]),
        createElement('li', {}, [
          createElement('button', {
            className: 'site-footer__link',
            text: 'Configurar Cookies',
            attrs: { type: 'button' },
            events: { click: () => appStore.setCookieModalOpen(true) },
          }),
        ]),
      ]),
    ]),
  ]);

  const bottom = createElement('div', { className: 'container site-footer__bottom' }, [
    createElement('span', {
      text: `© ${new Date().getFullYear()} Librería Estudio. Todos los derechos reservados.`,
    }),
    createElement('span', { text: 'Atención a escuelas y familias · Envíos a todo el país' }),
  ]);

  container.appendChild(grid);
  container.appendChild(bottom);
}
