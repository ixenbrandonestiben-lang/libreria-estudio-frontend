import { CATEGORIES, DEMO_PRODUCTS } from '../utils/constants.js';
import { apiRequest } from './apiClient.js';

function applyLocalFilters(products, filters = {}) {
  let list = [...products];
  const q = String(filters.search || '').trim().toLowerCase();

  if (q) {
    list = list.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q)
    );
  }

  if (filters.category) {
    list = list.filter((p) => p.category === filters.category);
  }

  if (filters.brand) {
    list = list.filter((p) => p.brand === filters.brand);
  }

  if (filters.level) {
    list = list.filter((p) => p.level.toLowerCase().includes(filters.level.toLowerCase()));
  }

  if (filters.minPrice !== '' && filters.minPrice !== undefined) {
    const min = Number(filters.minPrice);
    if (Number.isFinite(min)) list = list.filter((p) => p.price >= min);
  }

  if (filters.maxPrice !== '' && filters.maxPrice !== undefined) {
    const max = Number(filters.maxPrice);
    if (Number.isFinite(max)) list = list.filter((p) => p.price <= max);
  }

  if (filters.inStockOnly) {
    list = list.filter((p) => p.stock > 0);
  }

  switch (filters.sort) {
    case 'price_asc':
      list.sort((a, b) => a.price - b.price);
      break;
    case 'price_desc':
      list.sort((a, b) => b.price - a.price);
      break;
    case 'name_asc':
      list.sort((a, b) => a.name.localeCompare(b.name, 'es'));
      break;
    default:
      list.sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)));
  }

  const page = Math.max(1, Number(filters.page) || 1);
  const limit = Math.max(1, Number(filters.limit) || 8);
  const total = list.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const safePage = Math.min(page, totalPages);
  const items = list.slice((safePage - 1) * limit, safePage * limit);

  return {
    items,
    pagination: {
      page: safePage,
      limit,
      total,
      totalPages,
    },
  };
}

export const productService = {
  async getProducts(filters = {}, signal = null) {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(filters)) {
      if (v !== '' && v !== null && v !== undefined && v !== false) {
        params.set(k, String(v));
      }
    }
    const res = await apiRequest(`/products?${params.toString()}`, { signal });
    if (res.success && res.data?.items) {
      return res;
    }

    if (res.error?.code === 'ABORT_OR_TIMEOUT' && signal?.aborted) {
      return res;
    }

    return {
      success: true,
      message: 'Catálogo local cargado',
      data: applyLocalFilters(DEMO_PRODUCTS, filters),
      error: null,
    };
  },

  async searchProducts(query, signal = null) {
    const clean = String(query || '').trim();
    if (!clean) {
      return { success: true, message: 'OK', data: { items: [] }, error: null };
    }
    const res = await this.getProducts({ search: clean, limit: 6, page: 1 }, signal);
    return res;
  },

  async getProductById(id) {
    const res = await apiRequest(`/products/${encodeURIComponent(id)}`);
    if (res.success && res.data) {
      return res;
    }

    const found = DEMO_PRODUCTS.find((p) => p.id === id) || DEMO_PRODUCTS[0];
    return {
      success: true,
      message: 'Producto cargado',
      data: found,
      error: null,
    };
  },

  getCategories() {
    return CATEGORIES;
  },

  getBrands() {
    return [...new Set(DEMO_PRODUCTS.map((p) => p.brand))].sort((a, b) =>
      a.localeCompare(b, 'es')
    );
  },
};
