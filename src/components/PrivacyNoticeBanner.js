import { cookieService } from '../services/privacyConsentService.js';
import { appStore } from '../state/appStore.js';
import { resolvePageUrl } from '../utils/constants.js';
import { clearElement, createElement } from '../utils/domSanitizer.js';

export function mountCookieBanner(container) {
  if (!container) return;

  function render(state) {
    clearElement(container);
    if (state.cookieConsent) return;

    const textCol = createElement('div', {}, [
      createElement('strong', { text: 'Tu privacidad en Librería Estudio' }),
      createElement('p', {
        className: 'text-sm',
        text: 'Usamos cookies esenciales para tu carrito y reserva de stock, y opcionales para recordar tu nivel escolar. Consulta nuestra ',
      }, [
        createElement('a', {
          className: 'navbar__link',
          text: 'Política de Cookies',
          attrs: { href: resolvePageUrl('cookiesPolicy') },
        }),
        '.',
      ]),
    ]);

    const actions = createElement('div', { className: 'cookie-banner__actions' }, [
      createElement('button', {
        className: 'btn btn--outline btn--sm',
        text: 'Configurar',
        attrs: { type: 'button' },
        events: { click: () => appStore.setCookieModalOpen(true) },
      }),
      createElement('button', {
        className: 'btn btn--ghost btn--sm',
        text: 'Rechazar opcionales',
        attrs: { type: 'button' },
        events: {
          click: () => {
            cookieService.rejectNonEssential();
            appStore.showToast('Solo cookies esenciales activas.', 'info');
          },
        },
      }),
      createElement('button', {
        className: 'btn btn--primary btn--sm',
        text: 'Aceptar todas',
        attrs: { type: 'button' },
        events: {
          click: () => {
            cookieService.acceptAll();
            appStore.showToast('Preferencias de cookies guardadas.', 'success');
          },
        },
      }),
    ]);

    container.appendChild(
      createElement(
        'aside',
        {
          className: 'cookie-banner',
          attrs: { role: 'region', 'aria-label': 'Aviso de cookies' },
        },
        [textCol, actions]
      )
    );
  }

  render(appStore.getState());
  appStore.subscribe(render);
}
