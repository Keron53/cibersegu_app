Coloca aquí tus certificados TLS.

Estructuras soportadas por la plantilla:

1) Autofirmado (por defecto del template)
- `ssl/self-signed/fullchain.pem`
- `ssl/self-signed/privkey.pem`

2) Let's Encrypt
- `ssl/letsencrypt/live/TU_DOMINIO/fullchain.pem`
- `ssl/letsencrypt/live/TU_DOMINIO/privkey.pem`

Recuerda actualizar las rutas en `deployment/template/nginx.conf` si cambias la ubicación.


