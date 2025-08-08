#!/bin/bash

# Script de despliegue SIMPLIFICADO para Azure VM
# Sistema de Firmas Electrónicas - SIN DOMINIO

set -e

echo "🚀 Iniciando despliegue SIMPLIFICADO del Sistema de Firmas Electrónicas..."

# Variables de configuración SIMPLIFICADAS
IP_PUBLICA="20.206.200.40"
EMAIL="16cardenas16@gmail.com"
MONGODB_PASSWORD="MongoDB2024!@#Seguro"
JWT_SECRET="jwt_secret_super_seguro_para_af_systems_2024"
EMAIL_PASSWORD="2514jajaJAJA@"

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar si estamos como root
if [[ $EUID -ne 0 ]]; then
   print_error "Este script debe ejecutarse como root"
   exit 1
fi

print_status "IP Pública detectada: $IP_PUBLICA"
print_warning "⚠️  IMPORTANTE: Sin dominio, no habrá SSL automático"

# Actualizar sistema
print_status "Actualizando sistema..."
apt update && apt upgrade -y

# Instalar dependencias básicas
print_status "Instalando dependencias..."
apt install -y \
    curl \
    wget \
    git \
    unzip \
    software-properties-common \
    apt-transport-https \
    ca-certificates \
    gnupg \
    lsb-release

# Instalar Docker
print_status "Instalando Docker..."
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
apt update
apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Instalar Docker Compose
print_status "Instalando Docker Compose..."
curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Crear directorio del proyecto
print_status "Creando estructura de directorios..."
mkdir -p /var/www/cibersegu
cd /var/www/cibersegu

