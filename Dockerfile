# ==============================================================================
# Librería Estudio - Frontend Dockerfile (Nginx Alpine no-root)
# ==============================================================================
FROM nginx:alpine

# Configurar PID en /tmp y permisos seguros para ejecutar como usuario no-root nginx
RUN sed -i -E 's|/var/run/nginx\.pid|/tmp/nginx.pid|g; s|/run/nginx\.pid|/tmp/nginx.pid|g' /etc/nginx/nginx.conf \
  && mkdir -p /etc/nginx/snippets /usr/share/nginx/html/src /usr/share/nginx/html/public \
  && chown -R nginx:nginx /var/cache/nginx /var/log/nginx /etc/nginx/conf.d /etc/nginx/snippets /usr/share/nginx/html

# Copiar configuración de Nginx
COPY --chown=nginx:nginx nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --chown=nginx:nginx nginx/security-headers.conf /etc/nginx/snippets/security-headers.conf

# Copiar aplicación estática
COPY --chown=nginx:nginx index.html /usr/share/nginx/html/index.html
COPY --chown=nginx:nginx src/ /usr/share/nginx/html/src/
COPY --chown=nginx:nginx public/ /usr/share/nginx/html/public/

# Asegurar permisos de solo lectura para archivos servidos
RUN chmod -R a+rX /usr/share/nginx/html

# Ejecutar como usuario no-root
USER nginx

# Puerto no privilegiado
EXPOSE 8080

# Verificación de salud
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -q --spider http://127.0.0.1:8080/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
