import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = process.cwd();
const args = new Set(process.argv.slice(2));
const runAll = args.has('--all') || args.size === 0;
const runLint = runAll || args.has('--lint');
const runFormat = runAll || args.has('--format');

const REQUIRED_FILES = [
  'index.html',
  'package.json',
  'src/main.js',
  'src/state/appStore.js',
  'src/assets/css/variables.css',
  'src/assets/css/reset.css',
  'src/assets/css/base.css',
  'src/assets/css/layout.css',
  'src/assets/css/hero-scroll.css',
  'src/assets/css/components.css',
  'src/assets/css/pages.css',
  'src/pages/catalog.html',
  'src/pages/product.html',
  'src/pages/list-builder.html',
  'src/pages/checkout.html',
  'src/pages/login.html',
  'src/pages/register.html',
  'src/pages/forgot-password.html',
  'src/pages/account.html',
  'src/pages/orders.html',
  'src/pages/help.html',
  'src/pages/track-order.html',
  'src/pages/terms.html',
  'src/pages/privacy.html',
  'src/pages/cookies-policy.html',
  'src/components/Navbar.js',
  'src/components/HeroSection.js',
  'src/components/SearchBar.js',
  'src/components/CategoryGrid.js',
  'src/components/ProductCard.js',
  'src/components/FilterSidebar.js',
  'src/components/PaginationBar.js',
  'src/components/CartDrawer.js',
  'src/components/ReservationTimer.js',
  'src/components/SchoolListItemRow.js',
  'src/components/PrivacyNoticeBanner.js',
  'src/components/PrivacyPreferencesModal.js',
  'src/components/HelpQuickWidget.js',
  'src/components/ToastNotification.js',
  'src/components/Footer.js',
  'src/services/apiClient.js',
  'src/services/authService.js',
  'src/services/productService.js',
  'src/services/schoolListService.js',
  'src/services/cartService.js',
  'src/services/orderService.js',
  'src/services/userService.js',
  'src/services/supportService.js',
  'src/services/privacyConsentService.js',
  'src/utils/constants.js',
  'src/utils/domSanitizer.js',
  'src/utils/formatters.js',
  'src/utils/scrollObserver.js',
  'src/utils/storageHelper.js',
  'src/utils/validators.js',
  'src/controllers/homeController.js',
  'src/controllers/catalogController.js',
  'src/controllers/productDetailController.js',
  'src/controllers/schoolListController.js',
  'src/controllers/checkoutController.js',
  'src/controllers/authController.js',
  'src/controllers/accountController.js',
  'src/controllers/helpController.js',
  'src/controllers/legalController.js',
];

function walk(dir, extFilter) {
  const results = [];
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry === '.git') continue;
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      results.push(...walk(full, extFilter));
    } else if (!extFilter || extFilter.some((ext) => full.endsWith(ext))) {
      results.push(full);
    }
  }
  return results;
}

let errors = 0;

if (runAll) {
  console.log('1. Verificando presencia de archivos clave...');
  for (const file of REQUIRED_FILES) {
    if (!existsSync(join(ROOT, file))) {
      console.error(`  [FALTA] ${file}`);
      errors++;
    }
  }
  console.log(`   Archivos clave verificados (${REQUIRED_FILES.length} requeridos).`);
}

const jsFiles = walk(join(ROOT, 'src'), ['.js']);
const htmlFiles = [
  join(ROOT, 'index.html'),
  ...walk(join(ROOT, 'src'), ['.html']),
].filter((f) => existsSync(f));

if (runAll || runLint) {
  console.log('2. Verificando sintaxis JS con node --check...');
  for (const file of jsFiles) {
    try {
      execFileSync(process.execPath, ['--check', file], { stdio: 'pipe' });
    } catch (err) {
      console.error(`  [ERROR SINTAXIS] ${relative(ROOT, file)}:\n${err.stderr?.toString()}`);
      errors++;
    }
  }
  console.log(`   ${jsFiles.length} archivos JS verificados.`);

  console.log('3. Verificando seguridad (cero style inline, cero onclick inline, cero innerHTML)...');
  for (const file of htmlFiles) {
    const content = readFileSync(file, 'utf8');
    if (/\sstyle\s*=\s*["']/i.test(content)) {
      console.error(`  [LINT] Atributo style inline encontrado en ${relative(ROOT, file)}`);
      errors++;
    }
    if (/\son[a-z]+\s*=\s*["']/i.test(content)) {
      console.error(`  [LINT] Atributo de evento inline (on*) encontrado en ${relative(ROOT, file)}`);
      errors++;
    }
  }
  for (const file of jsFiles) {
    const content = readFileSync(file, 'utf8');
    if (/\.innerHTML\s*=/.test(content)) {
      console.error(`  [LINT] Uso de innerHTML detectado en ${relative(ROOT, file)}`);
      errors++;
    }
  }
}

if (runFormat) {
  console.log('4. Verificando formato básico (CRLF / tabs)...');
  for (const file of [...jsFiles, ...htmlFiles]) {
    const content = readFileSync(file, 'utf8');
    if (content.includes('\r\n')) {
      console.error(`  [FORMAT] CRLF encontrado en ${relative(ROOT, file)}`);
      errors++;
    }
  }
  console.log('   Formato verificado.');
}

if (errors > 0) {
  console.error(`\nFalló la verificación con ${errors} error(es).`);
  process.exit(1);
}

console.log('\nVerificación completada con éxito (0 errores).');
