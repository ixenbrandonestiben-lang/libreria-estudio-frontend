import { CATEGORIES, DEMO_PRODUCTS } from '../utils/constants.js';
import { apiRequest } from './apiClient.js';

const CATEGORY_FALLBACK_IMAGES = {
  cuadernos: 'src/assets/images/products/cuaderno.svg',
  'cuadernos-y-papel': 'src/assets/images/products/cuaderno.svg',
  'libros-y-textos': 'src/assets/images/products/cuaderno.svg',
  escritura: 'src/assets/images/products/escritura.svg',
  'escritura-y-arte': 'src/assets/images/products/escritura.svg',
  arte: 'src/assets/images/products/arte.svg',
  mochilas: 'src/assets/images/products/mochila.svg',
  tecnologia: 'src/assets/images/products/tecnologia.svg',
  'geometria-y-calculo': 'src/assets/images/products/tecnologia.svg',
  listas: 'src/assets/images/products/lista.svg',
  'combos-escolares': 'src/assets/images/products/lista.svg',
};

const LEVEL_LABELS = {
  primaria: 'Primaria',
  secundaria: 'Secundaria',
  universidad: 'Universidad / Bachillerato',
  universitario: 'Universidad / Bachillerato',
  general: 'Todos los niveles',
};

const SORT_TO_BACKEND = {
  featured: 'newest',
  newest: 'newest',
  price_asc: 'price_asc',
  price_desc: 'price_desc',
  name_asc: 'title_asc',
  title_asc: 'title_asc',
};

const LEVEL_TO_BACKEND = {
  primaria: 'primaria',
  secundaria: 'secundaria',
  preparatoria: 'universidad',
  universidad: 'universidad',
};

export function normalizeProduct(raw) {
  if (!raw || typeof raw !== 'object') {
    return null;
  }

  const categorySlug = raw.category_slug || raw.category || 'cuadernos';
  const rawImage = String(raw.image || raw.image_url || '').trim();
  const isMissingOrPlaceholder =
    !rawImage || rawImage.endsWith('placeholder-product.webp');
  const fallbackImg =
    CATEGORY_FALLBACK_IMAGES[categorySlug] || 'src/assets/images/products/cuaderno.svg';

  let specs = raw.specs && typeof raw.specs === 'object' ? { ...raw.specs } : {};
  let level = raw.level || '';

  if (Array.isArray(raw.attributes)) {
    for (const attr of raw.attributes) {
      if (!attr || !attr.key) continue;
      if (attr.key === 'education_level' && !level) {
        level = attr.label || LEVEL_LABELS[attr.value] || attr.value;
      } else {
        specs[attr.key] = attr.label || attr.value;
      }
    }
  }

  return {
    ...raw,
    id: raw.id,
    sku: raw.sku || '',
    name: raw.name || raw.title || 'Producto escolar',
    brand: raw.brand || raw.brand_name || 'Librería Estudio',
    category: categorySlug,
    categoryName: raw.category_name || raw.categoryName || categorySlug,
    level: level || 'Todos los niveles',
    price: Number(raw.price) || 0,
    stock: Number.isFinite(Number(raw.stock_available))
      ? Number(raw.stock_available)
      : Number.isFinite(Number(raw.stock))
        ? Number(raw.stock)
        : 0,
    image: isMissingOrPlaceholder ? fallbackImg : rawImage,
    specs,
    description: raw.description || raw.short_description || '',
  };
}

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
    list = list.filter(
      (p) =>
        p.brand.toLowerCase() === String(filters.brand).toLowerCase() ||
        p.brand.toLowerCase().replace(/\s+/g, '-') === String(filters.brand).toLowerCase()
    );
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
    case 'title_asc':
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
  normalizeProduct,

  async getProducts(filters = {}, signal = null) {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(filters)) {
      if (v === '' || v === null || v === undefined || v === false) {
        continue;
      }
      if (k === 'sort') {
        params.set('sort', SORT_TO_BACKEND[v] || 'newest');
      } else if (k === 'level') {
        const mapped = LEVEL_TO_BACKEND[String(v).trim().toLowerCase()];
        if (mapped) {
          params.set('education_level', mapped);
        }
      } else {
        params.set(k, String(v));
      }
    }

    const res = await apiRequest(`/products?${params.toString()}`, { signal });
    if (res.success && Array.isArray(res.data)) {
      const items = res.data.map(normalizeProduct);
      const pagination = res.meta || {
        page: Number(filters.page) || 1,
        limit: Number(filters.limit) || 8,
        total: items.length,
        totalPages: 1,
      };
      return {
        success: true,
        message: res.message || 'Catálogo cargado',
        data: { items, pagination },
        error: null,
      };
    }

    if (res.success && Array.isArray(res.data?.items)) {
      return {
        ...res,
        data: {
          items: res.data.items.map(normalizeProduct),
          pagination: res.data.pagination || {
            page: 1,
            limit: res.data.items.length || 8,
            total: res.data.items.length,
            totalPages: 1,
          },
        },
      };
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
    return this.getProducts({ search: clean, limit: 6, page: 1 }, signal);
  },

  async getProductById(id) {
    const res = await apiRequest(`/products/${encodeURIComponent(id)}`);
    if (res.success && res.data) {
      return {
        ...res,
        data: normalizeProduct(res.data),
      };
    }

    if (res.error?.code === 'NETWORK_OFFLINE') {
      const found =
        DEMO_PRODUCTS.find((p) => String(p.id) === String(id)) || DEMO_PRODUCTS[0];
      return {
        success: true,
        message: 'Producto cargado',
        data: found,
        error: null,
      };
    }

    return res;
  },

  async fetchCategories() {
    const res = await apiRequest('/products/categories');
    if (res.success && Array.isArray(res.data) && res.data.length > 0) {
      return res.data.map((c) => ({
        id: c.slug,
        name: c.name,
        description: c.description || '',
        image: CATEGORY_FALLBACK_IMAGES[c.slug] || 'src/assets/images/products/cuaderno.svg',
      }));
    }
    return CATEGORIES;
  },

  async fetchBrands() {
    const res = await apiRequest('/products/brands');
    if (res.success && Array.isArray(res.data) && res.data.length > 0) {
      return res.data.map((b) => ({ id: b.slug, name: b.name }));
    }
    return this.getBrands().map((name) => ({ id: name, name }));
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
