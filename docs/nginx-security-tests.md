# Pruebas de seguridad Nginx (Windows y Linux)

Este documento describe cómo validar baneo por IP, bloqueo de User-Agent, bloqueo por cabeceras sospechosas y rate limiting en el proxy Nginx del despliegue.

Valores usados en los ejemplos:
- Dominio: af-systemstechnology.com
- IP pública: 20.206.200.40

## 1) Verificación básica

### Linux (desde la VM)
```bash
# Nginx proxy
curl -sk -H "Host: af-systemstechnology.com" https://localhost/health
# Backend API
curl -sk -H "Host: af-systemstechnology.com" https://localhost/api/health | jq . || curl -sk -H "Host: af-systemstechnology.com" https://localhost/api/health
```

### Windows (PowerShell desde tu PC)
```powershell
# Proxy
curl.exe -sk -H "Host: af-systemstechnology.com" https://20.206.200.40/health
# API
curl.exe -sk -H "Host: af-systemstechnology.com" https://20.206.200.40/api/health
```

## 2) Bloqueo por User-Agent
Regla en `deployment/nginx.conf` (bloquea bots comunes). Esperados: 403 con UA sospechoso y 200 con UA normal.

### Linux (VM)
```bash
# 403: UA sospechoso
curl -sk -A "python-requests/2.32" -H "Host: af-systemstechnology.com" https://localhost/api/health -i | head -n 1
# 200: UA navegador
curl -sk -A "Mozilla/5.0" -H "Host: af-systemstechnology.com" https://localhost/api/health -i | head -n 1
```

### Windows (PC)
```powershell
# 403
curl.exe -sk -A "python-requests/2.32" -H "Host: af-systemstechnology.com" https://20.206.200.40/api/health -i | Select-Object -First 1
# 200
curl.exe -sk -A "Mozilla/5.0" -H "Host: af-systemstechnology.com" https://20.206.200.40/api/health -i | Select-Object -First 1
```

## 3) Bloqueo por X-Forwarded-For sospechoso
La regla bloquea cabeceras privadas en `X-Forwarded-For`.

### Linux (VM)
```bash
curl -sk -H "Host: af-systemstechnology.com" -H "X-Forwarded-For: 192.168.1.10" https://localhost/api/health -i | head -n 1  # Esperado: 403
```

### Windows (PC)
```powershell
curl.exe -sk -H "Host: af-systemstechnology.com" -H "X-Forwarded-For: 192.168.1.10" https://20.206.200.40/api/health -i | Select-Object -First 1  # Puede devolver 403 si cabecera llega intacta
```

## 4) Rate limiting
En `nginx.conf`: zona `api` (10 r/s burst 20) y `login` (5 r/min burst 3). Esperados: 200 y algunos 503 bajo carga.

### Linux (VM)
```bash
# API general (ráfaga concurrente)
seq 50 | xargs -I{} -P20 bash -lc "curl -sk -H 'Host: af-systemstechnology.com' https://localhost/api/health -o /dev/null -w '%{http_code}\n'" | sort | uniq -c

# Login (más estricto)
seq 10 | xargs -I{} -P10 bash -lc "curl -sk -H 'Host: af-systemstechnology.com' -X POST https://localhost/api/usuarios/login -H 'Content-Type: application/json' -d '{\"username\":\"fake\",\"password\":\"fake\"}' -o /dev/null -w '%{http_code}\n'" | sort | uniq -c
```

### Windows (PC, PowerShell 7+)
```powershell
# API general
1..30 | ForEach-Object -Parallel { curl.exe -sk -H "Host: af-systemstechnology.com" https://20.206.200.40/api/health -o NUL -w "%{http_code}`n" } -ThrottleLimit 20 | Sort-Object | Group-Object | ForEach-Object { "{0} {1}" -f $_.Count, $_.Name }

# Login (más estricto)
1..10 | ForEach-Object -Parallel {
  $body = '{"username":"fake","password":"fake"}'
  curl.exe -sk -H "Host: af-systemstechnology.com" -X POST https://20.206.200.40/api/usuarios/login -H "Content-Type: application/json" -d $body -o NUL -w "%{http_code}`n"
} -ThrottleLimit 10 | Sort-Object | Group-Object | ForEach-Object { "{0} {1}" -f $_.Count, $_.Name }
```

## 5) Baneo por IP (geo $bad_client)
Editar `deployment/nginx.conf` dentro de `geo $bad_client { ... }`:
```
geo $bad_client {
    default 0;
    20.206.200.40 1;   # <— ejemplo: agregar tu IP para simular baneo (usa tu IP pública real)
}
```
Recargar y probar.

### Linux (VM)
```bash
cd /tmp/cibersegu_app/deployment
sudo docker-compose exec nginx nginx -s reload
curl -vk -A "Mozilla/5.0" -H "Host: af-systemstechnology.com" https://localhost/health   # conexión cerrada/444
```

### Windows (PC)
```powershell
curl.exe -vk -A "Mozilla/5.0" -H "Host: af-systemstechnology.com" https://20.206.200.40/health  # conexión cerrada/444
```
Quitar la línea de tu IP para desbanear y recargar Nginx.

## 6) Logs y Fail2ban

### Linux (VM)
```bash
cd /tmp/cibersegu_app/deployment
# Logs Nginx
sudo docker-compose logs --tail=200 nginx
# Access log (si está mapeado)
sudo grep -E " 403 | 444 | 503 " /var/lib/docker/volumes/deployment_nginx_logs/_data/access.log 2>/dev/null || true

# Fail2ban
sudo docker exec -it cibersegu_fail2ban fail2ban-client status
sudo docker exec -it cibersegu_fail2ban fail2ban-client status nginx-http-auth || true
```

## 7) Reversión rápida
```bash
cd /tmp/cibersegu_app/deployment
sudo docker-compose restart nginx
```

> Notas
> - Los ejemplos ya incluyen tu dominio e IP.
> - Para evitar caché del navegador al validar cambios visuales, usa modo incógnito o Ctrl+F5. 