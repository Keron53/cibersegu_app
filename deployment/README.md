# 🚀 Despliegue en Azure VM - Sistema de Firmas Electrónicas

Esta guía te ayudará a desplegar el sistema de firmas electrónicas en una máquina virtual de Azure con Nginx como proxy reverso y protección básica contra ataques.

## 📋 Prerrequisitos

### Azure VM
- **Sistema Operativo**: Ubuntu 20.04 LTS o superior
- **Tamaño mínimo**: Standard_B2s (2 vCPU, 4 GB RAM)
- **Disco**: 30 GB mínimo
- **Puertos abiertos**: 22 (SSH), 80 (HTTP), 443 (HTTPS)

### Dominio (Opcional pero recomendado)
- Un dominio configurado para apuntar a tu VM de Azure
- Para certificados SSL gratuitos con Let's Encrypt

## 🔧 Configuración Inicial

### 1. Conectar a la VM
```bash
ssh tu-usuario@tu-ip-azure
```

### 2. Actualizar el sistema
```bash
sudo apt update && sudo apt upgrade -y
```

### 3. Subir el proyecto
```bash
# Opción 1: Usando SCP
scp -r ./cibersegu_app tu-usuario@tu-ip-azure:/tmp/

# Opción 2: Clonar desde Git
git clone https://github.com/tu-usuario/cibersegu-app.git /tmp/cibersegu_app
```

## 🚀 Despliegue Automatizado

### Opción 1: Script de Despliegue Completo
```bash
# Dar permisos de ejecución
chmod +x deployment/scripts/deploy.sh

# Ejecutar como root
sudo ./deployment/scripts/deploy.sh
```

### Opción 2: Despliegue Manual con Docker Compose
```bash
# 1. Ir al directorio de deployment
cd deployment

# 2. Verificar que Docker esté funcionando
sudo docker --version
sudo docker-compose --version

# 3. Levantar los servicios
sudo docker-compose up -d

# 4. Verificar el estado
sudo docker-compose ps
```

### Configurar variables personalizadas
Antes de ejecutar el script, edita las variables en `deployment/scripts/deploy.sh`:

```bash
# Variables de configuración
DOMAIN="tu-dominio-real.com"
EMAIL="tu-email@gmail.com"
MONGODB_PASSWORD="password_muy_seguro_123"
JWT_SECRET="jwt_secret_muy_seguro_456"
EMAIL_PASSWORD="contraseña-de-aplicación-gmail"
```

### ⚠️ IMPORTANTE: Modificaciones Necesarias

#### 1. Corregir el script deploy.sh
Si el proyecto ya está en el directorio actual (no en `/tmp`), modifica el script:

```bash
# En deployment/scripts/deploy.sh, cambiar:
# Copiar el proyecto desde el directorio actual
print_status "Copiando proyecto desde directorio actual..."
cp -r /home/santiago/cibersegu_app/* /var/www/cibersegu/
```

#### 2. Corregir el Dockerfile del Backend
El archivo `backend/Dockerfile` necesita ser modificado para evitar errores:

```dockerfile
# Cambiar esta línea:
COPY CrearCACentral ./CrearCACentral/

# Por esta:
RUN mkdir -p CrearCACentral
```

## 🔒 Configuración de Seguridad

### Protecciones Implementadas

#### Nginx Rate Limiting
- **API general**: 10 requests/segundo
- **Login/Registro**: 5 requests/minuto
- **Uploads**: 2 requests/segundo
- **Burst**: Permite picos temporales

#### Fail2ban Protection
- **HTTP Auth**: Bloquea intentos de login fallidos
- **Rate Limiting**: Bloquea IPs que exceden límites
- **Bad Bots**: Bloquea bots maliciosos
- **No Script**: Bloquea ataques de inyección

#### Headers de Seguridad
- `X-Frame-Options`: Previene clickjacking
- `X-XSS-Protection`: Protección XSS
- `X-Content-Type-Options`: Previene MIME sniffing
- `Strict-Transport-Security`: Fuerza HTTPS
- `Content-Security-Policy`: Política de contenido seguro

#### Firewall (UFW)
- Solo puertos 22, 80, 443 abiertos
- Resto de puertos bloqueados

## 📁 Estructura de Archivos

```
/var/www/cibersegu/
├── deployment/
│   ├── docker-compose.yml      # Orquestación de servicios
│   ├── nginx.conf              # Configuración de Nginx
│   ├── ssl/                    # Certificados SSL
│   ├── fail2ban/               # Configuración Fail2ban
│   └── scripts/
│       └── deploy.sh           # Script de despliegue
├── backend/                    # Código del backend
├── frontend/                   # Código del frontend
└── uploads/                    # Archivos subidos
```

