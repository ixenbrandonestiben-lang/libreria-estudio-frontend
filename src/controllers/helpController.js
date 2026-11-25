import { orderService } from '../services/orderService.js';
import { supportService } from '../services/supportService.js';
import { appStore } from '../state/appStore.js';
import { clearElement, createElement, setSafeText } from '../utils/domSanitizer.js';
import { formatCurrency, formatDate } from '../utils/formatters.js';
import { isRequired, isValidEmail } from '../utils/validators.js';

export function initHelpController(page) {
  if (page === 'track-order') {
    const form = document.getElementById('track-order-form');
    const resultRoot = document.getElementById('track-result-root');
    const params = new URLSearchParams(window.location.search);
    const codeInput = document.getElementById('track-code');

    if (codeInput && params.get('code')) {
      codeInput.value = params.get('code');
    }

    if (form && resultRoot) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = new FormData(form);
        const code = String(data.get('code') || '');
        const email = String(data.get('email') || '');

        clearElement(resultRoot);
        const res = await orderService.trackOrder(code, email);
        if (!res.success || !res.data) {
          resultRoot.appendChild(
            createElement('div', { className: 'card' }, [
              createElement('p', { className: 'text-danger', text: res.message }),
            ])
          );
          return;
        }

        const order = res.data;
        const steps = ['Confirmado', 'Empacando útiles', 'En camino', 'Entregado'];
        const activeIdx = order.status === 'Entregado' ? 3 : order.status === 'En camino' ? 2 : 1;

        resultRoot.appendChild(
          createElement('div', { className: 'card' }, [
            createElement('h2', { text: `Pedido ${order.id}` }),
            createElement('p', {
              className: 'text-sm',
              text: `Estado: ${order.status} · Fecha: ${formatDate(order.createdAt)} · Total: ${formatCurrency(order.total)}`,
            }),
            createElement(
              'div',
              { className: 'timeline' },
              steps.map((step, idx) =>
                createElement('div', {
                  className: `timeline__step${idx <= activeIdx ? ' timeline__step--done' : ''}`,
                  text: `${idx <= activeIdx ? '✓ ' : ''}${step}`,
                })
              )
            ),
          ])
        );
      });
    }
    return;
  }

  // Help & Tickets page
  const faqRoot = document.getElementById('faq-list-root');
  const ticketForm = document.getElementById('support-ticket-form');
  const ticketStatus = document.getElementById('ticket-status');

  if (faqRoot) {
    clearElement(faqRoot);
    for (const faq of supportService.getFaqs()) {
      faqRoot.appendChild(
        createElement('details', { className: 'card' }, [
          createElement('summary', { className: 'form-label', text: faq.question }),
          createElement('p', { className: 'text-sm', text: faq.answer }),
        ])
      );
    }
  }

  if (ticketForm) {
    ticketForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const data = new FormData(ticketForm);
      const email = String(data.get('email') || '');
      const subject = String(data.get('subject') || '');
      const message = String(data.get('message') || '');

      if (!isValidEmail(email) || !isRequired(subject) || !isRequired(message)) {
        setSafeText(ticketStatus, 'Completa tu correo, asunto y descripción del problema.');
        return;
      }

      const res = await supportService.createTicket({ email, subject, message });
      setSafeText(ticketStatus, res.message);
      ticketForm.reset();
      appStore.showToast('Ticket de soporte enviado.', 'success');
    });
  }
}
