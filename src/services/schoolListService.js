import { DEMO_PRODUCTS, GRADE_TEMPLATES } from '../utils/constants.js';
import { apiRequest } from './apiClient.js';

function matchLineToProduct(rawLine) {
  const clean = rawLine.trim();
  const qtyMatch = clean.match(/^(\d+)\s*[xX]?\s+(.+)$/);
  const qty = qtyMatch ? Math.max(1, Number(qtyMatch[1])) : 1;
  const query = (qtyMatch ? qtyMatch[2] : clean).trim();
  const tokens = query
    .toLowerCase()
    .split(/\s+/)
    .filter((t) => t.length > 2);

  let best = DEMO_PRODUCTS[0];
  let bestScore = -1;

  for (const prod of DEMO_PRODUCTS) {
    const haystack = `${prod.name} ${prod.brand} ${prod.category}`.toLowerCase();
    let score = 0;
    for (const token of tokens) {
      if (haystack.includes(token)) score += 1;
    }
    if (score > bestScore) {
      bestScore = score;
      best = prod;
    }
  }

  return {
    id: `row-${Math.random().toString(36).slice(2, 8)}`,
    requestedText: query,
    qty,
    selectedProduct: best,
    alternatives: DEMO_PRODUCTS.filter((p) => p.category === best.category).slice(0, 4),
    included: true,
  };
}

export const schoolListService = {
  getGradeTemplates() {
    return [
      { id: 'primaria', label: 'Primaria (Básico)', items: GRADE_TEMPLATES.primaria },
      { id: 'secundaria', label: 'Secundaria (Completo)', items: GRADE_TEMPLATES.secundaria },
      { id: 'preparatoria', label: 'Preparatoria / Bachillerato', items: GRADE_TEMPLATES.preparatoria },
    ];
  },

  buildFromTemplate(templateId) {
    const tpl = GRADE_TEMPLATES[templateId] || GRADE_TEMPLATES.primaria;
    return tpl.map((entry, idx) => {
      const prod = DEMO_PRODUCTS.find((p) => p.id === entry.productId) || DEMO_PRODUCTS[0];
      return {
        id: `tpl-${templateId}-${idx}`,
        requestedText: entry.query,
        qty: entry.qty,
        selectedProduct: prod,
        alternatives: DEMO_PRODUCTS.filter((p) => p.category === prod.category).slice(0, 4),
        included: true,
      };
    });
  },

  async quoteRawText(rawText) {
    const res = await apiRequest('/school-lists/quote', {
      method: 'POST',
      body: { text: rawText },
    });

    if (res.success && Array.isArray(res.data?.items)) {
      return res;
    }

    const lines = String(rawText || '')
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);

    const rows = lines.map(matchLineToProduct);
    return {
      success: true,
      message: 'Lista cotizada con inventario disponible',
      data: { items: rows },
      error: null,
    };
  },
};
