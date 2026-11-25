import { createSchoolListItemRow } from '../components/SchoolListItemRow.js';
import { cartService } from '../services/cartService.js';
import { schoolListService } from '../services/schoolListService.js';
import { appStore } from '../state/appStore.js';
import { DEMO_PRODUCTS } from '../utils/constants.js';
import { clearElement, createElement, setSafeText } from '../utils/domSanitizer.js';
import { formatCurrency } from '../utils/formatters.js';

export function initSchoolListController() {
  const textarea = document.getElementById('school-list-input');
  const quoteBtn = document.getElementById('quote-list-btn');
  const templatesRoot = document.getElementById('grade-templates-root');
  const rowsRoot = document.getElementById('school-list-rows-root');
  const totalEl = document.getElementById('school-list-total');
  const addAllBtn = document.getElementById('add-list-to-cart-btn');

  if (!rowsRoot) return;

  let currentRows = schoolListService.buildFromTemplate('primaria');

  function renderRows() {
    clearElement(rowsRoot);
    let total = 0;

    if (currentRows.length === 0) {
      rowsRoot.appendChild(
        createElement('div', { className: 'card' }, [
          createElement('p', {
            className: 'text-sm text-muted',
            text: 'No se detectaron artículos válidos en tu lista. Escribe un artículo por línea.',
          }),
        ])
      );
      setSafeText(totalEl, formatCurrency(0));
      return;
    }

    for (const row of currentRows) {
      if (row.included && row.selectedProduct) {
        total += Number(row.selectedProduct.price || 0) * Number(row.qty || 1);
      }

      const rowNode = createSchoolListItemRow(row, {
        onToggle: (id, included) => {
          currentRows = currentRows.map((r) => (r.id === id ? { ...r, included } : r));
          renderRows();
        },
        onChangeProduct: (id, productId) => {
          const targetRow = currentRows.find((r) => r.id === id);
          const found =
            targetRow?.alternatives?.find((p) => String(p.id) === String(productId)) ||
            DEMO_PRODUCTS.find((p) => String(p.id) === String(productId));
          if (!found) return;
          currentRows = currentRows.map((r) =>
            r.id === id
              ? {
                  ...r,
                  selectedProduct: found,
                  matchStatus: Number(found.stock) > 0 ? 'exact_match' : 'out_of_stock',
                  included: Number(found.stock) > 0,
                }
              : r
          );
          renderRows();
        },
        onChangeQty: (id, qty) => {
          currentRows = currentRows.map((r) => (r.id === id ? { ...r, qty } : r));
          renderRows();
        },
      });
      rowsRoot.appendChild(rowNode);
    }

    setSafeText(totalEl, formatCurrency(total));
  }

  if (templatesRoot) {
    clearElement(templatesRoot);
    for (const tpl of schoolListService.getGradeTemplates()) {
      templatesRoot.appendChild(
        createElement('button', {
          className: 'btn btn--outline btn--sm',
          text: tpl.label,
          attrs: { type: 'button' },
          events: {
            click: () => {
              currentRows = schoolListService.buildFromTemplate(tpl.id);
              renderRows();
              appStore.showToast(`Plantilla "${tpl.label}" cargada.`, 'info');
            },
          },
        })
      );
    }
  }

  if (quoteBtn && textarea) {
    quoteBtn.addEventListener('click', async () => {
      const text = textarea.value.trim();
      if (!text) {
        appStore.showToast('Pega al menos un útil escolar para cotizar.', 'warning');
        return;
      }

      quoteBtn.disabled = true;
      try {
        const res = await schoolListService.quoteRawText(text);
        if (res.success && Array.isArray(res.data?.items)) {
          currentRows = res.data.items;
          renderRows();
          appStore.showToast('Lista cotizada correctamente.', 'success');
        } else {
          appStore.showToast(
            res.message || 'No se pudo cotizar la lista escolar.',
            'danger'
          );
        }
      } finally {
        quoteBtn.disabled = false;
      }
    });
  }

  if (addAllBtn) {
    addAllBtn.addEventListener('click', async () => {
      const selected = currentRows.filter(
        (r) => r.included && r.selectedProduct && Number(r.selectedProduct.stock) > 0
      );
      if (selected.length === 0) {
        appStore.showToast(
          'Selecciona al menos un artículo disponible de la lista.',
          'warning'
        );
        return;
      }

      addAllBtn.disabled = true;
      let addedCount = 0;
      try {
        for (const row of selected) {
          const result = await cartService.addItem(row.selectedProduct, row.qty, {
            silentToast: true,
          });
          if (result?.success) {
            addedCount += 1;
          }
        }
        if (addedCount > 0) {
          appStore.showToast(
            `${addedCount} artículo${addedCount === 1 ? '' : 's'} de la lista agregado${addedCount === 1 ? '' : 's'} al carrito.`,
            'success'
          );
          appStore.setCartDrawerOpen(true);
        } else {
          appStore.showToast(
            'No fue posible agregar los artículos seleccionados al carrito.',
            'danger'
          );
        }
      } finally {
        addAllBtn.disabled = false;
      }
    });
  }

  renderRows();
}
