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

    for (const row of currentRows) {
      if (row.included) {
        total += row.selectedProduct.price * row.qty;
      }

      const rowNode = createSchoolListItemRow(row, {
        onToggle: (id, included) => {
          currentRows = currentRows.map((r) => (r.id === id ? { ...r, included } : r));
          renderRows();
        },
        onChangeProduct: (id, productId) => {
          const found = DEMO_PRODUCTS.find((p) => p.id === productId);
          if (!found) return;
          currentRows = currentRows.map((r) =>
            r.id === id ? { ...r, selectedProduct: found } : r
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
      const res = await schoolListService.quoteRawText(text);
      if (res.success && res.data?.items) {
        currentRows = res.data.items;
        renderRows();
        appStore.showToast('Lista cotizada correctamente.', 'success');
      }
    });
  }

  if (addAllBtn) {
    addAllBtn.addEventListener('click', async () => {
      const selected = currentRows.filter((r) => r.included);
      if (selected.length === 0) {
        appStore.showToast('Selecciona al menos un artículo de la lista.', 'warning');
        return;
      }
      for (const row of selected) {
        await cartService.addItem(row.selectedProduct, row.qty);
      }
      appStore.setCartDrawerOpen(true);
    });
  }

  renderRows();
}
