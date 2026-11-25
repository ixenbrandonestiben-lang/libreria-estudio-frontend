import { appStore } from '../state/appStore.js';
import { apiRequest } from './apiClient.js';

function normalizeUser(user) {
  if (!user || typeof user !== 'object') return null;
  const fullName = user.fullName || user.full_name || user.name || '';
  const fallback = user.email ? user.email.split('@')[0] : 'Usuario';
  return {
    ...user,
    fullName: fullName || fallback,
    name: user.name || fullName || fallback,
  };
}

export const authService = {
  async login({ email, password }) {
    const res = await apiRequest('/auth/login', {
      method: 'POST',
      body: { email, password },
    });

    if (res.success && res.data?.user) {
      const normalizedUser = normalizeUser(res.data.user);
      appStore.setAuth(normalizedUser, res.data.token || 'jwt-session');
      return {
        ...res,
        data: { ...res.data, user: normalizedUser },
      };
    }

    if (res.error?.code === 'NETWORK_OFFLINE') {
      const fallbackName = email.split('@')[0].replace(/[._-]/g, ' ');
      const demoUser = normalizeUser({
        id: 'usr-demo-1',
        name: fallbackName,
        email,
        role: 'Padre de familia / Estudiante',
      });
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

  async register({ name, fullName, email, password, role }) {
    const resolvedFullName = String(fullName || name || '').trim();
    const res = await apiRequest('/auth/register', {
      method: 'POST',
      body: { fullName: resolvedFullName, email, password },
    });

    if (res.success && res.data?.user) {
      const normalizedUser = normalizeUser(res.data.user);
      appStore.setAuth(normalizedUser, res.data.token || 'jwt-session');
      return {
        ...res,
        data: { ...res.data, user: normalizedUser },
      };
    }

    if (res.error?.code === 'NETWORK_OFFLINE') {
      const demoUser = normalizeUser({
        id: `usr-${Date.now()}`,
        name: resolvedFullName,
        email,
        role: role || 'Estudiante',
      });
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
    return normalizeUser(appStore.getState().user);
  },

  isAuthenticated() {
    return Boolean(appStore.getState().token && appStore.getState().user);
  },
};
