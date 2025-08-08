#!/bin/bash

# Script rápido de verificación de salud
# Sistema de Firmas Electrónicas

echo "🔍 Verificación rápida del sistema..."

# Verificar contenedores
echo "📦 Contenedores:"
docker-compose -f /var/www/cibersegu/deployment/docker-compose.yml ps

echo ""
echo "🏥 Health Checks:"

# Verificar API
if curl -s -f http://localhost:3001/api/health > /dev/null 2>&1; then
    echo "✅ Backend API: OK"
else
    echo "❌ Backend API: ERROR"
fi

# Verificar Frontend
if curl -s -f http://localhost:80 > /dev/null 2>&1; then
    echo "✅ Frontend: OK"
else
    echo "❌ Frontend: ERROR"
fi

# Verificar MongoDB
if docker exec cibersegu_mongodb mongosh --eval "db.adminCommand('ping')" > /dev/null 2>&1; then
    echo "✅ MongoDB: OK"
else
    echo "❌ MongoDB: ERROR"
fi

echo ""
echo "📊 Estado general:"
docker-compose -f /var/www/cibersegu/deployment/docker-compose.yml ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}" 