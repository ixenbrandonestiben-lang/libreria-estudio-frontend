import { DEMO_PRODUCTS, GRADE_TEMPLATES } from '../utils/constants.js';
import { apiRequest } from './apiClient.js';
import { normalizeProduct } from './productService.js';

function normalizeForLocalMatch(text) {
  return String(text || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function stemToken(token) {
  if (token.length > 4 && token.endsWith('es')) {
    return token.slice(0, -2);
  }
  if (token.length > 3 && token.endsWith('s')) {
    return token.slice(0, -1);
  }
  return token;
}

function ensureProductInAlternatives(selectedProduct, alternatives) {
  const list = [];
  const seen = new Set();

  if (selectedProduct && selectedProduct.id !== undefined && selectedProduct.id !== null) {
    seen.add(String(selectedProduct.id));
    list.push(selectedProduct);
  }

  for (const alt of alternatives || []) {
    if (!alt || alt.id === undefined || alt.id === null) continue;
    const key = String(alt.id);
    if (!seen.has(key)) {
      seen.add(key);
      list.push(alt);
    }
  }

  return list;
}

function normalizeQuotedRow(rawRow, index = 0) {
  const selectedProduct = rawRow.selectedProduct
    ? normalizeProduct(rawRow.selectedProduct)
    : null;
  const rawAlts = rawRow.alternatives || rawRow.alternativeProducts || [];
  const normalizedAlts = rawAlts.map(normalizeProduct).filter(Boolean);
  const alternatives = ensureProductInAlternatives(selectedProduct, normalizedAlts);

  const qty = Math.max(
    1,
    Math.min(100, Number(rawRow.qty ?? rawRow.quantity ?? 1) || 1)
  );
  const matchStatus =
    rawRow.matchStatus || (selectedProduct ? 'exact_match' : 'not_found');
  const included =
    rawRow.included !== undefined
      ? Boolean(rawRow.included)
      : Boolean(selectedProduct && selectedProduct.stock > 0);

  return {
    id: rawRow.id || `quote-${index}-${Math.random().toString(36).slice(2, 7)}`,
    requestedText:
      rawRow.requestedText || rawRow.requestedLine || rawRow.normalizedDescription || '',
    qty,
    matchStatus,
    selectedProduct,
    alternatives,
    included,
  };
}

function matchLineToProduct(rawLine, index = 0) {
  let clean = String(rawLine || '')
    .trim()
    .replace(/^\d+[.)\-]\s*/, '')
    .replace(/^[-*•]+\s*/, '')
    .trim();

  if (!clean) return null;

  let qty = 1;
  const leadingMatch = clean.match(/^(\d{1,3})\s*(?:x|unidades?|u\.?)?\s+(.+)$/i);
  if (leadingMatch) {
    const parsed = Number.parseInt(leadingMatch[1], 10);
    if (parsed >= 1 && parsed <= 100) {
      qty = parsed;
      clean = leadingMatch[2].trim();
    }
  } else {
    const trailingMatch = clean.match(/^(.+?)\s+x\s*(\d{1,3})$/i);
    if (trailingMatch) {
      const parsed = Number.parseInt(trailingMatch[2], 10);
      if (parsed >= 1 && parsed <= 100) {
        qty = parsed;
        clean = trailingMatch[1].trim();
      }
    }
  }

  const tokens = normalizeForLocalMatch(clean)
    .replace(/[^a-z0-9.\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length >= 2)
    .map(stemToken);

  let best = null;
  let bestScore = 0;

  for (const prod of DEMO_PRODUCTS) {
    const haystack = normalizeForLocalMatch(
      `${prod.name} ${prod.brand} ${prod.category} ${prod.description || ''}`
    );
    let score = 0;
    for (const token of tokens) {
      if (haystack.includes(token)) {
        score += 1;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      best = prod;
    }
  }

  if (!best) {
    return normalizeQuotedRow(
      {
        id: `demo-${index}-${Math.random().toString(36).slice(2, 7)}`,
        requestedText: clean,
        qty,
        matchStatus: 'not_found',
        selectedProduct: null,
        alternatives: DEMO_PRODUCTS.slice(0, 4),
        included: false,
      },
      index
    );
  }

  const categoryPool = DEMO_PRODUCTS.filter((p) => p.category === best.category).slice(0, 4);
  return normalizeQuotedRow(
    {
      id: `demo-${index}-${Math.random().toString(36).slice(2, 7)}`,
      requestedText: clean,
      qty,
      matchStatus: bestScore >= 2 ? 'exact_match' : 'alternative',
      selectedProduct: best,
      alternatives: ensureProductInAlternatives(best, categoryPool),
      included: best.stock > 0,
    },
    index
  );
}

export const schoolListService = {
  normalizeQuotedRow,

  getGradeTemplates() {
    return [
      { id: 'primaria', label: 'Primaria (Básico)', items: GRADE_TEMPLATES.primaria },
      { id: 'secundaria', label: 'Secundaria (Completo)', items: GRADE_TEMPLATES.secundaria },
      {
        id: 'preparatoria',
        label: 'Preparatoria / Bachillerato',
        items: GRADE_TEMPLATES.preparatoria,
      },
    ];
  },

  buildFromTemplate(templateId) {
    const tpl = GRADE_TEMPLATES[templateId] || GRADE_TEMPLATES.primaria;
    return tpl.map((entry, idx) => {
      const prod = DEMO_PRODUCTS.find((p) => p.id === entry.productId) || DEMO_PRODUCTS[0];
      const pool = DEMO_PRODUCTS.filter((p) => p.category === prod.category).slice(0, 4);
      return normalizeQuotedRow(
        {
          id: `tpl-${templateId}-${idx}`,
          requestedText: entry.query,
          qty: entry.qty,
          matchStatus: 'exact_match',
          selectedProduct: prod,
          alternatives: ensureProductInAlternatives(prod, pool),
          included: prod.stock > 0,
        },
        idx
      );
    });
  },

  async quoteRawText(rawText) {
    const res = await apiRequest('/school-lists/quote', {
      method: 'POST',
      body: { rawText },
    });

    if (res.success && Array.isArray(res.data?.items)) {
      const normalizedItems = res.data.items.map((item, idx) =>
        normalizeQuotedRow(item, idx)
      );
      return {
        ...res,
        data: {
          ...res.data,
          items: normalizedItems,
        },
      };
    }

    if (res.error?.code !== 'NETWORK_OFFLINE') {
      return res;
    }

    const lines = String(rawText || '')
      .split(/\r?\n|;/)
      .map((l) => l.trim())
      .filter(Boolean);

    const rows = lines.map((line, idx) => matchLineToProduct(line, idx)).filter(Boolean);
    return {
      success: true,
      message: 'Lista cotizada con inventario disponible',
      data: { items: rows },
      error: null,
    };
  },
};
