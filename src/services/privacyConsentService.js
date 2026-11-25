import { appStore } from '../state/appStore.js';

export const cookieService = {
  getConsent() {
    return appStore.getState().cookieConsent;
  },

  saveConsent(preferences) {
    const consent = {
      essential: true,
      preferences: Boolean(preferences.preferences),
      analytics: Boolean(preferences.analytics),
      marketing: Boolean(preferences.marketing),
      updatedAt: new Date().toISOString(),
    };
    appStore.setCookieConsent(consent);
    return consent;
  },

  acceptAll() {
    return this.saveConsent({
      preferences: true,
      analytics: true,
      marketing: true,
    });
  },

  rejectNonEssential() {
    return this.saveConsent({
      preferences: false,
      analytics: false,
      marketing: false,
    });
  },

  hasConsentFor(category) {
    if (category === 'essential') return true;
    const consent = this.getConsent();
    return Boolean(consent && consent[category]);
  },
};
