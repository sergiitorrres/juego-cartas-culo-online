# ETAPA 1: Construcción del Frontend
FROM node:22.13.1-alpine AS builder

WORKDIR /app

# Copiar solo package files primero (mejor caching)
COPY client/package*.json ./client/
WORKDIR /app/client
RUN npm install

# Copiar el resto del código del cliente
COPY client/ .
RUN npm run build

# ETAPA 2: Servidor de Producción
FROM node:22.13.1-alpine

WORKDIR /app

# Copiar package files del servidor
COPY server/package*.json ./server/
RUN cd server && npm install --production

# Copiar código del servidor
COPY server/ ./server/

# Traer el build del frontend desde la etapa anterior
COPY --from=builder /app/client/dist ./client/dist

# Verificar que los archivos existen
RUN ls -la /app/client/dist || echo "Warning: client/dist no encontrado"

EXPOSE 3000

# Healthcheck para Docker
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s \
  CMD node -e "require('http').get('http://localhost:3000', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["node", "server/index.js"]
