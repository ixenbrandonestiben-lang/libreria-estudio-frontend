/**
 * Validadores de formularios accesibles en cliente.
 */

export function isRequired(value) {
  return String(value ?? '').trim().length > 0;
}

export function isValidEmail(email) {
  const str = String(email ?? '').trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(str);
}

export function isStrongPassword(password) {
  const str = String(password ?? '');
  return str.length >= 8 && /[A-Za-z]/.test(str) && /\d/.test(str);
}

export function isValidPhone(phone) {
  const digits = String(phone ?? '').replace(/\D/g, '');
  return digits.length >= 10 && digits.length <= 15;
}

export function isValidPostalCode(cp) {
  return /^\d{5}$/.test(String(cp ?? '').trim());
}
