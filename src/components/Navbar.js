import { cartService } from '../services/cartService.js';
import { appStore } from '../state/appStore.js';
import { resolveAssetUrl, resolvePageUrl } from '../utils/constants.js';
import { clearElement, createElement } from '../utils/domSanitizer.js';
import { createSearchBar } from './SearchBar.js';

export function mountNavbar(container) {
  if (!container) return;

  const currentPage = document.body.dataset.page || 'home';
  let mobileMenuOpen = false;

  const searchDesktop = createSearchBar({ placeholder: 'Buscar útiles, marcas o SKU...' });

  function render(state) {
    clearElement(container);
    container.className = 'site-header';

    const totalItems = cartService.getTotalCount();
    const user = state.user;

    const brand = createElement(
      'a',
      {
        className: 'navbar__brand',
        attrs: { href: resolvePageUrl('home'), 'aria-label': 'Ir al inicio de Librería Estudio' },
      },
      [
        createElement('img', {
          className: 'navbar__logo',
          attrs: {
            src: resolveAssetUrl('src/assets/images/favicon.svg'),
            alt: 'Logo Librería Estudio',
            width: 32,
            height: 32,
          },
        }),
        createElement('span', { text: 'Librería Estudio' }),
      ]
    );

    const searchWrap = createElement('div', { className: 'navbar__search' }, [searchDesktop]);

    const navLinks = [
      { key: 'catalog', label: 'Catálogo', page: 'catalog' },
      { key: 'list-builder', label: 'Cotizador de Listas', page: 'listBuilder' },
      { key: 'track-order', label: 'Rastrear Pedido', page: 'trackOrder' },
      { key: 'help', label: 'Ayuda', page: 'help' },
    ];

    const nav = createElement(
      'nav',
      { className: 'navbar__nav', attrs: { 'aria-label': 'Navegación principal' } },
      navLinks.map((item) =>
        createElement('a', {
          className: `navbar__link${currentPage === item.key ? ' navbar__link--active' : ''}`,
          text: item.label,
          attrs: { href: resolvePageUrl(item.page) },
        })
      )
    );

    const displayName = user
      ? String(user.name || user.fullName || user.email || 'Cuenta')
          .trim()
          .split(/\s+/)[0]
      : '';

    const accountLink = createElement('a', {
      className: 'btn btn--outline btn--sm',
      text: user ? `Mi cuenta (${displayName})` : 'Ingresar',
      attrs: { href: resolvePageUrl(user ? 'account' : 'login') },
    });

    const cartBtn = createElement(
      'button',
      {
        className: 'btn btn--primary btn--sm navbar__cart-btn',
        attrs: {
          type: 'button',
          'aria-label': `Abrir carrito con ${totalItems} artículos`,
        },
        events: {
          click: () => appStore.setCartDrawerOpen(true),
        },
      },
      [
        createElement('span', { text: 'Carrito' }),
        createElement('span', {
          className: 'navbar__cart-count',
          text: String(totalItems),
          attrs: { 'aria-hidden': 'true' },
        }),
      ]
    );

    const mobileToggle = createElement('button', {
      className: 'btn btn--outline btn--sm navbar__mobile-toggle',
      text: mobileMenuOpen ? 'Cerrar' : 'Menú',
      attrs: {
        type: 'button',
        'aria-expanded': String(mobileMenuOpen),
        'aria-controls': 'mobile-nav-panel',
      },
      events: {
        click: () => {
          mobileMenuOpen = !mobileMenuOpen;
          render(appStore.getState());
        },
      },
    });

    const actions = createElement('div', { className: 'navbar__actions' }, [
      accountLink,
      cartBtn,
      mobileToggle,
    ]);

    const inner = createElement('div', { className: 'container site-header__inner' }, [
      brand,
      searchWrap,
      nav,
      actions,
    ]);

    container.appendChild(inner);

    if (mobileMenuOpen) {
      const mobileSearch = createSearchBar({ placeholder: 'Buscar en Librería Estudio...' });
      const panel = createElement(
        'div',
        {
          className: 'navbar__mobile-panel',
          attrs: { id: 'mobile-nav-panel' },
        },
        [
          mobileSearch,
          ...navLinks.map((item) =>
            createElement('a', {
              className: 'navbar__link',
              text: item.label,
              attrs: { href: resolvePageUrl(item.page) },
            })
          ),
        ]
      );
      container.appendChild(panel);
    }
  }

  render(appStore.getState());
  appStore.subscribe(render);
}
