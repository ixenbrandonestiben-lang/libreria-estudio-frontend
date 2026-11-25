import { authService } from '../services/authService.js';
import { orderService } from '../services/orderService.js';
import { userService } from '../services/userService.js';
import { appStore } from '../state/appStore.js';
import { resolvePageUrl } from '../utils/constants.js';
import { clearElement, createElement, setSafeText } from '../utils/domSanitizer.js';
import { formatCurrency, formatDate } from '../utils/formatters.js';
import { isRequired, isValidPhone, isValidPostalCode } from '../utils/validators.js';

export async function initAccountController(page) {
  if (page === 'orders') {
    const ordersRoot = document.getElementById('orders-list-root');
    if (!ordersRoot) return;
    const res = await orderService.getOrders();
    const orders = res.data || [];

    clearElement(ordersRoot);
    if (orders.length === 0) {
      ordersRoot.appendChild(
        createElement('div', { className: 'card' }, [
          createElement('p', { text: 'Aún no tienes pedidos registrados.' }),
        ])
      );
      return;
    }

    for (const order of orders) {
      ordersRoot.appendChild(
        createElement('article', { className: 'card' }, [
          createElement('div', { className: 'section__header--row' }, [
            createElement('strong', { text: `Pedido ${order.id}` }),
            createElement('span', { className: 'badge badge--primary', text: order.status }),
          ]),
          createElement('p', {
            className: 'text-sm',
            text: `Fecha: ${formatDate(order.createdAt)} · Total: ${formatCurrency(order.total)}`,
          }),
          createElement('a', {
            className: 'btn btn--outline btn--sm',
            text: 'Rastrear envío',
            attrs: { href: resolvePageUrl('trackOrder', { code: order.id }) },
          }),
        ])
      );
    }
    return;
  }

  // Account page
  const userSummary = document.getElementById('account-user-summary');
  const logoutBtn = document.getElementById('logout-btn');
  const addressesRoot = document.getElementById('addresses-list-root');
  const addressForm = document.getElementById('address-form');
  const addressError = document.getElementById('address-error');

  const user = authService.getCurrentUser();
  if (userSummary) {
    setSafeText(
      userSummary,
      user
        ? `${user.name} (${user.email}) · Perfil: ${user.role || 'Usuario'}`
        : 'Sesión de invitado (inicia sesión para sincronizar tus pedidos).'
    );
  }

  if (logoutBtn) {
    if (!user) logoutBtn.classList.add('hidden');
    logoutBtn.addEventListener('click', () => {
      authService.logout();
      appStore.showToast('Sesión cerrada.', 'info');
      window.location.href = resolvePageUrl('home');
    });
  }

  function renderAddresses() {
    if (!addressesRoot) return;
    clearElement(addressesRoot);
    const addresses = userService.getAddresses();

    if (addresses.length === 0) {
      addressesRoot.appendChild(createElement('p', { text: 'No hay direcciones guardadas.' }));
      return;
    }

    for (const addr of addresses) {
      addressesRoot.appendChild(
        createElement('div', { className: 'card' }, [
          createElement('div', { className: 'section__header--row' }, [
            createElement('strong', { text: `${addr.label} — ${addr.recipient}` }),
            createElement('button', {
              className: 'btn btn--ghost btn--sm',
              text: 'Eliminar',
              attrs: { type: 'button' },
              events: {
                click: () => {
                  userService.deleteAddress(addr.id);
                  renderAddresses();
                },
              },
            }),
          ]),
          createElement('p', {
            className: 'text-sm',
            text: `${addr.street}, ${addr.city}, CP ${addr.postalCode} · Tel: ${addr.phone}`,
          }),
        ])
      );
    }
  }

  if (addressForm) {
    addressForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      setSafeText(addressError, '');
      const data = new FormData(addressForm);
      const label = String(data.get('label') || '');
      const recipient = String(data.get('recipient') || '');
      const street = String(data.get('street') || '');
      const city = String(data.get('city') || '');
      const postalCode = String(data.get('postalCode') || '');
      const phone = String(data.get('phone') || '');

      if (
        !isRequired(label) ||
        !isRequired(recipient) ||
        !isRequired(street) ||
        !isRequired(city) ||
        !isValidPostalCode(postalCode) ||
        !isValidPhone(phone)
      ) {
        setSafeText(addressError, 'Completa todos los campos (CP 5 dígitos y teléfono válido).');
        return;
      }

      await userService.addAddress({ label, recipient, street, city, postalCode, phone });
      addressForm.reset();
      renderAddresses();
      appStore.showToast('Dirección guardada correctamente.', 'success');
    });
  }

  renderAddresses();
}