## 🔧 Comandos de Administración

### 📋 Comandos Diarios Útiles

#### Verificar estado de servicios
```bash
cd /var/www/cibersegu/deployment
sudo docker-compose ps
```

#### Ver logs en tiempo real
```bash
# Todos los servicios
sudo docker-compose logs -f

# Servicio específico
sudo docker-compose logs -f backend
sudo docker-compose logs -f nginx
sudo docker-compose logs -f frontend
sudo docker-compose logs -f mongodb
```

#### Reiniciar servicios
```bash
# Todos los servicios
sudo docker-compose restart

# Servicio específico
sudo docker-compose restart backend
sudo docker-compose restart nginx
```

#### Actualizar aplicación
```bash
cd /var/www/cibersegu
git pull
cd deployment
sudo docker-compose up -d --build
```

#### Backup manual
```bash
/usr/local/bin/cibersegu-backup.sh
```

### 🚀 Comandos de Emergencia

#### Reconstruir contenedor específico
```bash
# Backend
sudo docker-compose build --no-cache backend
sudo docker-compose up -d backend

# Frontend
sudo docker-compose build --no-cache frontend
sudo docker-compose up -d frontend
```

#### Limpiar Docker completamente
```bash
sudo docker-compose down
sudo docker system prune -a -f
sudo docker volume prune -f
sudo docker-compose up -d
```

#### Verificar uso de recursos
```bash
# Uso de CPU y memoria
sudo docker stats

# Espacio en disco
df -h

# Logs del sistema
sudo journalctl -u docker.service -f
```

#### Acceder a contenedores
```bash
# Backend
sudo docker-compose exec backend bash

# MongoDB
sudo docker-compose exec mongodb mongosh

# Nginx
sudo docker-compose exec nginx sh
```

## 🔐 Configuración SSL

### ✅ Certificados Let's Encrypt Configurados

El sistema ya tiene certificados SSL válidos configurados para `af-systemstechnology.com`.

#### Información del Certificado Actual
```bash
# Verificar certificado
openssl s_client -connect af-systemstechnology.com:443 -servername af-systemstechnology.com < /dev/null 2>/dev/null | openssl x509 -noout -dates

# Resultado esperado:
notBefore=Aug  7 21:07:01 2025 GMT
notAfter=Nov  5 21:07:00 2025 GMT
```

#### Renovación Automática
Los certificados se renuevan automáticamente todos los días a las 3:00 AM:
```bash
# Script de renovación
/home/santiago/cibersegu_app/deployment/scripts/renew-ssl.sh

# Log de renovaciones
tail -f /var/log/ssl-renewal.log
```

#### Configuración Manual (si es necesario)
```bash
# Detener nginx
sudo docker-compose stop nginx

# Renovar certificados
sudo certbot renew --standalone

# Copiar certificados
sudo cp /etc/letsencrypt/live/af-systemstechnology.com/fullchain.pem ssl/certs/af-systemstechnology.com.crt
sudo cp /etc/letsencrypt/live/af-systemstechnology.com/privkey.pem ssl/private/af-systemstechnology.com.key

# Reiniciar nginx
sudo docker-compose up -d nginx
```

### Certificados Self-Signed (Solo para Desarrollo)
Para entornos de desarrollo local, se pueden generar certificados self-signed:

```bash
# Generar certificados self-signed
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout ssl/tu-dominio.key \
    -out ssl/tu-dominio.crt \
    -subj "/C=EC/ST=Guayas/L=Guayaquil/O=TuEmpresa/CN=localhost"
```

## 📊 Monitoreo y Verificación

### ✅ Verificación Rápida del Sistema

#### Comandos de verificación inmediata
```bash
# 1. Verificar estado de contenedores
sudo docker-compose ps

# 2. Verificar health checks
curl -k https://localhost/health
curl -k https://localhost/api/health

# 3. Verificar logs sin errores
sudo docker-compose logs --tail=20

# 4. Verificar puertos abiertos
netstat -tlnp | grep -E ':(80|443|3001|27017)'
```

#### Estado esperado del sistema
```bash
# Salida esperada de docker-compose ps:
NAME                 STATUS                   PORTS
cibersegu_backend    Up X minutes (healthy)   3001/tcp
cibersegu_frontend   Up X minutes (healthy)   80/tcp
cibersegu_mongodb    Up X minutes (healthy)   0.0.0.0:27017->27017/tcp
cibersegu_nginx      Up X minutes (healthy)   0.0.0.0:80->80/tcp, 0.0.0.0:443->443/tcp
cibersegu_fail2ban   Up X minutes (healthy)
```

