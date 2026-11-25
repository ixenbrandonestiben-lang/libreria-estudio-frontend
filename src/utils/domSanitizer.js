/**
 * Utilidades de sanitización DOM para prevención total de XSS.
 * Nunca utiliza innerHTML; construye nodos con createElement y textContent.
 */

const SAFE_URL_PROTOCOLS = new Set(['http:', 'https:', 'mailto:', 'tel:']);

/**
 * Escapa caracteres especiales HTML en cadenas de texto.
 * @param {unknown} value
 * @returns {string}
 */
export function escapeHtml(value) {
  const str = String(value ?? '');
  return str
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

/**
 * Asigna texto seguro a un elemento usando textContent.
 * @param {Element|null} element
 * @param {unknown} text
 */
export function setSafeText(element, text) {
  if (!element) return;
  element.textContent = String(text ?? '');
}

/**
 * Valida y sanitiza URLs para evitar esquemas peligrosos (javascript:, data:text/html, etc.).
 * Permite rutas relativas seguras y protocolos http/https/mailto/tel.
 * @param {unknown} rawUrl
 * @param {string} fallback
 * @returns {string}
 */
export function sanitizeUrl(rawUrl, fallback = '#') {
  if (typeof rawUrl !== 'string') return fallback;
  const trimmed = rawUrl.trim();
  if (!trimmed) return fallback;

  if (
    trimmed.startsWith('/') ||
    trimmed.startsWith('./') ||
    trimmed.startsWith('../') ||
    trimmed.startsWith('#')
  ) {
    return trimmed;
  }

  try {
    const parsed = new URL(trimmed, window.location.origin);
    if (SAFE_URL_PROTOCOLS.has(parsed.protocol)) {
      return trimmed;
    }
  } catch {
    return fallback;
  }

  return fallback;
}

/**
 * Limpia todos los nodos hijos de un contenedor.
 * @param {Element|null} element
 */
export function clearElement(element) {
  if (!element) return;
  while (element.firstChild) {
    element.removeChild(element.firstChild);
  }
}

/**
 * Crea un elemento DOM de forma segura bloqueando atributos inline peligrosos (style, on*).
 * @param {string} tag
 * @param {Record<string, unknown>} [options]
 * @param {Array<Node|string|null|undefined>} [children]
 * @returns {HTMLElement}
 */
export function createElement(tag, options = {}, children = []) {
  const el = document.createElement(tag);

  if (options.className) {
    el.className = String(options.className);
  }

  if (options.text !== undefined && options.text !== null) {
    el.textContent = String(options.text);
  }

  if (options.attrs && typeof options.attrs === 'object') {
    for (const [key, val] of Object.entries(options.attrs)) {
      if (val === undefined || val === null || val === false) continue;
      const lower = key.toLowerCase();
      if (lower === 'style' || lower.startsWith('on')) continue;

      if (lower === 'href' || lower === 'src' || lower === 'action') {
        el.setAttribute(key, sanitizeUrl(String(val)));
      } else if (val === true) {
        el.setAttribute(key, '');
      } else {
        el.setAttribute(key, String(val));
      }
    }
  }

  if (options.dataset && typeof options.dataset === 'object') {
    for (const [key, val] of Object.entries(options.dataset)) {
      if (val !== undefined && val !== null) {
        el.dataset[key] = String(val);
      }
    }
  }

  if (options.events && typeof options.events === 'object') {
    for (const [eventName, handler] of Object.entries(options.events)) {
      if (typeof handler === 'function') {
        el.addEventListener(eventName, handler);
      }
    }
  }

  for (const child of children) {
    if (child === null || child === undefined || child === false) continue;
    if (typeof child === 'string' || typeof child === 'number') {
      el.appendChild(document.createTextNode(String(child)));
    } else if (child instanceof Node) {
      el.appendChild(child);
    }
  }

  return el;
}
