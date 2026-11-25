import { renderFilterSidebar } from '../components/FilterSidebar.js';
import { renderPaginationBar } from '../components/PaginationBar.js';
import { createProductCard } from '../components/ProductCard.js';
import { productService } from '../services/productService.js';
import { appStore } from '../state/appStore.js';
import { clearElement, createElement, setSafeText } from '../utils/domSanitizer.js';

export async function initCatalogController() {
  const params = new URLSearchParams(window.location.search);
  const initialFilters = {
    search: params.get('q') || '',
    category: params.get('category') || '',
    brand: params.get('brand') || '',
    level: params.get('level') || '',
    minPrice: '',
    maxPrice: '',
    inStockOnly: false,
    sort: 'featured',
    page: Math.max(1, Number(params.get('page')) || 1),
    limit: 8,
  };

  appStore.setFilters(initialFilters);

  const sidebarRoot = document.getElementById('filter-sidebar-root');
  const gridRoot = document.getElementById('catalog-grid-root');
  const paginationRoot = document.getElementById('catalog-pagination-root');
  const countEl = document.getElementById('catalog-count');
  const sortSelect = document.getElementById('catalog-sort');
  const mobileFilterBtn = document.getElementById('toggle-mobile-filters');

  if (mobileFilterBtn && sidebarRoot) {
    mobileFilterBtn.addEventListener('click', () => {
      sidebarRoot.classList.toggle('hidden');
    });
  }

  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      appStore.setFilters({ sort: e.target.value, page: 1 });
      loadCatalog();
    });
  }

  async function loadCatalog() {
    const { filters } = appStore.getState();

    renderFilterSidebar(sidebarRoot, {
      categories: productService.getCategories(),
      brands: productService.getBrands(),
      filters,
      onChange: (partial) => {
        appStore.setFilters(partial);
        loadCatalog();
      },
      onReset: () => {
        appStore.setFilters({
          search: '',
          category: '',
          brand: '',
          level: '',
          minPrice: '',
          maxPrice: '',
          inStockOnly: false,
          sort: 'featured',
          page: 1,
        });
        loadCatalog();
      },
    });

    const res = await productService.getProducts(filters);
    const items = res.data?.items || [];
    const pagination = res.data?.pagination || { page: 1, totalPages: 1, total: items.length };

    setSafeText(
      countEl,
      `${pagination.total} artículo${pagination.total === 1 ? '' : 's'} encontrado${
        pagination.total === 1 ? '' : 's'
      }`
    );

    clearElement(gridRoot);
    if (items.length === 0) {
      gridRoot.appendChild(
        createElement('div', { className: 'card' }, [
          createElement('h3', { text: 'No encontramos artículos con estos filtros' }),
          createElement('p', {
            text: 'Prueba limpiando los filtros o usando el Cotizador de Listas Escolares.',
          }),
        ])
      );
    } else {
      for (const product of items) {
        gridRoot.appendChild(createProductCard(product));
      }
    }

    renderPaginationBar(paginationRoot, pagination, (nextPage) => {
      appStore.setFilters({ page: nextPage });
      loadCatalog();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  await loadCatalog();
}
