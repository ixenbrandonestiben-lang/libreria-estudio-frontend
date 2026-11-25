# Librería Estudio — Frontend

Aplicación web estática modular de **Librería Estudio** (HTML5 semántico, CSS3 con tokens oficiales y JavaScript ES6+ nativo con `type="module"`), sin dependencias de build ni Docker.

## Requisitos previos

- **Python 3** (para el servidor estático local `npm run dev`) o cualquier servidor HTTP estático (Live Server, Caddy, Nginx, Vercel, Netlify, etc.)
- **Node.js** `>= 20.x` (para ejecutar verificaciones y pruebas unitarias)

## Configuración inicial

1. Copia el archivo de variables de entorno de ejemplo si necesitas configurar la URL del Backend:

```bash
cp .env.example .env
```

2. En `public/robots.txt` y `public/sitemap.xml`, actualiza el dominio de ejemplo por tu dominio final antes de publicar.

## Ejecución en desarrollo local

> **Importante:** Al usar módulos ES6 nativos (`type="module"`), abre la aplicación desde un servidor HTTP local (no haciendo doble clic en `file://`).

```bash
npm run dev
```

Abre en tu navegador: **`http://localhost:3000`**

*(Si el backend aún no está levantado, el frontend funciona en modo demostración local para explorar catálogo, filtros, cotizador de listas y carrito).*

## Verificación y pruebas

```bash
npm run lint
npm run format
npm run verificar
node --test tests/*.test.mjs
```
