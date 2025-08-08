#!/bin/bash

# Script de diagnóstico de base de datos
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

echo "🔍 Diagnóstico de Base de Datos - Sistema de Firmas Electrónicas"
echo "================================================================"

# Verificar si Docker está ejecutándose
if ! docker info > /dev/null 2>&1; then
    print_error "Docker no está ejecutándose"
    exit 1
fi

# Cambiar al directorio del proyecto
cd /var/www/cibersegu/deployment

echo ""
print_info "📊 Estado de los contenedores:"
docker-compose ps

echo ""
print_info "🔍 Verificando MongoDB:"

# Verificar si el contenedor de MongoDB está ejecutándose
if docker ps | grep -q cibersegu_mongodb; then
    print_status "Contenedor MongoDB está ejecutándose"
else
    print_error "Contenedor MongoDB NO está ejecutándose"
    exit 1
fi

# Verificar conectividad directa a MongoDB
echo ""
print_info "🔌 Verificando conectividad a MongoDB:"
if docker exec cibersegu_mongodb mongosh --eval "db.adminCommand('ping')" > /dev/null 2>&1; then
    print_status "MongoDB responde correctamente"
else
    print_error "MongoDB NO responde"
fi

# Verificar autenticación
echo ""
print_info "🔐 Verificando autenticación:"
if docker exec cibersegu_mongodb mongosh -u admin -p "MongoDB2024!@#Seguro" --authenticationDatabase admin --eval "db.adminCommand('ping')" > /dev/null 2>&1; then
    print_status "Autenticación exitosa"
else
    print_error "Error de autenticación"
fi

# Verificar base de datos específica
echo ""
print_info "📊 Verificando base de datos 'firmasDB':"
if docker exec cibersegu_mongodb mongosh -u admin -p "MongoDB2024!@#Seguro" --authenticationDatabase admin --eval "use firmasDB; db.stats()" > /dev/null 2>&1; then
    print_status "Base de datos 'firmasDB' accesible"
else
    print_error "No se puede acceder a la base de datos 'firmasDB'"
fi

# Verificar colecciones
echo ""
print_info "📋 Verificando colecciones:"
COLLECTIONS=$(docker exec cibersegu_mongodb mongosh -u admin -p "MongoDB2024!@#Seguro" --authenticationDatabase admin --eval "use firmasDB; db.getCollectionNames()" --quiet 2>/dev/null | grep -E 'usuarios|documentos|solicitudes|certificados' || echo "No se encontraron colecciones")

if [ "$COLLECTIONS" != "No se encontraron colecciones" ]; then
    print_status "Colecciones encontradas:"
    echo "$COLLECTIONS" | sed 's/^/   /'
else
    print_warning "No se encontraron colecciones principales"
fi

# Verificar variables de entorno del backend
echo ""
print_info "🔧 Verificando variables de entorno del backend:"
BACKEND_ENV=$(docker exec cibersegu_backend env | grep MONGODB_URI || echo "MONGODB_URI no encontrada")

if echo "$BACKEND_ENV" | grep -q "mongodb://admin:MongoDB2024"; then
    print_status "Variable MONGODB_URI configurada correctamente"
    echo "   URI: $(echo "$BACKEND_ENV" | cut -d'=' -f2-)"
else
    print_error "Variable MONGODB_URI no configurada o incorrecta"
fi

# Verificar logs de MongoDB
echo ""
print_info "📝 Logs recientes de MongoDB:"
docker-compose logs --tail=10 mongodb | sed 's/^/   /'

# Verificar logs del backend
echo ""
print_info "📝 Logs recientes del backend:"
docker-compose logs --tail=10 backend | grep -E "(MongoDB|Error|conexión)" | sed 's/^/   /' || echo "   No se encontraron logs relevantes"

# Verificar conectividad desde el backend
echo ""
print_info "🔍 Verificando conectividad desde el backend:"
if docker exec cibersegu_backend curl -s -f http://localhost:3001/api/health > /dev/null 2>&1; then
    HEALTH_RESPONSE=$(docker exec cibersegu_backend curl -s http://localhost:3001/api/health)
    DB_STATUS=$(echo "$HEALTH_RESPONSE" | grep -o '"database":"[^"]*"' | cut -d'"' -f4)
    
    case $DB_STATUS in
        "connected")
            print_status "Backend conectado a MongoDB correctamente"
            ;;
        "disconnected")
            print_warning "Backend no puede conectarse a MongoDB"
            ;;
        "error")
            print_error "Error en la conexión del backend a MongoDB"
            ;;
        *)
            print_warning "Estado de conexión desconocido: $DB_STATUS"
            ;;
    esac
else
    print_error "Backend no responde"
fi

# Verificar puertos
echo ""
print_info "🔌 Verificando puertos:"
netstat -tlnp | grep -E ':(27017|3001)' | while read line; do
    print_status "$line"
done

# Verificar red Docker
echo ""
print_info "🌐 Verificando red Docker:"
if docker network ls | grep -q cibersegu_network; then
    print_status "Red 'cibersegu_network' existe"
    docker network inspect cibersegu_network --format '{{range .Containers}}{{.Name}}: {{.IPv4Address}}{{end}}' | sed 's/^/   /'
else
    print_error "Red 'cibersegu_network' no existe"
fi

echo ""
echo "================================================================"
print_info "Diagnóstico completado"

# Resumen final
echo ""
print_info "📊 Resumen del diagnóstico:"
echo "   - Contenedor MongoDB: $(docker ps | grep -q cibersegu_mongodb && echo "✅" || echo "❌")"
echo "   - Conectividad MongoDB: $(docker exec cibersegu_mongodb mongosh --eval "db.adminCommand('ping')" > /dev/null 2>&1 && echo "✅" || echo "❌")"
echo "   - Autenticación: $(docker exec cibersegu_mongodb mongosh -u admin -p "MongoDB2024!@#Seguro" --authenticationDatabase admin --eval "db.adminCommand('ping')" > /dev/null 2>&1 && echo "✅" || echo "❌")"
echo "   - Backend conectado: $(docker exec cibersegu_backend curl -s -f http://localhost:3001/api/health > /dev/null 2>&1 && echo "✅" || echo "❌")"

echo ""
print_info "Comandos útiles para troubleshooting:"
echo "   - Ver logs de MongoDB: docker-compose logs -f mongodb"
echo "   - Ver logs del backend: docker-compose logs -f backend"
echo "   - Conectar a MongoDB: docker exec -it cibersegu_mongodb mongosh -u admin -p 'MongoDB2024!@#Seguro' --authenticationDatabase admin"
echo "   - Reiniciar servicios: docker-compose restart"
echo "   - Verificar health check: curl http://localhost:3001/api/health" 