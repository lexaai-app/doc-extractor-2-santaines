# Dockerfile para o frontend com Nginx
FROM nginx:alpine

# Copiar arquivos estáticos
COPY . /usr/share/nginx/html

# Copiar configuração customizada do Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expor porta 80 (interna do container)
EXPOSE 80