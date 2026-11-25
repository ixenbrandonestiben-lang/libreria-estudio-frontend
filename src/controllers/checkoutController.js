import { createReservationTimer } from '../components/ReservationTimer.js';
import { cartService } from '../services/cartService.js';
import { orderService } from '../services/orderService.js';
import { appStore } from '../state/appStore.js';
import { resolvePageUrl } from '../utils/constants.js';
import { clearElement, createElement, setSafeText } from '../utils/domSanitizer.js';
import { formatCurrency } from '../utils/formatters.js';
import { isRequired, isValidEmail, isValidPhone, isValidPostalCode } from '../utils/validators.js';

export function initCheckoutController() {
  const form = document.getElementById('checkout-form');
  const summaryRoot = document.getElementById('checkout-summary-root');
  const timerRoot = document.getElementById('checkout-timer-root');
  const errorEl = document.getElementById('checkout-error');

  if (!form || !summaryRoot) return;

  if (timerRoot) {
    clearElement(timerRoot);
    timerRoot.appendChild(createReservationTimer());
  }

  function renderSummary() {
    clearElement(summaryRoot);
    const cart = cartService.getCart();
    const subtotal = cartService.getSubtotal();
    const shipping = subtotal >= 600 || subtotal === 0 ? 0 : 79;
    const total = subtotal + shipping;

    if (cart.length === 0) {
      summaryRoot.appendChild(
        createElement('p', {
          text: 'Tu carrito está vacío. Agrega útiles desde el catálogo o el cotizador.',
        })
      );
      return;
    }

    const list = createElement(
      'ul',
      {},
      cart.map((item) =>
        createElement('li', { className: 'section__header--row' }, [
          createElement('span', { className: 'text-sm', text: `${item.qty}x ${item.name}` }),
          createElement('strong', { className: 'text-sm', text: formatCurrency(item.price * item.qty) }),
        ])
      )
    );

    summaryRoot.appendChild(list);
    summaryRoot.appendChild(
      createElement('div', { className: 'section__header--row' }, [
        createElement('span', { text: 'Envío' }),
        createElement('span', { text: shipping === 0 ? 'Gratis' : formatCurrency(shipping) }),
      ])
    );
    summaryRoot.appendChild(
      createElement('div', { className: 'section__header--row' }, [
        createElement('strong', { text: 'Total a pagar' }),
        createElement('strong', { className: 'product-card__price', text: formatCurrency(total) }),
      ])
    );
  }

  renderSummary();
  appStore.subscribe(renderSummary);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    setSafeText(errorEl, '');

    const cart = cartService.getCart();
    if (cart.length === 0) {
      setSafeText(errorEl, 'No hay artículos en el carrito.');
      return;
    }

    const data = new FormData(form);
    const name = String(data.get('fullName') || '');
    const email = String(data.get('email') || '');
    const phone = String(data.get('phone') || '');
    const street = String(data.get('street') || '');
    const postalCode = String(data.get('postalCode') || '');
    const paymentMethod = String(data.get('paymentMethod') || 'card');
    const requiresInvoice = data.get('requiresInvoice') === 'on';
    const termsAccepted = data.get('termsAccepted') === 'on';

    if (!isRequired(name) || !isValidEmail(email) || !isValidPhone(phone) || !isRequired(street) || !isValidPostalCode(postalCode)) {
      setSafeText(errorEl, 'Verifica tus datos de contacto, teléfono (10 dígitos) y código postal (5 dígitos).');
      return;
    }

    if (!termsAccepted) {
      setSafeText(errorEl, 'Debes aceptar los Términos y Condiciones para confirmar el pedido.');
      return;
    }

    const subtotal = cartService.getSubtotal();
    const shipping = subtotal >= 600 ? 0 : 79;
    const res = await orderService.createOrder({
      fullName: name,
      email,
      phone,
      address: `${street}, CP ${postalCode}`,
      paymentMethod,
      requiresInvoice,
      termsAccepted,
      items: cart,
      total: subtotal + shipping,
    });

    if (!res.success) {
      setSafeText(errorEl, res.message);
      return;
    }

    appStore.showToast(`¡Pedido ${res.data.id} confirmado!`, 'success');
    window.location.href = resolvePageUrl('orders');
  });
}
