import { appStore } from '../state/appStore.js';
import { API_BASE_URL, REQUEST_TIMEOUT_MS } from '../utils/constants.js';

/**
 * Cliente HTTP nativo con timeout de 10s, soporte AbortSignal y respuesta uniforme { success, message, data, error }.
 */
export async function apiRequest(endpoint, options = {}) {
  const {
    method = 'GET',
    body = null,
    headers = {},
    signal: externalSignal = null,
    timeoutMs = REQUEST_TIMEOUT_MS,
  } = options;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const onExternalAbort = () => controller.abort();
  if (externalSignal) {
    if (externalSignal.aborted) {
      clearTimeout(timer);
      return {
        success: false,
        message: 'Solicitud cancelada',
        data: null,
        error: { code: 'ABORTED' },
      };
    }
    externalSignal.addEventListener('abort', onExternalAbort, { once: true });
  }

  const { token } = appStore.getState();
  const requestHeaders = {
    Accept: 'application/json',
    ...headers,
  };

  if (body !== null && !(body instanceof FormData)) {
    requestHeaders['Content-Type'] = 'application/json';
  }

  if (token) {
    requestHeaders.Authorization = `Bearer ${token}`;
  }

  const base = API_BASE_URL.replace(/\/+$/, '');
  const path = String(endpoint).startsWith('/') ? endpoint : `/${endpoint}`;

  try {
    const response = await fetch(`${base}${path}`, {
      method,
      headers: requestHeaders,
      body: body === null ? undefined : body instanceof FormData ? body : JSON.stringify(body),
      signal: controller.signal,
    });

    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      return {
        success: false,
        message: payload?.message || `Error ${response.status} al comunicarse con el servidor`,
        data: null,
        error: payload?.error || { status: response.status },
      };
    }

    if (payload && typeof payload === 'object' && 'success' in payload) {
      return payload;
    }

    return {
      success: true,
      message: 'OK',
      data: payload,
      error: null,
    };
  } catch (err) {
    const isAborted = err?.name === 'AbortError';
    return {
      success: false,
      message: isAborted
        ? 'La solicitud tardó demasiado o fue cancelada'
        : 'Servidor no disponible; usando modo demostración local',
      data: null,
      error: { code: isAborted ? 'ABORT_OR_TIMEOUT' : 'NETWORK_OFFLINE' },
    };
  } finally {
    clearTimeout(timer);
    if (externalSignal) {
      externalSignal.removeEventListener('abort', onExternalAbort);
    }
  }
}
