# Plantilla de despliegue (Docker + Nginx) para Azure

Esta carpeta contiene una plantilla mínima y segura para que cualquier compañero despliegue el proyecto en una VM de Azure usando Docker Compose, con Nginx como proxy, certificados TLS y servicios `backend`, `frontend`, `websocket` y `mongodb`.

## Estructura

- `docker-compose.yml`: orquestación de servicios.
- `Dockerfile.backend`: ejemplo de imagen para `backend`.
- `Dockerfile.frontend`: ejemplo de imagen para `frontend`.
- `nginx.conf`: proxy reverso y estáticos del `frontend`.
- `env.example`: variables necesarias (copiar a `.env`).
- `ssl/`: carpeta para certificados TLS.
  - `README.md`: cómo crear/colocar certificados.
- `scripts/generate-self-signed.sh`: script para generar certificados autofirmados de prueba.

## Prerrequisitos

- Azure VM (Ubuntu recomendada), con puertos 80 y 443 abiertos en NSG/Firewall.
- Docker y Docker Compose instalados.
- DNS apuntando el dominio a la IP pública de la VM.

## Variables de entorno

1) Copia el archivo `env.example` a `.env` y completa valores reales. Nunca subas `.env` al repositorio.

## Certificados TLS

Tienes dos opciones:

1) Autofirmado (pruebas)

- Ejecuta:
```
bash scripts/generate-self-signed.sh ejemplo.midominio.com
```
- Esto creará clave y certificado en `ssl/self-signed/` y el `nginx.conf` los usará por defecto.

2) Let's Encrypt (producción)

- Detén servicios que usen 80/443 y emite un certificado con certbot en modo standalone:
```
sudo docker run --rm -it -p 80:80 -p 443:443 \
  -v $(pwd)/ssl/letsencrypt:/etc/letsencrypt \
  certbot/certbot certonly --standalone -d ejemplo.midominio.com --agree-tos -m tu_email@dominio.com --non-interactive
```
- Actualiza rutas de certificados en `nginx.conf` a `ssl/letsencrypt/live/ejemplo.midominio.com/fullchain.pem` y `privkey.pem`.

## Despliegue

1) Desde esta carpeta (`deployment/template`), crea `.env`:
```
cp env.example .env
```
2) Genera/coloca certificados según la opción elegida.

3) Construye e inicia en segundo plano:
```
docker compose up -d --build
```

4) Verifica:
```
curl -I http://localhost/health
curl -I https://TU_DOMINIO/health -k
```

## Notas

- En producción usa certificados válidos (Let's Encrypt). Reemplaza dominios en `nginx.conf`.
- No expongas MongoDB a Internet salvo que sea estrictamente necesario.
- Considera usar Azure Container Registry (ACR) y Azure Key Vault para secretos.
