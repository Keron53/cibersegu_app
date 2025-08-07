# Dockerfile para Backend Node.js con Python pyHanko
FROM node:18-alpine

# Instalar Python y dependencias necesarias
RUN apk add --no-cache \
    python3 \
    py3-pip \
    build-base \
    python3-dev \
    libffi-dev \
    openssl-dev \
    && rm -rf /var/cache/apk/*

# Crear directorio de trabajo
WORKDIR /app

# Copiar package.json y package-lock.json
COPY package*.json ./

# Instalar dependencias de Node.js
RUN npm ci --only=production

# Copiar microservicio Python
COPY MicroservicioPyHanko ./MicroservicioPyHanko/

# Instalar dependencias de Python
RUN pip3 install --no-cache-dir -r MicroservicioPyHanko/requirements.txt

# Copiar código fuente
COPY src ./src
COPY CrearCACentral ./CrearCACentral/

# Crear directorio de uploads
RUN mkdir -p uploads

# Crear usuario no-root
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Cambiar permisos
RUN chown -R nodejs:nodejs /app
USER nodejs

# Exponer puerto
EXPOSE 3001

# Comando de inicio
CMD ["node", "src/app.js"] 