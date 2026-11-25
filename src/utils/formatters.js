/**
 * Formateadores de moneda, fechas y temporizador.
 */

export function formatCurrency(amount, currency = 'MXN') {
  const numeric = Number(amount);
  const safeValue = Number.isFinite(numeric) ? numeric : 0;
  try {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
    }).format(safeValue);
  } catch {
    return `$${safeValue.toFixed(2)}`;
  }
}

export function formatDate(isoDate) {
  if (!isoDate) return '—';
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('es-MX', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
}

export function formatTimer(totalSeconds) {
  const safe = Math.max(0, Math.floor(Number(totalSeconds) || 0));
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function truncateText(text, maxLength = 90) {
  const str = String(text ?? '');
  if (str.length <= maxLength) return str;
  return `${str.slice(0, maxLength - 1)}…`;
}
