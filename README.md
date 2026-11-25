# Librería Estudio — Frontend

Aplicación web de **Librería Estudio** servida con **Nginx Alpine** endurecido para producción en Docker / Dokploy.

## Requisitos previos

- **Docker** y **Docker Compose** (v2+)
- **Node.js** `>= 20.x` (opcional, para linting y formateo local)

## Configuración inicial

1. Copia el archivo de variables de entorno de ejemplo:

```bash
cp .env.example .env
```

2. Ajusta `FRONTEND_PORT`, `API_BASE_URL` y `SITE_URL` según tu entorno. En `public/robots.txt` y `public/sitemap.xml`, actualiza el dominio de ejemplo por tu dominio final antes de publicar.

## Uso en desarrollo con Docker

Para levantar el servidor Nginx con volúmenes montados en vivo (sin reconstruir la imagen ante cada cambio en `index.html`, `src/`, `public/` o `nginx/`):

```bash
docker compose -f docker-compose.dev.yml up -d
```

La aplicación estará disponible en `http://localhost:8080`.

## Despliegue en producción con Docker

El `Dockerfile` utiliza `nginx:alpine` ejecutándose como usuario no-root (`nginx`) en el puerto `8080`, con:
- `autoindex off` y bloqueo de archivos ocultos (`/.*`)
- Compresión `gzip` habilitada
- Caché de 30 días para activos estáticos y `no-cache` para archivos `.html`
- Cabeceras de seguridad (`server_tokens off`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy: strict-origin-when-cross-origin`)
- Endpoint `/health` para verificación de estado

Para construir y levantar en producción:

```bash
docker compose up -d --build
```

Para revisar estado y logs:

```bash
docker compose ps
docker compose logs -f frontend-web
```

## Calidad de código

Si tienes `eslint` y `prettier` instalados en el proyecto:

```bash
npm run lint
npm run format
```
