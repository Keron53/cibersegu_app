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

### Ejecutar el script de despliegue
```bash
# Dar permisos de ejecución
chmod +x deployment/scripts/deploy.sh

# Ejecutar como root
sudo ./deployment/scripts/deploy.sh
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

### Verificar estado de servicios
```bash
cd /var/www/cibersegu/deployment
docker-compose ps
```

### Ver logs en tiempo real
```bash
# Todos los servicios
docker-compose logs -f

# Servicio específico
docker-compose logs -f backend
docker-compose logs -f nginx
```

### Reiniciar servicios
```bash
# Todos los servicios
docker-compose restart

# Servicio específico
docker-compose restart backend
```

### Actualizar aplicación
```bash
cd /var/www/cibersegu
git pull
cd deployment
docker-compose up -d --build
```

### Backup manual
```bash
/usr/local/bin/cibersegu-backup.sh
```

## 🔐 Configuración SSL

### Certificados Self-Signed (Desarrollo)
El script genera automáticamente certificados self-signed para desarrollo.

### Let's Encrypt (Producción)
Para certificados SSL gratuitos:

```bash
# Instalar Certbot
sudo apt install certbot python3-certbot-nginx

# Obtener certificado
sudo certbot --nginx -d tu-dominio.com -d www.tu-dominio.com

# Renovar automáticamente
sudo crontab -e
# Agregar: 0 12 * * * /usr/bin/certbot renew --quiet
```

## 📊 Monitoreo

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

### Problemas comunes

#### Servicios no inician
```bash
# Verificar logs
docker-compose logs

# Verificar puertos
netstat -tlnp

# Reiniciar Docker
sudo systemctl restart docker
```

#### Error de certificados SSL
```bash
# Verificar certificados
openssl x509 -in ssl/tu-dominio.crt -text -noout

# Regenerar certificados
./deployment/scripts/deploy.sh
```

#### Problemas de memoria
```bash
# Verificar uso de memoria
free -h

# Limpiar Docker
docker system prune -a
```

#### Error de conexión a MongoDB
```bash
# Verificar MongoDB
docker exec cibersegu_mongodb mongosh --eval "db.adminCommand('ping')"

# Reiniciar MongoDB
docker-compose restart mongodb
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