# Copiar proyecto
if [ -d "/tmp/cibersegu_app" ]; then
    print_status "Copiando proyecto desde /tmp..."
    cp -r /tmp/cibersegu_app/* .
else
    print_status "Descargando proyecto desde GitHub..."
    git clone https://github.com/tu-usuario/cibersegu-app.git .
fi

# Crear directorio de deployment
mkdir -p deployment
cd deployment

# Crear configuración de Nginx SIN SSL
print_status "Creando configuración de Nginx SIN SSL..."
cat > nginx-simple.conf << EOF
# Configuración de Nginx SIMPLIFICADA (sin SSL)
# Proxy reverso con protección básica contra ataques

# Configuración de rate limiting
limit_req_zone \$binary_remote_addr zone=api:10m rate=10r/s;
limit_req_zone \$binary_remote_addr zone=login:10m rate=5r/m;
limit_req_zone \$binary_remote_addr zone=upload:10m rate=2r/s;

# Lista de IPs baneadas
geo \$bad_client {
    default 0;
}

# Configuración principal del servidor (HTTP solo)
server {
    listen 80;
    server_name $IP_PUBLICA;
    
    # Headers de seguridad
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    
    # Bloquear IPs baneadas
    if (\$bad_client) {
        return 444;
    }
    
    # Configuración de logs
    access_log /var/log/nginx/access.log;
    error_log /var/log/nginx/error.log;
    
    # Configuración de archivos estáticos
    client_max_body_size 50M;
    client_body_timeout 60s;
    client_header_timeout 60s;
    
    # Frontend (React)
    location / {
        root /var/www/frontend/dist;
        try_files \$uri \$uri/ /index.html;
        
        # Cache para archivos estáticos
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)\$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # API Backend - Rate limiting específico
    location /api/ {
        # Rate limiting para API
        limit_req zone=api burst=20 nodelay;
        
        # Rate limiting más estricto para login
        location ~ ^/api/usuarios/(login|registro) {
            limit_req zone=login burst=3 nodelay;
        }
        
        # Rate limiting para uploads
        location ~ ^/api/documentos/subir {
            limit_req zone=upload burst=5 nodelay;
        }
        
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
    
    # Archivos subidos
    location /uploads/ {
        alias /var/www/backend/uploads/;
        expires 1d;
        add_header Cache-Control "public";
        
        # Protección básica
        location ~* \.(php|pl|py|jsp|asp|sh|cgi)\$ {
            deny all;
        }
    }
    
    # Health check
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
    
    # Bloquear acceso a archivos sensibles
    location ~ /\. {
        deny all;
    }
    
    location ~* \.(htaccess|htpasswd|ini|log|sh|sql|conf)\$ {
        deny all;
    }
    
    # Bloquear user agents maliciosos
    if (\$http_user_agent ~* (curl|wget|python|bot|crawler|spider)) {
        return 403;
    }
}

# Configuración para manejo de errores
error_page 404 /404.html;
error_page 500 502 503 504 /50x.html;

location = /50x.html {
    root /usr/share/nginx/html;
}
EOF

# Crear docker-compose SIMPLIFICADO
print_status "Creando docker-compose simplificado..."
cat > docker-compose-simple.yml << EOF
version: '3.8'

services:
  # Base de datos MongoDB
  mongodb:
    image: mongo:6.0
    container_name: cibersegu_mongodb
    restart: unless-stopped
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: $MONGODB_PASSWORD
      MONGO_INITDB_DATABASE: digital_sign
    volumes:
      - mongodb_data:/data/db
    ports:
      - "27017:27017"
    networks:
      - cibersegu_network

  # Backend Node.js
  backend:
    build:
      context: ../backend
      dockerfile: Dockerfile
    container_name: cibersegu_backend
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - MONGODB_URI=mongodb://admin:$MONGODB_PASSWORD@mongodb:27017/digital_sign?authSource=admin
      - JWT_SECRET=$JWT_SECRET
      - EMAIL_USER=$EMAIL
      - EMAIL_PASS=$EMAIL_PASSWORD
      - FRONTEND_URL=http://$IP_PUBLICA
    volumes:
      - backend_uploads:/app/uploads
      - backend_certs:/app/CrearCACentral
    depends_on:
      - mongodb
    networks:
      - cibersegu_network
    expose:
      - "3001"

  # Frontend React
  frontend:
    build:
      context: ../frontend
      dockerfile: Dockerfile
    container_name: cibersegu_frontend
    restart: unless-stopped
    environment:
      - VITE_API_URL=http://$IP_PUBLICA/api
    volumes:
      - frontend_dist:/app/dist
    networks:
      - cibersegu_network
    expose:
      - "80"

  # Nginx Proxy (SIN SSL)
  nginx:
    image: nginx:alpine
    container_name: cibersegu_nginx
    restart: unless-stopped
    ports:
      - "80:80"
    volumes:
      - ./nginx-simple.conf:/etc/nginx/nginx.conf:ro
      - frontend_dist:/var/www/frontend/dist:ro
      - backend_uploads:/var/www/backend/uploads:ro
      - nginx_logs:/var/log/nginx
    depends_on:
      - frontend
      - backend
    networks:
      - cibersegu_network

volumes:
  mongodb_data:
  backend_uploads:
  backend_certs:
  frontend_dist:
  nginx_logs:

networks:
  cibersegu_network:
    driver: bridge
EOF

# Configurar firewall
print_status "Configurando firewall..."
ufw allow 22/tcp
ufw allow 80/tcp
ufw --force enable

# Iniciar servicios
print_status "Iniciando servicios con Docker Compose..."
docker-compose -f docker-compose-simple.yml up -d

# Verificar que los servicios estén funcionando
print_status "Verificando servicios..."
sleep 30

# Health check
if curl -f http://localhost/health > /dev/null 2>&1; then
    print_status "✅ Servicios iniciados correctamente"
else
    print_error "❌ Error al iniciar servicios"
    docker-compose -f docker-compose-simple.yml logs
    exit 1
fi

# Configurar backup automático
print_status "Configurando backup automático..."
cat > /usr/local/bin/cibersegu-backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/var/backups/cibersegu"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup de MongoDB
docker exec cibersegu_mongodb mongodump --out /tmp/backup
docker cp cibersegu_mongodb:/tmp/backup $BACKUP_DIR/mongodb_$DATE

# Backup de uploads
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz /var/www/cibersegu/deployment/backend_uploads

# Limpiar backups antiguos (mantener últimos 7 días)
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
find $BACKUP_DIR -name "mongodb_*" -mtime +7 -exec rm -rf {} \;

echo "Backup completado: $DATE"
EOF

chmod +x /usr/local/bin/cibersegu-backup.sh

# Configurar cron para backup diario
echo "0 2 * * * /usr/local/bin/cibersegu-backup.sh" | crontab -

print_status "🎉 Despliegue SIMPLIFICADO completado exitosamente!"
print_status "📋 Información del despliegue:"
echo "   - URL: http://$IP_PUBLICA"
echo "   - Health Check: http://$IP_PUBLICA/health"
echo "   - Logs: docker-compose -f docker-compose-simple.yml logs -f"
echo "   - Backup: /usr/local/bin/cibersegu-backup.sh"
echo "   - Reiniciar: docker-compose -f docker-compose-simple.yml restart"

print_warning "⚠️  IMPORTANTE:"
echo "   1. La aplicación funciona SIN SSL (HTTP)"
echo "   2. Para SSL necesitas un dominio"
echo "   3. Cambia las contraseñas por defecto"
echo "   4. Configura el email para notificaciones"

print_status "🔧 Comandos útiles:"
echo "   - Ver logs: docker-compose -f docker-compose-simple.yml logs -f"
echo "   - Reiniciar: docker-compose -f docker-compose-simple.yml restart"
echo "   - Actualizar: git pull && docker-compose -f docker-compose-simple.yml up -d --build"
echo "   - Backup manual: /usr/local/bin/cibersegu-backup.sh"

print_status "🌐 Para agregar dominio después:"
echo "   1. Compra un dominio"
echo "   2. Apunta el DNS a: $IP_PUBLICA"
echo "   3. Ejecuta: ./install-letsencrypt.sh tu-dominio.com tu-email@gmail.com" 