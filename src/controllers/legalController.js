import { appStore } from '../state/appStore.js';

export function initLegalController() {
  const openPrefsBtn = document.getElementById('open-cookie-prefs-btn');
  if (openPrefsBtn) {
    openPrefsBtn.addEventListener('click', () => {
      appStore.setCookieModalOpen(true);
    });
  }
}
