#!/bin/bash

# Script simple para probar baneo automático
# 3 intentos fallidos = 5 minutos de baneo

set -e

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}🔒 Prueba de baneo simple: 3 intentos = 5 minutos${NC}"
echo ""

# Función para hacer login fallido
make_failed_login() {
    local attempt=$1
    echo -n "Intento $attempt: "
    response=$(curl -sk -H "Host: af-systemstechnology.com" -X POST https://localhost/api/usuarios/login \
         -H "Content-Type: application/json" \
         -d '{"username":"fake","password":"fake"}' \
         -w "%{http_code}" -o /dev/null)
    echo "HTTP $response"
    return $response
}

# Función para verificar si IP está baneada
check_banned() {
    local ip=$1
    if sudo docker exec cibersegu_fail2ban fail2ban-client status nginx-login-failed 2>/dev/null | grep -q "$ip"; then
        echo -e "${RED}❌ IP $ip está BANEADA${NC}"
        return 0
    else
        echo -e "${GREEN}✅ IP $ip NO está baneada${NC}"
        return 1
    fi
}

# Función para desbanear
unban_ip() {
    local ip=$1
    echo -e "${YELLOW}🔓 Desbaneando IP $ip...${NC}"
    sudo docker exec cibersegu_fail2ban fail2ban-client set nginx-login-failed unbanip $ip
    sleep 2
}

# Limpiar baneos previos
echo -e "${YELLOW}🧹 Limpiando baneos previos...${NC}"
sudo docker exec cibersegu_fail2ban fail2ban-client set nginx-login-failed unbanip --all 2>/dev/null || true
sleep 2

echo -e "${GREEN}✅ Iniciando pruebas...${NC}"
echo ""

# Hacer 3 intentos fallidos
for i in {1..3}; do
    make_failed_login $i
    sleep 1
done

# Verificar si fue baneada
echo ""
echo -e "${YELLOW}🔍 Verificando baneo...${NC}"
sleep 3

if check_banned "127.0.0.1"; then
    echo -e "${GREEN}✅ Baneo automático funcionando!${NC}"
    echo -e "${YELLOW}⏰ IP baneada por 5 minutos${NC}"
    
    # Esperar un poco y desbanear para la siguiente prueba
    echo -e "${YELLOW}🔓 Desbaneando para siguiente prueba...${NC}"
    unban_ip "127.0.0.1"
else
    echo -e "${RED}❌ Baneo automático NO funcionó${NC}"
fi

echo ""
echo -e "${YELLOW}📊 Estado de Fail2ban:${NC}"
sudo docker exec cibersegu_fail2ban fail2ban-client status nginx-login-failed

echo ""
echo -e "${GREEN}✅ Prueba completada${NC}"
echo ""
echo -e "${YELLOW}💡 Para probar desde tu PC:${NC}"
echo "1..4 | ForEach-Object { curl.exe -sk -H \"Host: af-systemstechnology.com\" -X POST https://20.206.200.40/api/usuarios/login -H \"Content-Type: application/json\" -d '{\"username\":\"fake\",\"password\":\"fake\"}' -w \"%{http_code}\" -o NUL; Start-Sleep -Seconds 1 }" 