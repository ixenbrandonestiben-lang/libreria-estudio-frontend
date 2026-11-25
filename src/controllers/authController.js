import { authService } from '../services/authService.js';
import { appStore } from '../state/appStore.js';
import { resolvePageUrl } from '../utils/constants.js';
import { setSafeText } from '../utils/domSanitizer.js';
import { isRequired, isStrongPassword, isValidEmail } from '../utils/validators.js';

export function initAuthController(page) {
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const forgotForm = document.getElementById('forgot-form');
  const feedbackEl = document.getElementById('auth-feedback');

  if (page === 'login' && loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      setSafeText(feedbackEl, '');
      const data = new FormData(loginForm);
      const email = String(data.get('email') || '');
      const password = String(data.get('password') || '');

      if (!isValidEmail(email) || !isRequired(password)) {
        setSafeText(feedbackEl, 'Ingresa un correo válido y tu contraseña.');
        return;
      }

      const res = await authService.login({ email, password });
      if (!res.success) {
        setSafeText(feedbackEl, res.message);
        return;
      }
      appStore.showToast('¡Bienvenido de nuevo a Librería Estudio!', 'success');
      window.location.href = resolvePageUrl('account');
    });
  }

  if (page === 'register' && registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      setSafeText(feedbackEl, '');
      const data = new FormData(registerForm);
      const name = String(data.get('name') || '');
      const email = String(data.get('email') || '');
      const password = String(data.get('password') || '');
      const role = String(data.get('role') || 'Estudiante');

      if (!isRequired(name) || !isValidEmail(email)) {
        setSafeText(feedbackEl, 'Nombre y correo electrónico válidos son obligatorios.');
        return;
      }
      if (!isStrongPassword(password)) {
        setSafeText(feedbackEl, 'La contraseña debe tener mínimo 8 caracteres, letras y números.');
        return;
      }

      const res = await authService.register({ name, email, password, role });
      if (!res.success) {
        setSafeText(feedbackEl, res.message);
        return;
      }
      appStore.showToast('Cuenta creada correctamente.', 'success');
      window.location.href = resolvePageUrl('account');
    });
  }

  if (page === 'forgot-password' && forgotForm) {
    forgotForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const data = new FormData(forgotForm);
      const email = String(data.get('email') || '');
      if (!isValidEmail(email)) {
        setSafeText(feedbackEl, 'Ingresa un correo electrónico válido.');
        return;
      }
      const res = await authService.forgotPassword(email);
      setSafeText(feedbackEl, res.message);
      if (res.success) {
        appStore.showToast('Solicitud de recuperación enviada.', 'info');
      }
    });
  }
}
