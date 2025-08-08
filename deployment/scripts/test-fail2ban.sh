#!/bin/bash

# Script para probar baneo automático de Fail2ban
# Uso: ./test-fail2ban.sh [IP_OPCIONAL]

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# IP para probar (por defecto localhost, o la IP proporcionada)
TEST_IP=${1:-"127.0.0.1"}
DOMAIN="af-systemstechnology.com"

echo -e "${YELLOW}🔒 Probando baneo automático de Fail2ban${NC}"
echo -e "${YELLOW}📡 IP de prueba: $TEST_IP${NC}"
echo -e "${YELLOW}🌐 Dominio: $DOMAIN${NC}"
echo ""

# Función para hacer request
make_request() {
    local endpoint=$1
    local method=${2:-"POST"}
    local data=${3:-""}
    
    if [ "$method" = "POST" ] && [ -n "$data" ]; then
        curl -sk -H "Host: $DOMAIN" -X POST "https://localhost$endpoint" \
             -H "Content-Type: application/json" \
             -d "$data" \
             -w "%{http_code}" \
             -o /dev/null
    else
        curl -sk -H "Host: $DOMAIN" -X GET "https://localhost$endpoint" \
             -w "%{http_code}" \
             -o /dev/null
    fi
}

# Función para verificar si IP está baneada
check_banned() {
    local ip=$1
    local jail=${2:-"nginx-api-login"}
    
    # Verificar en Fail2ban
    if sudo docker exec cibersegu_fail2ban fail2ban-client status $jail 2>/dev/null | grep -q "$ip"; then
        echo -e "${RED}❌ IP $ip está BANEADA en jail $jail${NC}"
        return 0
    else
        echo -e "${GREEN}✅ IP $ip NO está baneada en jail $jail${NC}"
        return 1
    fi
}

# Función para desbanear IP
unban_ip() {
    local ip=$1
    local jail=${2:-"nginx-api-login"}
    
    echo -e "${YELLOW}🔓 Desbaneando IP $ip del jail $jail...${NC}"
    sudo docker exec cibersegu_fail2ban fail2ban-client set $jail unbanip $ip
    sleep 2
}

# Función para mostrar estado de Fail2ban
show_fail2ban_status() {
    echo -e "${YELLOW}📊 Estado de Fail2ban:${NC}"
    sudo docker exec cibersegu_fail2ban fail2ban-client status
    echo ""
}

# Función para mostrar IPs baneadas
show_banned_ips() {
    echo -e "${YELLOW}🚫 IPs baneadas:${NC}"
    sudo docker exec cibersegu_fail2ban fail2ban-client status nginx-api-login | grep "Banned IP list" -A 10 || echo "No hay IPs baneadas"
    echo ""
}

# Limpiar IPs baneadas al inicio
echo -e "${YELLOW}🧹 Limpiando IPs baneadas previas...${NC}"
sudo docker exec cibersegu_fail2ban fail2ban-client set nginx-api-login unbanip --all 2>/dev/null || true
sudo docker exec cibersegu_fail2ban fail2ban-client set nginx-api-register unbanip --all 2>/dev/null || true
sudo docker exec cibersegu_fail2ban fail2ban-client set nginx-api-attack unbanip --all 2>/dev/null || true
sleep 2

echo -e "${GREEN}✅ Iniciando pruebas de baneo...${NC}"
echo ""

# 1. Prueba de login con credenciales falsas
echo -e "${YELLOW}🔐 Prueba 1: Ataque de fuerza bruta en login${NC}"
for i in {1..6}; do
    echo -n "Intento $i: "
    response=$(make_request "/api/usuarios/login" "POST" '{"username":"fake","password":"fake"}')
    echo "HTTP $response"
    
    if [ "$response" = "401" ] || [ "$response" = "400" ]; then
        echo -e "${RED}❌ Login fallido (esperado)${NC}"
    fi
    
    sleep 1
done

# Verificar si fue baneada
sleep 3
if check_banned "$TEST_IP" "nginx-api-login"; then
    echo -e "${GREEN}✅ Baneo automático funcionando para login${NC}"
    unban_ip "$TEST_IP" "nginx-api-login"
else
    echo -e "${RED}❌ Baneo automático NO funcionó para login${NC}"
fi

echo ""

# 2. Prueba de registro con datos inválidos
echo -e "${YELLOW}📝 Prueba 2: Ataque de fuerza bruta en registro${NC}"
for i in {1..4}; do
    echo -n "Intento $i: "
    response=$(make_request "/api/usuarios/registro" "POST" '{"username":"test","password":"123","email":"invalid"}')
    echo "HTTP $response"
    
    if [ "$response" = "400" ] || [ "$response" = "409" ]; then
        echo -e "${RED}❌ Registro fallido (esperado)${NC}"
    fi
    
    sleep 1
done

# Verificar si fue baneada
sleep 3
if check_banned "$TEST_IP" "nginx-api-register"; then
    echo -e "${GREEN}✅ Baneo automático funcionando para registro${NC}"
    unban_ip "$TEST_IP" "nginx-api-register"
else
    echo -e "${RED}❌ Baneo automático NO funcionó para registro${NC}"
fi

echo ""

# 3. Prueba de ataques generales a la API
echo -e "${YELLOW}⚔️ Prueba 3: Ataques generales a la API${NC}"
for i in {1..12}; do
    echo -n "Intento $i: "
    response=$(make_request "/api/usuarios/fake-endpoint" "POST" '{"data":"fake"}')
    echo "HTTP $response"
    
    if [ "$response" = "404" ] || [ "$response" = "401" ]; then
        echo -e "${RED}❌ Endpoint no existe (esperado)${NC}"
    fi
    
    sleep 0.5
done

# Verificar si fue baneada
sleep 3
if check_banned "$TEST_IP" "nginx-api-attack"; then
    echo -e "${GREEN}✅ Baneo automático funcionando para ataques generales${NC}"
    unban_ip "$TEST_IP" "nginx-api-attack"
else
    echo -e "${RED}❌ Baneo automático NO funcionó para ataques generales${NC}"
fi

echo ""

# Mostrar estado final
show_fail2ban_status
show_banned_ips

echo -e "${GREEN}✅ Pruebas completadas${NC}"
echo ""
echo -e "${YELLOW}💡 Para probar desde tu PC, ejecuta:${NC}"
echo "curl.exe -sk -H \"Host: af-systemstechnology.com\" -X POST https://20.206.200.40/api/usuarios/login -H \"Content-Type: application/json\" -d '{\"username\":\"fake\",\"password\":\"fake\"}'"
echo ""
echo -e "${YELLOW}🔍 Para ver logs de Fail2ban:${NC}"
echo "sudo docker exec cibersegu_fail2ban fail2ban-client status"
echo "sudo docker logs cibersegu_fail2ban" 