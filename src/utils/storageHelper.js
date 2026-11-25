const PREFIX = 'le_';

/**
 * Lee un valor JSON desde localStorage de forma segura.
 * @template T
 * @param {string} key
 * @param {T} fallback
 * @returns {T}
 */
export function getStorageItem(key, fallback = null) {
  try {
    const raw = window.localStorage.getItem(`${PREFIX}${key}`);
    if (raw === null) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

/**
 * Guarda un valor serializado en localStorage.
 * @param {string} key
 * @param {unknown} value
 * @returns {boolean}
 */
export function setStorageItem(key, value) {
  try {
    window.localStorage.setItem(`${PREFIX}${key}`, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

/**
 * Elimina una clave de localStorage.
 * @param {string} key
 */
export function removeStorageItem(key) {
  try {
    window.localStorage.removeItem(`${PREFIX}${key}`);
  } catch {
    // Silencioso en entornos con almacenamiento restringido
  }
}
