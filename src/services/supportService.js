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
      body: payload,
    });

    const ticket = res.success && res.data
      ? res.data
      : {
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
