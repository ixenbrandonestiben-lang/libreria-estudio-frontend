/**
 * Constantes globales, rutas, catálogo de demostración y configuraciones de Librería Estudio.
 */

export const API_BASE_URL =
  (typeof window !== 'undefined' && window.__API_BASE_URL__) ||
  'https://libreria-estudio-backend-production.up.railway.app/api/v1';

export const RESERVATION_MINUTES = 15;
export const SEARCH_DEBOUNCE_MS = 300;
export const REQUEST_TIMEOUT_MS = 10000;

export const ROUTES = {
  home: 'index.html',
  catalog: 'src/pages/catalog.html',
  product: 'src/pages/product.html',
  listBuilder: 'src/pages/list-builder.html',
  checkout: 'src/pages/checkout.html',
  login: 'src/pages/login.html',
  register: 'src/pages/register.html',
  forgotPassword: 'src/pages/forgot-password.html',
  resetPassword: 'src/pages/reset-password.html',
  account: 'src/pages/account.html',
  admin: 'src/pages/admin.html',
  orders: 'src/pages/orders.html',
  help: 'src/pages/help.html',
  trackOrder: 'src/pages/track-order.html',
  terms: 'src/pages/terms.html',
  privacy: 'src/pages/privacy.html',
  cookiesPolicy: 'src/pages/cookies-policy.html',
};

/**
 * Resuelve rutas relativas de forma consistente tanto desde /index.html como desde /src/pages/*.html.
 */
export function getRootPrefix() {
  if (typeof window === 'undefined') return './';
  return window.location.pathname.includes('/src/pages/') ? '../../' : './';
}

export function resolvePageUrl(routeKey, queryParams = null) {
  const route = ROUTES[routeKey] || routeKey;
  const base = `${getRootPrefix()}${route}`;
  if (!queryParams) return base;
  const search = new URLSearchParams(queryParams).toString();
  return search ? `${base}?${search}` : base;
}

export function resolveAssetUrl(assetPath) {
  const raw = String(assetPath ?? '').trim();
  if (!raw) {
    return `${getRootPrefix()}src/assets/images/products/cuaderno.svg`;
  }
  if (/^https?:\/\//i.test(raw)) {
    return raw;
  }
  const clean = raw.replace(/^\/+/, '');
  if (clean.startsWith('assets/')) {
    return `${getRootPrefix()}src/${clean}`;
  }
  return `${getRootPrefix()}${clean}`;
}

export const CATEGORIES = [
  {
    id: 'cuadernos',
    name: 'Cuadernos y Libretas',
    description: 'Profesionales, franceses, cuadro chico/grande y hojas de 90-120 g/m².',
    image: 'src/assets/images/products/cuaderno.svg',
    count: 42,
  },
  {
    id: 'escritura',
    name: 'Escritura y Trazado',
    description: 'Bolígrafos de gel, plumas fuente, lápices de grafito y marcatextos.',
    image: 'src/assets/images/products/escritura.svg',
    count: 68,
  },
  {
    id: 'arte',
    name: 'Arte y Dibujo Técnico',
    description: 'Acuarelas, colores profesionales, juegos de geometría y compases.',
    image: 'src/assets/images/products/arte.svg',
    count: 35,
  },
  {
    id: 'mochilas',
    name: 'Mochilas y Estuches',
    description: 'Mochilas ergonómicas escolares, lapiceras y organizadores.',
    image: 'src/assets/images/products/mochila.svg',
    count: 24,
  },
  {
    id: 'tecnologia',
    name: 'Tecnología Escolar',
    description: 'Calculadoras científicas, memorias USB y lámparas de escritorio.',
    image: 'src/assets/images/products/tecnologia.svg',
    count: 19,
  },
  {
    id: 'listas',
    name: 'Paquetes Escolares',
    description: 'Kits armados por grado escolar listos para entregar en casa.',
    image: 'src/assets/images/products/lista.svg',
    count: 12,
  },
];

export const COOKIE_CATEGORIES = [
  {
    id: 'essential',
    title: 'Cookies esenciales',
    description: 'Necesarias para el carrito persistente, reserva de inventario y sesión segura.',
    required: true,
  },
  {
    id: 'preferences',
    title: 'Preferencias y personalización',
    description: 'Recuerdan tu nivel escolar favorito, filtros recientes y dirección predeterminada.',
    required: false,
  },
  {
    id: 'analytics',
    title: 'Analítica de uso',
    description: 'Nos ayudan a mejorar el buscador de útiles y tiempos de carga sin identificarte.',
    required: false,
  },
  {
    id: 'marketing',
    title: 'Promociones escolares',
    description: 'Permiten mostrarte descuentos de temporada escolar y combos relevantes.',
    required: false,
  },
];

