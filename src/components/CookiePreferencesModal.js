import { cookieService } from '../services/cookieService.js';
import { appStore } from '../state/appStore.js';
import { COOKIE_CATEGORIES } from '../utils/constants.js';
import { clearElement, createElement } from '../utils/domSanitizer.js';

export function mountCookiePreferencesModal(container) {
  if (!container) return;

  function render(state) {
    clearElement(container);
    if (!state.cookieModalOpen) return;

    const current = state.cookieConsent || {
      essential: true,
      preferences: false,
      analytics: false,
      marketing: false,
    };

    const draft = { ...current };

    const items = COOKIE_CATEGORIES.map((cat) => {
      const checkbox = createElement('input', {
        attrs: {
          type: 'checkbox',
          checked: cat.required ? true : Boolean(draft[cat.id]),
          disabled: cat.required,
          id: `cookie-toggle-${cat.id}`,
        },
        events: {
          change: (e) => {
            draft[cat.id] = e.target.checked;
          },
        },
      });

      return createElement('div', { className: 'cookie-pref-item' }, [
        createElement('label', { attrs: { for: `cookie-toggle-${cat.id}` } }, [
          createElement('strong', { text: cat.title }),
          createElement('p', { className: 'text-xs', text: cat.description }),
        ]),
        checkbox,
      ]);
    });

    const modal = createElement(
      'div',
      {
        className: 'modal',
        attrs: {
          role: 'dialog',
          'aria-modal': 'true',
          'aria-labelledby': 'cookie-modal-title',
        },
      },
      [
        createElement('div', { className: 'modal__header' }, [
          createElement('h2', {
            text: 'Preferencias de Cookies',
            attrs: { id: 'cookie-modal-title' },
          }),
          createElement('button', {
            className: 'btn btn--ghost btn--sm',
            text: '✕',
            attrs: { type: 'button', 'aria-label': 'Cerrar configuración de cookies' },
            events: { click: () => appStore.setCookieModalOpen(false) },
          }),
        ]),
        createElement('div', { className: 'modal__body' }, items),
        createElement('div', { className: 'modal__footer' }, [
          createElement('button', {
            className: 'btn btn--outline',
            text: 'Solo esenciales',
            attrs: { type: 'button' },
            events: {
              click: () => {
                cookieService.rejectNonEssential();
                appStore.setCookieModalOpen(false);
                appStore.showToast('Solo cookies esenciales habilitadas.', 'info');
              },
            },
          }),
          createElement('button', {
            className: 'btn btn--primary',
            text: 'Guardar preferencias',
            attrs: { type: 'button' },
            events: {
              click: () => {
                cookieService.saveConsent(draft);
                appStore.setCookieModalOpen(false);
                appStore.showToast('Preferencias de cookies actualizadas.', 'success');
              },
            },
          }),
        ]),
      ]
    );

    const backdrop = createElement(
      'div',
      {
        className: 'modal-backdrop',
        events: {
          click: (e) => {
            if (e.target === backdrop) appStore.setCookieModalOpen(false);
          },
        },
      },
      [modal]
    );

    container.appendChild(backdrop);
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && appStore.getState().cookieModalOpen) {
      appStore.setCookieModalOpen(false);
    }
  });

  render(appStore.getState());
  appStore.subscribe(render);
}
