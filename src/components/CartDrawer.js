import { cartService } from '../services/cartService.js';
import { appStore } from '../state/appStore.js';
import { resolveAssetUrl, resolvePageUrl } from '../utils/constants.js';
import { clearElement, createElement } from '../utils/domSanitizer.js';
import { formatCurrency } from '../utils/formatters.js';
import { createReservationTimer } from './ReservationTimer.js';

export function mountCartDrawer(container) {
  if (!container) return;

  const timerNode = createReservationTimer();

  function render(state) {
    clearElement(container);
    if (!state.cartDrawerOpen) return;

    const backdrop = createElement('div', {
      className: 'cart-backdrop',
      events: { click: () => appStore.setCartDrawerOpen(false) },
    });

    const closeBtn = createElement('button', {
      className: 'btn btn--ghost btn--sm',
      text: 'Cerrar ✕',
      attrs: { type: 'button', 'aria-label': 'Cerrar carrito' },
      events: { click: () => appStore.setCartDrawerOpen(false) },
    });

    const header = createElement('div', { className: 'cart-drawer__header' }, [
      createElement('h2', { text: `Tu Carrito (${cartService.getTotalCount()})` }),
      closeBtn,
    ]);

    const timerWrap = createElement('div', { className: 'cart-drawer__timer' }, [timerNode]);

    const body = createElement('div', { className: 'cart-drawer__body' });

    if (state.cart.length === 0) {
      body.appendChild(
        createElement('p', {
          text: 'Aún no tienes útiles en tu carrito. Explora el catálogo o usa el Cotizador de Listas.',
        })
      );
    } else {
      for (const item of state.cart) {
        const row = createElement('div', { className: 'cart-drawer__item' }, [
          createElement('img', {
            className: 'cart-drawer__item-img',
            attrs: {
              src: resolveAssetUrl(item.image),
              alt: item.name,
              width: 64,
              height: 64,
            },
          }),
          createElement('div', {}, [
            createElement('div', { className: 'text-sm', text: item.name }),
            createElement('div', {
              className: 'text-xs text-muted',
              text: `${formatCurrency(item.price)} c/u`,
            }),
            createElement('div', { className: 'navbar__actions' }, [
              createElement('div', { className: 'cart-drawer__qty' }, [
                createElement('button', {
                  className: 'cart-drawer__qty-btn',
                  text: '−',
                  attrs: { type: 'button', 'aria-label': `Disminuir ${item.name}` },
                  events: { click: () => cartService.updateQuantity(item.id, -1) },
                }),
                createElement('span', {
                  className: 'cart-drawer__qty-val',
                  text: String(item.qty),
                }),
                createElement('button', {
                  className: 'cart-drawer__qty-btn',
                  text: '+',
                  attrs: { type: 'button', 'aria-label': `Aumentar ${item.name}` },
                  events: { click: () => cartService.updateQuantity(item.id, 1) },
                }),
              ]),
              createElement('button', {
                className: 'btn btn--ghost btn--sm',
                text: 'Quitar',
                attrs: { type: 'button' },
                events: { click: () => cartService.removeItem(item.id) },
              }),
            ]),
          ]),
        ]);
        body.appendChild(row);
      }
    }

    const subtotal = cartService.getSubtotal();
    const footer = createElement('div', { className: 'cart-drawer__footer' }, [
      createElement('div', { className: 'section__header--row' }, [
        createElement('span', { text: 'Subtotal estimado' }),
        createElement('strong', { text: formatCurrency(subtotal) }),
      ]),
      createElement('a', {
        className: `btn btn--primary btn--full${state.cart.length === 0 ? ' hidden' : ''}`,
        text: 'Finalizar compra',
        attrs: { href: resolvePageUrl('checkout') },
      }),
      createElement('a', {
        className: 'btn btn--outline btn--full',
        text: 'Cotizar Lista Escolar',
        attrs: { href: resolvePageUrl('listBuilder') },
      }),
    ]);

    const drawer = createElement(
      'aside',
      {
        className: 'cart-drawer',
        attrs: { role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Carrito de compras' },
      },
      [header, timerWrap, body, footer]
    );

    container.appendChild(backdrop);
    container.appendChild(drawer);
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && appStore.getState().cartDrawerOpen) {
      appStore.setCartDrawerOpen(false);
    }
  });

  render(appStore.getState());
  appStore.subscribe(render);
}
