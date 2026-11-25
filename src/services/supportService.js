import { FAQS } from '../utils/constants.js';
import { getStorageItem, setStorageItem } from '../utils/storageHelper.js';
import { apiRequest } from './apiClient.js';

export const supportService = {
  getFaqs() {
    return FAQS;
  },

  getTickets() {
    return getStorageItem('support_tickets', []);
  },

  async createTicket(payload) {
    const res = await apiRequest('/support/tickets', {
      method: 'POST',
      body: {
        contactEmail: payload.contactEmail || payload.email,
        orderNumber: payload.orderNumber || null,
        subject: payload.subject,
        message: payload.message,
      },
    });

    if (res.success && res.data) {
      const ticket = {
        ...res.data,
        id: res.data.ticket_code || res.data.id,
      };
      const existing = this.getTickets();
      setStorageItem('support_tickets', [ticket, ...existing]);
      return {
        success: true,
        message: `Ticket ${ticket.id} registrado. Te responderemos pronto.`,
        data: ticket,
        error: null,
      };
    }

    if (res.error?.code !== 'NETWORK_OFFLINE') {
      return res;
    }

    const ticket = {
      id: `TK-${Math.floor(1000 + Math.random() * 9000)}`,
      ...payload,
      status: 'Recibido',
      createdAt: new Date().toISOString(),
    };

    const existing = this.getTickets();
    setStorageItem('support_tickets', [ticket, ...existing]);

    return {
      success: true,
      message: `Ticket ${ticket.id} registrado. Te responderemos pronto.`,
      data: ticket,
      error: null,
    };
  },
};
