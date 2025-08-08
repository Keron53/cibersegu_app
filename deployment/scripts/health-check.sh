#!/bin/bash

# Script de verificación de salud del sistema
# Sistema de Firmas Electrónicas

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para imprimir mensajes
print_status() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[⚠]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

print_info() {
    echo -e "${BLUE}[ℹ]${NC} $1"
}

echo "🔍 Verificando estado del Sistema de Firmas Electrónicas..."
echo "=================================================="

# Verificar si Docker está ejecutándose
if ! docker info > /dev/null 2>&1; then
    print_error "Docker no está ejecutándose"
    exit 1
fi

# Verificar si docker-compose está disponible
if ! command -v docker-compose > /dev/null 2>&1; then
    print_error "Docker Compose no está instalado"
    exit 1
fi

# Cambiar al directorio del proyecto
cd /var/www/cibersegu/deployment

# Verificar estado de los contenedores
echo ""
print_info "Estado de los contenedores:"
docker-compose ps

echo ""
print_info "Verificando health checks de los servicios:"

# Verificar MongoDB
echo ""
print_info "🔸 MongoDB:"
if docker exec cibersegu_mongodb mongosh --eval "db.adminCommand('ping')" > /dev/null 2>&1; then
    print_status "MongoDB está funcionando correctamente"
else
    print_error "MongoDB no responde"
fi

# Verificar Backend
echo ""
print_info "🔸 Backend (API):"
BACKEND_HEALTH=$(curl -s -f http://localhost:3001/api/health 2>/dev/null || echo "ERROR")
if [ "$BACKEND_HEALTH" != "ERROR" ]; then
    print_status "Backend está funcionando correctamente"
    echo "   Status: $(echo $BACKEND_HEALTH | jq -r '.status' 2>/dev/null || echo 'unknown')"
    echo "   Uptime: $(echo $BACKEND_HEALTH | jq -r '.uptime' 2>/dev/null || echo 'unknown')"
    echo "   Database: $(echo $BACKEND_HEALTH | jq -r '.services.database' 2>/dev/null || echo 'unknown')"
    echo "   Certificates: $(echo $BACKEND_HEALTH | jq -r '.services.certificates' 2>/dev/null || echo 'unknown')"
else
    print_error "Backend no responde"
fi

# Verificar Frontend
echo ""
print_info "🔸 Frontend:"
if curl -s -f http://localhost:80 > /dev/null 2>&1; then
    print_status "Frontend está funcionando correctamente"
else
    print_error "Frontend no responde"
fi

# Verificar Nginx
echo ""
print_info "🔸 Nginx (Proxy):"
if curl -s -f http://localhost:80/health > /dev/null 2>&1; then
    print_status "Nginx está funcionando correctamente"
else
    print_error "Nginx no responde"
fi

# Verificar puertos abiertos
echo ""
print_info "🔸 Puertos abiertos:"
netstat -tlnp | grep -E ':(80|443|3001|27017)' | while read line; do
    print_status "$line"
done

# Verificar logs recientes
echo ""
print_info "🔸 Logs recientes (últimas 5 líneas):"
echo "   Backend:"
docker-compose logs --tail=5 backend | sed 's/^/   /'

echo ""
echo "   Nginx:"
docker-compose logs --tail=5 nginx | sed 's/^/   /'

# Verificar uso de recursos
echo ""
print_info "🔸 Uso de recursos:"
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}"

# Verificar espacio en disco
echo ""
print_info "🔸 Espacio en disco:"
df -h /var/www/cibersegu | tail -1 | awk '{print "   Espacio usado: " $3 " de " $2 " (" $5 ")"}'

# Verificar certificados SSL
echo ""
print_info "🔸 Certificados SSL:"
if [ -f "./ssl/tu-dominio.crt" ]; then
    CERT_EXPIRY=$(openssl x509 -enddate -noout -in ./ssl/tu-dominio.crt | cut -d= -f2)
    print_status "Certificado SSL encontrado"
    echo "   Expira: $CERT_EXPIRY"
else
    print_warning "Certificado SSL no encontrado"
fi

echo ""
echo "=================================================="
print_info "Verificación completada"

# Resumen final
echo ""
print_info "📊 Resumen del sistema:"
echo "   - MongoDB: $(docker exec cibersegu_mongodb mongosh --eval "db.adminCommand('ping')" > /dev/null 2>&1 && echo "✅" || echo "❌")"
echo "   - Backend: $(curl -s -f http://localhost:3001/api/health > /dev/null 2>&1 && echo "✅" || echo "❌")"
echo "   - Frontend: $(curl -s -f http://localhost:80 > /dev/null 2>&1 && echo "✅" || echo "❌")"
echo "   - Nginx: $(curl -s -f http://localhost:80/health > /dev/null 2>&1 && echo "✅" || echo "❌")"

echo ""
print_info "Comandos útiles:"
echo "   - Ver logs en tiempo real: docker-compose logs -f"
echo "   - Reiniciar servicios: docker-compose restart"
echo "   - Ver estado detallado: docker-compose ps"
echo "   - Health check API: curl http://localhost:3001/api/health" 