import { mountCartDrawer } from './components/CartDrawer.js';
import { mountCookieBanner } from './components/CookieBanner.js';
import { mountCookiePreferencesModal } from './components/CookiePreferencesModal.js';
import { mountFooter } from './components/Footer.js';
import { mountHelpQuickWidget } from './components/HelpQuickWidget.js';
import { mountNavbar } from './components/Navbar.js';
import { mountToastNotification } from './components/ToastNotification.js';
import { initAccountController } from './controllers/accountController.js';
import { initAuthController } from './controllers/authController.js';
import { initCatalogController } from './controllers/catalogController.js';
import { initCheckoutController } from './controllers/checkoutController.js';
import { initHelpController } from './controllers/helpController.js';
import { initHomeController } from './controllers/homeController.js';
import { initLegalController } from './controllers/legalController.js';
import { initProductDetailController } from './controllers/productDetailController.js';
import { initSchoolListController } from './controllers/schoolListController.js';
import { initScrollObserver } from './utils/scrollObserver.js';

function bootstrap() {
  mountNavbar(document.getElementById('navbar-root'));
  mountFooter(document.getElementById('footer-root'));
  mountCartDrawer(document.getElementById('cart-drawer-root'));
  mountCookieBanner(document.getElementById('cookie-banner-root'));
  mountCookiePreferencesModal(document.getElementById('cookie-modal-root'));
  mountHelpQuickWidget(document.getElementById('help-widget-root'));
  mountToastNotification(document.getElementById('toast-root'));

  const page = document.body.dataset.page || 'home';

  switch (page) {
    case 'home':
      initHomeController();
      break;
    case 'catalog':
      initCatalogController();
      break;
    case 'product':
      initProductDetailController();
      break;
    case 'list-builder':
      initSchoolListController();
      break;
    case 'checkout':
      initCheckoutController();
      break;
    case 'login':
    case 'register':
    case 'forgot-password':
      initAuthController(page);
      break;
    case 'account':
    case 'orders':
      initAccountController(page);
      break;
    case 'help':
    case 'track-order':
      initHelpController(page);
      break;
    case 'terms':
    case 'privacy':
    case 'cookies-policy':
      initLegalController();
      break;
    default:
      break;
  }

  initScrollObserver();
}

document.addEventListener('DOMContentLoaded', bootstrap);
