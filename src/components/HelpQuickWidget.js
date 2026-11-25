import { resolvePageUrl } from '../utils/constants.js';
import { clearElement, createElement } from '../utils/domSanitizer.js';

export function mountHelpQuickWidget(container) {
  if (!container) return;
  let open = false;

  function render() {
    clearElement(container);
    const wrap = createElement('div', { className: 'help-widget' });

    if (open) {
      wrap.appendChild(
        createElement(
          'div',
          {
            className: 'help-widget__panel',
            attrs: { role: 'dialog', 'aria-label': 'Centro de ayuda rápida' },
          },
          [
            createElement('strong', { text: '¿En qué te ayudamos?' }),
            createElement('a', {
              className: 'help-widget__link',
              text: 'Rastrear mi pedido',
              attrs: { href: resolvePageUrl('trackOrder') },
            }),
            createElement('a', {
              className: 'help-widget__link',
              text: 'Cotizar lista escolar',
              attrs: { href: resolvePageUrl('listBuilder') },
            }),
            createElement('a', {
              className: 'help-widget__link',
              text: 'Preguntas frecuentes y tickets',
              attrs: { href: resolvePageUrl('help') },
            }),
          ]
        )
      );
    }

    wrap.appendChild(
      createElement('button', {
        className: 'btn btn--secondary',
        text: open ? 'Cerrar ayuda' : '¿Necesitas ayuda?',
        attrs: { type: 'button', 'aria-expanded': String(open) },
        events: {
          click: () => {
            open = !open;
            render();
          },
        },
      })
    );

    container.appendChild(wrap);
  }

  render();
}