### Health Checks

#### Verificación rápida
```bash
# Script rápido
./scripts/quick-health.sh

# Verificación completa
./scripts/health-check.sh
```

#### Endpoints de Health Check
```bash
# Backend API
curl http://localhost:3001/api/health

# Frontend
curl http://localhost:80/health

# Nginx Proxy
curl http://localhost:80/health

# MongoDB
docker exec cibersegu_mongodb mongosh --eval "db.adminCommand('ping')"
```

#### Verificar estado de contenedores
```bash
# Ver todos los contenedores
docker-compose ps

# Ver health checks específicos
docker-compose ps --format "table {{.Name}}\t{{.Status}}\t{{.Health}}"
```

### Métricas básicas
```bash
# Uso de CPU y memoria
docker stats

# Espacio en disco
df -h

# Logs de Nginx
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

### Alertas de Fail2ban
```bash
# Ver IPs baneadas
sudo fail2ban-client status nginx-http-auth

# Desbanear IP
sudo fail2ban-client set nginx-http-auth unbanip IP_ADDRESS
```

## 🔧 Troubleshooting

### Problemas Comunes y Soluciones

#### ❌ Error: "checkEmailAvailability is not defined"
**Síntomas**: El backend no inicia y muestra este error en los logs
```bash
ReferenceError: checkEmailAvailability is not defined
```

**Solución**:
```bash
# 1. Detener contenedores
sudo docker-compose down

# 2. Reconstruir el backend sin cache
sudo docker-compose build --no-cache backend

# 3. Levantar servicios
sudo docker-compose up -d
```

#### ❌ Error: "cannot load certificate /etc/ssl/tu-dominio.crt"
**Síntomas**: Nginx se reinicia constantemente
```bash
nginx: [emerg] cannot load certificate "/etc/ssl/tu-dominio.crt"
```

**Solución**:
```bash
# 1. Crear directorio SSL
mkdir -p ssl

# 2. Generar certificados self-signed
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout ssl/tu-dominio.key \
    -out ssl/tu-dominio.crt \
    -subj "/C=EC/ST=Guayas/L=Guayaquil/O=TuEmpresa/CN=localhost"

# 3. Reiniciar nginx
sudo docker-compose restart nginx
```

#### ❌ Error: "failed to solve: failed to compute cache key: /CrearCACentral: not found"
**Síntomas**: Error al construir el contenedor del backend
```bash
failed to solve: failed to compute cache key: "/CrearCACentral": not found
```

**Solución**:
```bash
# 1. Editar backend/Dockerfile
# Cambiar esta línea:
COPY CrearCACentral ./CrearCACentral/

# Por esta:
RUN mkdir -p CrearCACentral

