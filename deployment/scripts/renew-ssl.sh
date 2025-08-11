#!/bin/bash

# Script para renovar certificados SSL de Let's Encrypt
# y copiarlos al directorio de nginx

set -e

echo "🔄 Iniciando renovación de certificados SSL..."

# Variables
DOMAIN="af-systemstechnology.com"
SSL_DIR="/home/santiago/cibersegu_app/deployment/ssl"
LETSENCRYPT_DIR="/etc/letsencrypt/live/$DOMAIN"

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
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

# Detener nginx temporalmente
print_status "Deteniendo nginx..."
cd /home/santiago/cibersegu_app/deployment
docker-compose stop nginx

# Renovar certificados
print_status "Renovando certificados SSL..."
certbot renew --quiet --standalone

# Verificar si la renovación fue exitosa
if [ $? -eq 0 ]; then
    print_status "Certificados renovados exitosamente"
    
    # Crear directorios si no existen
    mkdir -p $SSL_DIR/certs $SSL_DIR/private
    
    # Copiar certificados
    print_status "Copiando certificados..."
    cp $LETSENCRYPT_DIR/fullchain.pem $SSL_DIR/certs/$DOMAIN.crt
    cp $LETSENCRYPT_DIR/privkey.pem $SSL_DIR/private/$DOMAIN.key
    
    # Ajustar permisos
    chmod 644 $SSL_DIR/certs/$DOMAIN.crt
    chmod 600 $SSL_DIR/private/$DOMAIN.key
    
    # Reiniciar nginx
    print_status "Reiniciando nginx..."
    docker-compose up -d nginx
    
    print_status "✅ Renovación completada exitosamente"
else
    print_error "❌ Error en la renovación de certificados"
    # Reiniciar nginx de todas formas
    docker-compose up -d nginx
    exit 1
fi

echo "🔄 Renovación de certificados SSL completada: $(date)"
