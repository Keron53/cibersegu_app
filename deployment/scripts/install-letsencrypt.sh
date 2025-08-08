#!/bin/bash

# Script para instalar certificados SSL con Let's Encrypt
# Sistema de Firmas Electrónicas

set -e

echo "🔐 Instalando certificados SSL con Let's Encrypt..."

# Variables
DOMAIN=${1:-"af-systemstechnology.com"}
EMAIL=${2:-"16cardenas16@gmail.com"}

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

# Verificar que el dominio esté configurado
if [ "$DOMAIN" = "tu-dominio.com" ]; then
    print_error "Debes especificar tu dominio real"
    echo "Uso: $0 tu-dominio.com tu-email@gmail.com"
    exit 1
fi

print_status "Configurando certificados SSL para: $DOMAIN"

# Instalar Certbot
print_status "Instalando Certbot..."
apt update
apt install -y certbot python3-certbot-nginx

# Verificar que Nginx esté funcionando
if ! systemctl is-active --quiet nginx; then
    print_error "Nginx no está funcionando. Inicia los servicios primero."
    exit 1
fi

# Verificar que el dominio resuelva a esta IP
print_status "Verificando resolución DNS..."
CURRENT_IP=$(curl -s ifconfig.me)
DOMAIN_IP=$(dig +short $DOMAIN)

if [ "$DOMAIN_IP" != "$CURRENT_IP" ]; then
    print_warning "El dominio $DOMAIN no resuelve a esta IP ($CURRENT_IP)"
    print_warning "Asegúrate de que el DNS esté configurado correctamente"
    read -p "¿Continuar de todas formas? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Detener Nginx temporalmente para evitar conflictos
print_status "Deteniendo Nginx temporalmente..."
systemctl stop nginx

# Obtener certificado
print_status "Obteniendo certificado SSL..."
certbot certonly --standalone \
    --preferred-challenges http \
    --email $EMAIL \
    --agree-tos \
    --no-eff-email \
    -d $DOMAIN \
    -d www.$DOMAIN

# Verificar que el certificado se obtuvo correctamente
if [ ! -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
    print_error "No se pudo obtener el certificado SSL"
    exit 1
fi

print_status "Certificado SSL obtenido correctamente"

# Copiar certificados al directorio del proyecto
print_status "Copiando certificados..."
mkdir -p /var/www/cibersegu/deployment/ssl
cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem /var/www/cibersegu/deployment/ssl/tu-dominio.crt
cp /etc/letsencrypt/live/$DOMAIN/privkey.pem /var/www/cibersegu/deployment/ssl/tu-dominio.key

# Actualizar configuración de Nginx
print_status "Actualizando configuración de Nginx..."
sed -i "s/tu-dominio.com/$DOMAIN/g" /var/www/cibersegu/deployment/nginx.conf

# Reiniciar servicios
print_status "Reiniciando servicios..."
cd /var/www/cibersegu/deployment
docker-compose restart nginx

# Configurar renovación automática
print_status "Configurando renovación automática..."

# Crear script de renovación
cat > /usr/local/bin/cibersegu-renew-ssl.sh << EOF
#!/bin/bash
# Renovar certificados SSL y reiniciar Nginx

certbot renew --quiet

# Copiar nuevos certificados
cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem /var/www/cibersegu/deployment/ssl/tu-dominio.crt
cp /etc/letsencrypt/live/$DOMAIN/privkey.pem /var/www/cibersegu/deployment/ssl/tu-dominio.key

# Reiniciar Nginx
cd /var/www/cibersegu/deployment
docker-compose restart nginx

echo "Certificados SSL renovados: \$(date)"
EOF

chmod +x /usr/local/bin/cibersegu-renew-ssl.sh

# Agregar a crontab para renovación automática
(crontab -l 2>/dev/null; echo "0 12 * * * /usr/local/bin/cibersegu-renew-ssl.sh") | crontab -

# Verificar que todo funcione
print_status "Verificando configuración..."
sleep 10

if curl -f https://$DOMAIN/health > /dev/null 2>&1; then
    print_status "✅ SSL configurado correctamente"
    print_status "🌐 Tu aplicación está disponible en: https://$DOMAIN"
else
    print_warning "⚠️  SSL configurado pero el health check falló"
    print_warning "Verifica los logs: docker-compose logs nginx"
fi

print_status "📋 Información adicional:"
echo "   - Certificados: /etc/letsencrypt/live/$DOMAIN/"
echo "   - Renovación: /usr/local/bin/cibersegu-renew-ssl.sh"
echo "   - Logs: docker-compose logs nginx"
echo "   - Test SSL: https://www.ssllabs.com/ssltest/analyze.html?d=$DOMAIN"

print_warning "⚠️  IMPORTANTE:"
echo "   - Los certificados se renuevan automáticamente"
echo "   - Verifica que el DNS esté configurado correctamente"
echo "   - Monitorea los logs para detectar problemas" 