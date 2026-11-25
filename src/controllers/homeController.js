import { renderCategoryGrid } from '../components/CategoryGrid.js';
import { mountHeroSection } from '../components/HeroSection.js';
import { createProductCard } from '../components/ProductCard.js';
import { productService } from '../services/productService.js';
import { clearElement } from '../utils/domSanitizer.js';

export async function initHomeController() {
  const heroRoot = document.getElementById('hero-root');
  mountHeroSection(heroRoot);

  const catRoot = document.getElementById('categories-root');
  renderCategoryGrid(catRoot, await productService.fetchCategories());

  const featuredRoot = document.getElementById('featured-products-root');
  if (featuredRoot) {
    const res = await productService.getProducts({ limit: 8, page: 1, sort: 'featured' });
    clearElement(featuredRoot);
    const items = res.data?.items || [];
    for (const product of items) {
      featuredRoot.appendChild(createProductCard(product));
    }
  }
}
