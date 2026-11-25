import { appStore } from '../state/appStore.js';
import { clearElement, createElement } from '../utils/domSanitizer.js';

export function mountToastNotification(container) {
  if (!container) return;

  function render(state) {
    clearElement(container);
    container.className = 'toast-container';
    container.setAttribute('aria-live', 'polite');

    for (const toast of state.toasts) {
      const item = createElement(
        'div',
        {
          className: `toast toast--${toast.type || 'info'}`,
          attrs: { role: 'status' },
        },
        [
          createElement('span', { text: toast.message }),
          createElement('button', {
            className: 'btn btn--ghost btn--sm',
            text: '✕',
            attrs: { type: 'button', 'aria-label': 'Cerrar notificación' },
            events: { click: () => appStore.dismissToast(toast.id) },
          }),
        ]
      );
      container.appendChild(item);
    }
  }

  render(appStore.getState());
  appStore.subscribe(render);
}
