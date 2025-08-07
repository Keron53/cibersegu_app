#!/bin/bash

# Script de despliegue para Azure VM
# Sistema de Firmas Electrónicas

set -e

echo "🚀 Iniciando despliegue del Sistema de Firmas Electrónicas..."

# Variables de configuración
DOMAIN="tu-dominio.com"
EMAIL="tu-email@gmail.com"
MONGODB_PASSWORD="tu_password_seguro_aqui"
JWT_SECRET="tu_jwt_secret_muy_seguro_aqui"
EMAIL_PASSWORD="tu-contraseña-de-aplicación"

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Función para imprimir mensajes
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

# Clonar o copiar el proyecto
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

# Crear certificados SSL (self-signed para desarrollo)
print_status "Generando certificados SSL..."
mkdir -p ssl
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout ssl/tu-dominio.key \
    -out ssl/tu-dominio.crt \
    -subj "/C=EC/ST=Guayas/L=Guayaquil/O=TuEmpresa/CN=$DOMAIN"

# Configurar variables de entorno
print_status "Configurando variables de entorno..."
cat > .env << EOF
DOMAIN=$DOMAIN
EMAIL=$EMAIL
MONGODB_PASSWORD=$MONGODB_PASSWORD
JWT_SECRET=$JWT_SECRET
EMAIL_PASSWORD=$EMAIL_PASSWORD
EOF

# Actualizar configuración de Nginx con el dominio real
print_status "Configurando Nginx..."
sed -i "s/tu-dominio.com/$DOMAIN/g" nginx.conf

# Actualizar docker-compose con las variables reales
print_status "Configurando Docker Compose..."
sed -i "s/tu_password_seguro_aqui/$MONGODB_PASSWORD/g" docker-compose.yml
sed -i "s/tu_jwt_secret_muy_seguro_aqui/$JWT_SECRET/g" docker-compose.yml
sed -i "s/tu-email@gmail.com/$EMAIL/g" docker-compose.yml
sed -i "s/tu-contraseña-de-aplicación/$EMAIL_PASSWORD/g" docker-compose.yml
sed -i "s/tu-dominio.com/$DOMAIN/g" docker-compose.yml

# Configurar firewall
print_status "Configurando firewall..."
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# Iniciar servicios
print_status "Iniciando servicios con Docker Compose..."
docker-compose up -d

# Verificar que los servicios estén funcionando
print_status "Verificando servicios..."
sleep 30

# Health check
if curl -f http://localhost/health > /dev/null 2>&1; then
    print_status "✅ Servicios iniciados correctamente"
else
    print_error "❌ Error al iniciar servicios"
    docker-compose logs
    exit 1
fi

# Configurar monitoreo básico
print_status "Configurando monitoreo..."
cat > /etc/systemd/system/cibersegu-monitor.service << EOF
[Unit]
Description=Cibersegu Monitor
After=docker.service

[Service]
Type=oneshot
ExecStart=/bin/bash -c 'docker-compose -f /var/www/cibersegu/deployment/docker-compose.yml ps | grep -q "Up" || docker-compose -f /var/www/cibersegu/deployment/docker-compose.yml up -d'
RemainAfterExit=yes

[Install]
WantedBy=multi-user.target
EOF

systemctl enable cibersegu-monitor.service
systemctl start cibersegu-monitor.service

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

# Configurar logrotate
print_status "Configurando rotación de logs..."
cat > /etc/logrotate.d/cibersegu << EOF
/var/log/nginx/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
    postrotate
        docker exec cibersegu_nginx nginx -s reload
    endscript
}
EOF

print_status "🎉 Despliegue completado exitosamente!"
print_status "📋 Información del despliegue:"
echo "   - URL: https://$DOMAIN"
echo "   - Health Check: https://$DOMAIN/health"
echo "   - Logs: docker-compose logs -f"
echo "   - Backup: /usr/local/bin/cibersegu-backup.sh"
echo "   - Reiniciar: docker-compose restart"

print_warning "⚠️  IMPORTANTE:"
echo "   1. Configura tu dominio real en nginx.conf"
echo "   2. Obtén certificados SSL reales (Let's Encrypt)"
echo "   3. Cambia las contraseñas por defecto"
echo "   4. Configura el email para notificaciones"

print_status "🔧 Comandos útiles:"
echo "   - Ver logs: docker-compose logs -f"
echo "   - Reiniciar: docker-compose restart"
echo "   - Actualizar: git pull && docker-compose up -d --build"
echo "   - Backup manual: /usr/local/bin/cibersegu-backup.sh" 