import { appStore } from '../state/appStore.js';
import { apiRequest } from './apiClient.js';

export const authService = {
  async login({ email, password }) {
    const res = await apiRequest('/auth/login', {
      method: 'POST',
      body: { email, password },
    });

    if (res.success && res.data?.user) {
      appStore.setAuth(res.data.user, res.data.token || 'jwt-session');
      return res;
    }

    if (res.error?.code === 'NETWORK_OFFLINE') {
      const demoUser = {
        id: 'usr-demo-1',
        name: email.split('@')[0].replace(/[._-]/g, ' '),
        email,
        role: 'Padre de familia / Estudiante',
      };
      appStore.setAuth(demoUser, 'demo-token-local');
      return {
        success: true,
        message: 'Sesión iniciada en modo demostración',
        data: { user: demoUser, token: 'demo-token-local' },
        error: null,
      };
    }

    return res;
  },

  async register({ name, email, password, role }) {
    const res = await apiRequest('/auth/register', {
      method: 'POST',
      body: { name, email, password, role },
    });

    if (res.success && res.data?.user) {
      appStore.setAuth(res.data.user, res.data.token || 'jwt-session');
      return res;
    }

    if (res.error?.code === 'NETWORK_OFFLINE') {
      const demoUser = {
        id: `usr-${Date.now()}`,
        name,
        email,
        role: role || 'Estudiante',
      };
      appStore.setAuth(demoUser, 'demo-token-local');
      return {
        success: true,
        message: 'Cuenta creada en modo demostración',
        data: { user: demoUser, token: 'demo-token-local' },
        error: null,
      };
    }

    return res;
  },

  async forgotPassword(email) {
    const res = await apiRequest('/auth/forgot-password', {
      method: 'POST',
      body: { email },
    });

    if (res.error?.code === 'NETWORK_OFFLINE') {
      return {
        success: true,
        message: 'Si el correo existe, enviamos instrucciones de recuperación.',
        data: { email },
        error: null,
      };
    }
    return res;
  },

  logout() {
    appStore.setAuth(null, null);
  },

  getCurrentUser() {
    return appStore.getState().user;
  },

  isAuthenticated() {
    return Boolean(appStore.getState().token && appStore.getState().user);
  },
};
