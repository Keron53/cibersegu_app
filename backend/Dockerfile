# Dockerfile para Backend Node.js con Python pyHanko
FROM node:18

# Instalar Python y dependencias necesarias
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    build-essential \
    python3-dev \
    libffi-dev \
    libssl-dev \
    libcairo2-dev \
    libjpeg-dev \
    libpango1.0-dev \
    libgif-dev \
    librsvg2-dev \
    libpixman-1-dev \
    pkg-config \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Crear directorio de trabajo
WORKDIR /app

# Copiar package.json y package-lock.json
COPY package*.json ./

# Instalar dependencias de Node.js
RUN npm ci --only=production

# Copiar microservicio Python
COPY MicroservicioPyHanko ./MicroservicioPyHanko/

# Instalar dependencias de Python en entorno virtual
RUN python3 -m venv /app/venv
ENV PATH="/app/venv/bin:$PATH"
RUN pip install --no-cache-dir -r MicroservicioPyHanko/requirements.txt

# Copiar código fuente
COPY src ./src
COPY config ./config/

# Crear directorio CrearCACentral si no existe
RUN mkdir -p CrearCACentral

# Crear directorio de uploads
RUN mkdir -p uploads

# Crear usuario no-root
RUN groupadd -g 1001 nodejs
RUN useradd -r -u 1001 -g nodejs nodejs

# Cambiar permisos
RUN chown -R nodejs:nodejs /app
RUN chown -R nodejs:nodejs /app/venv
USER nodejs

# Exponer puerto
EXPOSE 3001

# Comando de inicio
CMD ["node", "src/app.js"] 