export const DEMO_PRODUCTS = [
  {
    id: 'prod-101',
    sku: 'CUA-SCR-100',
    name: 'Cuaderno Profesional Cuadro Chico 100 Hojas Pasta Dura',
    brand: 'Scribe',
    category: 'cuadernos',
    level: 'Secundaria / Preparatoria',
    price: 78.5,
    stock: 45,
    image: 'src/assets/images/products/cuaderno.svg',
    specs: {
      gramaje: '90 g/m²',
      formato: 'Profesional (20 x 26.2 cm)',
      rayado: 'Cuadro chico 5 mm',
      encuadernado: 'Espiral doble metálico',
    },
    description:
      'Papel blanco óptico de 90 g/m² que evita el traspaso de tinta de gel o plumones. Pasta dura resistente al uso diario en mochila.',
    featured: true,
  },
  {
    id: 'prod-102',
    sku: 'ESC-PIL-G207',
    name: 'Set 4 Bolígrafos Gel Punta Fina 0.7 mm Colores Básicos',
    brand: 'Pilot',
    category: 'escritura',
    level: 'Secundaria / Universidad',
    price: 145.0,
    stock: 30,
    image: 'src/assets/images/products/escritura.svg',
    specs: {
      gramaje: 'N/A',
      punta: '0.7 mm fina',
      tinta: 'Gel secado rápido',
      contenido: 'Negro, Azul, Rojo, Verde',
    },
    description:
      'Escritura fluida sin manchas, ideal para apuntes extensos y diagramas. Grip ergonómico de caucho para sesiones largas de estudio.',
    featured: true,
  },
  {
    id: 'prod-103',
    sku: 'ART-PRI-24',
    name: 'Lápices de Color Profesionales Caja con 24 Piezas',
    brand: 'Prismacolor',
    category: 'arte',
    level: 'Primaria / Secundaria',
    price: 289.0,
    stock: 18,
    image: 'src/assets/images/products/arte.svg',
    specs: {
      mina: '4.0 mm suave',
      pigmento: 'Alta saturación mezclable',
      madera: 'Cedro certificado',
      presentacion: 'Estuche metálico 24 pzas',
    },
    description:
      'Minas gruesas resistentes a caídas con pigmentos brillantes fáciles de difuminar para proyectos escolares y láminas de arte.',
    featured: true,
  },
  {
    id: 'prod-104',
    sku: 'ART-MAE-GEO',
    name: 'Juego de Geometría Flexible Irrompible 5 Piezas',
    brand: 'Maped',
    category: 'arte',
    level: 'Primaria / Secundaria',
    price: 96.0,
    stock: 52,
    image: 'src/assets/images/products/arte.svg',
    specs: {
      material: 'Policarbonato flexible',
      incluye: 'Regla 30 cm, 2 escuadras, transportador, compás',
      graduacion: 'Milimétrica láser',
    },
    description:
      'Escuadras y regla graduadas con tinta UV resistente al borrado. Ideal para transporte seguro en mochila escolar.',
    featured: true,
  },
  {
    id: 'prod-105',
    sku: 'TEC-CAS-FX991',
    name: 'Calculadora Científica 552 Funciones Pantalla Natural',
    brand: 'Casio',
    category: 'tecnologia',
    level: 'Preparatoria / Universidad',
    price: 549.0,
    stock: 12,
    image: 'src/assets/images/products/tecnologia.svg',
    specs: {
      funciones: '552 funciones científicas',
      alimentacion: 'Solar + Batería LR44',
      pantalla: 'Alta resolución matriz de puntos',
    },
    description:
      'Aprobada para exámenes de bachillerato e ingeniería. Resuelve matrices, integrales definidas, estadística y ecuaciones.',
    featured: true,
  },
  {
    id: 'prod-106',
    sku: 'MOC-JAN-ERG',
    name: 'Mochila Escolar Ergonómica Repelente al Agua 24L',
    brand: 'JanSport',
    category: 'mochilas',
    level: 'Todos los niveles',
    price: 790.0,
    stock: 9,
    image: 'src/assets/images/products/mochila.svg',
    specs: {
      capacidad: '24 Litros',
      compartimento: 'Laptop hasta 15.6 pulgadas',
      material: 'Poliéster reciclado 600D',
    },
    description:
      'Tirantes acolchados en forma de S que distribuyen el peso de cuadernos y libros sin lastimar la espalda.',
    featured: false,
  },
  {
    id: 'prod-107',
    sku: 'ESC-STA-HB2',
    name: 'Caja 12 Lápices de Grafito HB #2 Hexagonales',
    brand: 'Staedtler',
    category: 'escritura',
    level: 'Primaria / Secundaria',
    price: 84.0,
    stock: 64,
    image: 'src/assets/images/products/escritura.svg',
    specs: {
      dureza: 'HB (#2)',
      cuerpo: 'Hexagonal antideslizante',
      resistencia: 'Mina doble encolado',
    },
    description:
      'Trazo uniforme fácil de borrar, madera de reforestación certificada que no se astilla al sacar punta.',
    featured: true,
  },
  {
    id: 'prod-108',
    sku: 'CUA-NOR-120',
    name: 'Block Dibujo Marquilla 30 Hojas 120 g/m² Blanco',
    brand: 'Norma',
    category: 'cuadernos',
    level: 'Secundaria / Universidad',
    price: 112.0,
    stock: 22,
    image: 'src/assets/images/products/cuaderno.svg',
    specs: {
      gramaje: '120 g/m²',
      formato: '32 x 24 cm',
      superficie: 'Grano fino para técnica seca y acuarela ligera',
    },
    description:
      'Hojas microperforadas de alto gramaje para dibujo técnico, bocetos a lápiz, carboncillo o plumón.',
    featured: false,
  },
  {
    id: 'prod-109',
    sku: 'ESC-STA-HIGH',
    name: 'Paquete 6 Marcatextos Pastel Punta Biselada',
    brand: 'Stabilo',
    category: 'escritura',
    level: 'Secundaria / Universidad',
    price: 158.0,
    stock: 27,
    image: 'src/assets/images/products/escritura.svg',
    specs: {
      punta: 'Biselada 2 a 5 mm',
      tecnologia: 'Anti-secado hasta 4 horas destapado',
      tinta: 'Base agua',
    },
    description:
      'Tonos suaves que facilitan la lectura y organización por códigos de color sin cansar la vista.',
    featured: true,
  },
  {
    id: 'prod-110',
    sku: 'LIS-PRI-BAS',
    name: 'Kit Lista Escolar Esencial Primaria (12 Artículos)',
    brand: 'Librería Estudio',
    category: 'listas',
    level: 'Primaria',
    price: 495.0,
    stock: 15,
    image: 'src/assets/images/products/lista.svg',
    specs: {
      contenido: '4 cuadernos, 12 lápices, colores, tijeras, pegamento y geometría',
      ahorro: '15% descuento vs compra individual',
    },
    description:
      'Selección curada por docentes de educación básica con materiales durables y no tóxicos.',
    featured: true,
  },
];

