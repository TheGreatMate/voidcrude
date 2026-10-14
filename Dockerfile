FROM nginx:1.27-alpine

# Port nginx listens on inside the container (overridable, e.g. for host/br0 networking)
ENV NGINX_PORT=80

# The official nginx image renders /etc/nginx/templates/*.template with env vars at startup
COPY default.conf.template /etc/nginx/templates/default.conf.template
COPY public/ /usr/share/nginx/html/

EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- "http://127.0.0.1:${NGINX_PORT}/" >/dev/null || exit 1