# 2. Reconstruir el backend
sudo docker-compose build --no-cache backend
```

#### ❌ Error: "cp: cannot overwrite non-directory"
**Síntomas**: Error al copiar archivos durante el despliegue
```bash
cp: cannot overwrite non-directory './deployment/nginx.conf' with directory
```

**Solución**:
```bash
# Modificar el script deploy.sh para usar la ruta correcta:
cp -r /home/santiago/cibersegu_app/* /var/www/cibersegu/
```

#### ❌ Servicios no inician
**Síntomas**: Contenedores en estado "Error" o "Unhealthy"

**Solución**:
```bash
# 1. Verificar logs
sudo docker-compose logs

# 2. Verificar puertos
netstat -tlnp

# 3. Reiniciar Docker
sudo systemctl restart docker

# 4. Limpiar y reconstruir
sudo docker-compose down
sudo docker system prune -a
sudo docker-compose up -d --build
```

#### ❌ Error de memoria insuficiente
**Síntomas**: Contenedores se cierran por falta de memoria

**Solución**:
```bash
# 1. Verificar uso de memoria
free -h

# 2. Limpiar Docker
sudo docker system prune -a

# 3. Aumentar swap (si es necesario)
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

#### ❌ Error de conexión a MongoDB
**Síntomas**: Backend no puede conectarse a la base de datos

**Solución**:
```bash
# 1. Verificar MongoDB
sudo docker exec cibersegu_mongodb mongosh --eval "db.adminCommand('ping')"

# 2. Reiniciar MongoDB
sudo docker-compose restart mongodb

# 3. Verificar variables de entorno
sudo docker-compose exec backend env | grep MONGODB
```

#### ❌ Error de permisos en certificados SSL
**Síntomas**: Nginx no puede leer los certificados

**Solución**:
```bash
# 1. Verificar permisos
ls -la ssl/

# 2. Corregir permisos
sudo chmod 644 ssl/tu-dominio.crt
sudo chmod 600 ssl/tu-dominio.key

# 3. Reiniciar nginx
sudo docker-compose restart nginx
```

## 📈 Optimización

### Configuración de Nginx
- **Gzip**: Compresión automática
- **Cache**: Archivos estáticos cacheados
- **Rate Limiting**: Protección contra DDoS
- **SSL**: Configuración optimizada

### Configuración de Docker
- **Volumes**: Datos persistentes
- **Networks**: Aislamiento de servicios
- **Health Checks**: Monitoreo automático

### Configuración de MongoDB
- **Autenticación**: Usuario y contraseña
- **Backup**: Automático diario
- **Logs**: Rotación automática

## 🔄 Actualizaciones

### Actualización automática
```bash
# Crear script de actualización
cat > /usr/local/bin/cibersegu-update.sh << 'EOF'
#!/bin/bash
cd /var/www/cibersegu
git pull
cd deployment
docker-compose up -d --build
echo "Actualización completada: $(date)"
EOF

chmod +x /usr/local/bin/cibersegu-update.sh
```

### Cron para actualizaciones
```bash
# Actualizar semanalmente
echo "0 3 * * 0 /usr/local/bin/cibersegu-update.sh" | crontab -
```

## 📞 Soporte

### Logs importantes
- **Nginx**: `/var/log/nginx/`
- **Docker**: `docker-compose logs`
- **Sistema**: `/var/log/syslog`

### Contacto
- **Issues**: GitHub del proyecto
- **Documentación**: Este README
- **Backup**: `/var/backups/cibersegu/`

## ✅ Checklist de Despliegue

- [ ] VM de Azure configurada
- [ ] Dominio configurado (opcional)
- [ ] Proyecto subido a la VM
- [ ] Variables de entorno configuradas
- [ ] Script de despliegue ejecutado
- [ ] SSL configurado
- [ ] Firewall configurado
- [ ] Backup configurado
- [ ] Monitoreo configurado
- [ ] Pruebas realizadas

## 🎉 ¡Listo!

Tu sistema de firmas electrónicas está ahora desplegado en Azure con:
- ✅ Proxy reverso con Nginx
- ✅ Protección contra ataques básicos
- ✅ Rate limiting y Fail2ban
- ✅ SSL/TLS configurado
- ✅ Backup automático
- ✅ Monitoreo básico
- ✅ Logs centralizados

## 📊 Resumen del Despliegue Exitoso

### ✅ Problemas Resueltos
1. **Error de Dockerfile**: Corregido el problema con el directorio `CrearCACentral` faltante
2. **Error de certificados SSL**: Generados certificados self-signed para desarrollo
3. **Error de función no definida**: Resuelto al reconstruir el contenedor del backend
4. **Error de rutas**: Corregido el script de despliegue para usar rutas correctas

### 🚀 Estado Final del Sistema
```bash
# Todos los servicios funcionando correctamente:
✅ cibersegu_backend    - Healthy (Backend Node.js)
✅ cibersegu_frontend   - Healthy (Frontend React)  
✅ cibersegu_mongodb    - Healthy (Base de datos MongoDB)
✅ cibersegu_nginx      - Healthy (Proxy Nginx)
✅ cibersegu_fail2ban   - Healthy (Protección contra ataques)
```

### 🌐 URLs de Acceso
- **Frontend**: `https://localhost` (o tu IP pública)
- **API Backend**: `https://localhost/api`
- **Health Check**: `https://localhost/health`
- **API Health**: `https://localhost/api/health`

### 🔧 Próximos Pasos Recomendados
1. ✅ **Configurar dominio real** - Completado: af-systemstechnology.com
2. ✅ **Obtener certificados SSL reales** - Completado: Let's Encrypt configurado
3. **Cambiar contraseñas por defecto** en producción
4. **Configurar email** para notificaciones
5. **Configurar backup automático** en ubicación externa
6. **Implementar monitoreo avanzado** (opcional)

### 📞 Soporte y Mantenimiento
- **Logs**: `sudo docker-compose logs -f`
- **Estado**: `sudo docker-compose ps`
- **Health Check**: `curl -k https://localhost/health`
- **Backup**: `/usr/local/bin/cibersegu-backup.sh` 