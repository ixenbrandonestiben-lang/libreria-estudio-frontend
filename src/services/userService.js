import { appStore } from '../state/appStore.js';
import { apiRequest } from './apiClient.js';

function normalizeAddress(addr) {
  if (!addr || typeof addr !== 'object') return null;
  return {
    ...addr,
    id: addr.id,
    label: addr.label || 'Casa',
    recipient: addr.recipient || addr.recipient_name || '',
    phone: addr.phone || addr.recipient_phone || '',
    street: addr.street || addr.address_line_1 || '',
    city: addr.city || '',
    stateOrDepartment: addr.stateOrDepartment || addr.state_or_department || '',
    postalCode: addr.postalCode || addr.postal_code || '',
    isDefault: Boolean(addr.isDefault ?? addr.is_default),
  };
}

export const userService = {
  async updateProfile(profileData) {
    const res = await apiRequest('/users/profile', {
      method: 'PUT',
      body: {
        fullName: profileData.fullName || profileData.name,
        phone: profileData.phone,
      },
    });

    const current = appStore.getState().user;
    if (res.success && res.data) {
      const normalized = {
        ...res.data,
        fullName: res.data.full_name || res.data.fullName || current?.fullName || '',
        name: res.data.full_name || res.data.fullName || res.data.name || current?.name || '',
      };
      appStore.setAuth(normalized, appStore.getState().token);
      return { ...res, data: normalized };
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
    return appStore.getState().addresses.map(normalizeAddress);
  },

  async fetchAddresses() {
    if (!appStore.getState().token || appStore.getState().token === 'demo-token-local') {
      return this.getAddresses();
    }

    const res = await apiRequest('/users/addresses');
    if (res.success && Array.isArray(res.data)) {
      const normalized = res.data.map(normalizeAddress);
      appStore.setAddresses(normalized);
      return normalized;
    }

    return this.getAddresses();
  },

  async addAddress(address) {
    const res = await apiRequest('/users/addresses', {
      method: 'POST',
      body: {
        label: address.label || 'Casa',
        recipientName: address.recipientName || address.recipient,
        recipientPhone: address.recipientPhone || address.phone,
        addressLine1: address.addressLine1 || address.street,
        city: address.city,
        stateOrDepartment: address.stateOrDepartment || address.city || 'CDMX',
        postalCode: address.postalCode,
        isDefault: Boolean(address.isDefault),
      },
    });

    if (res.success && res.data) {
      const saved = normalizeAddress(res.data);
      appStore.setAddresses([...appStore.getState().addresses, saved]);
      return {
        success: true,
        message: 'Dirección guardada',
        data: saved,
        error: null,
      };
    }

    if (res.error?.code !== 'NETWORK_OFFLINE' && appStore.getState().token && appStore.getState().token !== 'demo-token-local') {
      return res;
    }

    const newAddr = normalizeAddress({
      id: `addr-${Date.now()}`,
      ...address,
    });
    const next = [...appStore.getState().addresses, newAddr];
    appStore.setAddresses(next);

    return {
      success: true,
      message: 'Dirección guardada',
      data: newAddr,
      error: null,
    };
  },

  async deleteAddress(addressId) {
    if (appStore.getState().token && !String(addressId).startsWith('addr-')) {
      await apiRequest(`/users/addresses/${encodeURIComponent(addressId)}`, {
        method: 'DELETE',
      }).catch(() => null);
    }

    const next = appStore
      .getState()
      .addresses.filter((a) => String(a.id) !== String(addressId));
    appStore.setAddresses(next);
  },
};
