import { appStore } from '../state/appStore.js';
import { clearElement, createElement } from '../utils/domSanitizer.js';
import { formatTimer } from '../utils/formatters.js';

export function createReservationTimer() {
  const wrapper = createElement('div', { className: 'timer-badge', attrs: { role: 'status' } });

  function update() {
    clearElement(wrapper);
    const { cart, reservationExpiresAt } = appStore.getState();

    if (!cart.length || !reservationExpiresAt) {
      wrapper.className = 'timer-badge hidden';
      return;
    }

    const remainingSec = Math.max(0, Math.floor((reservationExpiresAt - Date.now()) / 1000));

    if (remainingSec === 0) {
      wrapper.className = 'timer-badge timer-badge--expired';
      wrapper.appendChild(
        createElement('span', { text: 'Tu reserva de inventario expiró.' })
      );
      wrapper.appendChild(
        createElement('button', {
          className: 'btn btn--outline btn--sm',
          text: 'Renovar 15 min',
          attrs: { type: 'button' },
          events: { click: () => appStore.refreshReservation() },
        })
      );
      return;
    }

    wrapper.className =
      remainingSec <= 180 ? 'timer-badge timer-badge--warning' : 'timer-badge';
    wrapper.appendChild(createElement('span', { text: 'Reserva de stock activa' }));
    wrapper.appendChild(createElement('strong', { text: formatTimer(remainingSec) }));
  }

  update();
  const intervalId = setInterval(update, 1000);
  const unsubscribe = appStore.subscribe(update);

  wrapper.destroy = () => {
    clearInterval(intervalId);
    unsubscribe();
  };

  return wrapper;
}
