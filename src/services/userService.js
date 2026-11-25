import { appStore } from '../state/appStore.js';
import { apiRequest } from './apiClient.js';

export const userService = {
  async updateProfile(profileData) {
    const res = await apiRequest('/users/me', {
      method: 'PATCH',
      body: profileData,
    });

    const current = appStore.getState().user;
    if (res.success && res.data) {
      appStore.setAuth(res.data, appStore.getState().token);
      return res;
    }

    if (res.error?.code === 'NETWORK_OFFLINE' && current) {
      const updated = { ...current, ...profileData };
      appStore.setAuth(updated, appStore.getState().token);
      return {
        success: true,
        message: 'Perfil actualizado',
        data: updated,
        error: null,
      };
    }

    return res;
  },

  getAddresses() {
    return appStore.getState().addresses;
  },

  async addAddress(address) {
    const newAddr = {
      id: `addr-${Date.now()}`,
      ...address,
    };
    const next = [...appStore.getState().addresses, newAddr];
    appStore.setAddresses(next);

    await apiRequest('/users/me/addresses', {
      method: 'POST',
      body: newAddr,
    }).catch(() => null);

    return {
      success: true,
      message: 'Dirección guardada',
      data: newAddr,
      error: null,
    };
  },

  deleteAddress(addressId) {
    const next = appStore.getState().addresses.filter((a) => a.id !== addressId);
    appStore.setAddresses(next);
  },
};