export const GRADE_TEMPLATES = {
  primaria: [
    { query: 'Cuaderno profesional', productId: 'prod-101', qty: 4 },
    { query: 'Lápices de grafito HB', productId: 'prod-107', qty: 1 },
    { query: 'Lápices de colores 24', productId: 'prod-103', qty: 1 },
    { query: 'Juego de geometría', productId: 'prod-104', qty: 1 },
  ],
  secundaria: [
    { query: 'Cuaderno cuadro chico', productId: 'prod-101', qty: 6 },
    { query: 'Bolígrafos gel', productId: 'prod-102', qty: 1 },
    { query: 'Marcatextos pastel', productId: 'prod-109', qty: 1 },
    { query: 'Juego de geometría', productId: 'prod-104', qty: 1 },
    { query: 'Block marquilla', productId: 'prod-108', qty: 1 },
  ],
  preparatoria: [
    { query: 'Cuaderno pasta dura', productId: 'prod-101', qty: 5 },
    { query: 'Calculadora científica', productId: 'prod-105', qty: 1 },
    { query: 'Bolígrafos gel 0.7 mm', productId: 'prod-102', qty: 1 },
    { query: 'Marcatextos', productId: 'prod-109', qty: 1 },
  ],
};

export const FAQS = [
  {
    id: 'faq-1',
    question: '¿Cómo funciona el Cotizador de Listas Escolares?',
    answer:
      'Pega tu lista de útiles o elige un grado escolar. Nuestro cotizador busca los artículos disponibles, te permite ajustar cantidades o elegir alternativas y los agrega al carrito en un solo clic.',
  },
  {
    id: 'faq-2',
    question: '¿Cuánto tiempo se reserva el inventario en mi carrito?',
    answer:
      'Tu carrito reserva el stock durante 15 minutos mientras completas tu compra. Verás un temporizador en el cajón del carrito y en el checkout.',
  },
  {
    id: 'faq-3',
    question: '¿Emiten factura electrónica para escuelas o padres de familia?',
    answer:
      'Sí. Durante el checkout puedes marcar la opción de facturación o solicitarla desde Mis Pedidos con tu número de orden.',
  },
  {
    id: 'faq-4',
    question: '¿Cuál es el tiempo de entrega en temporada escolar?',
    answer:
      'Envíos estándar de 24 a 48 horas hábiles en zona metropolitana y de 3 a 5 días hábiles al resto del país.',
  },
];
