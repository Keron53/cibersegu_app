#!/bin/bash

# Configuración
NOMBRE="Hola"
DIAS_VALIDO=365
CONTRASENA="123456"
ARCHIVO_KEY="${NOMBRE}.key"
ARCHIVO_CRT="${NOMBRE}.crt"
ARCHIVO_P12="${NOMBRE}.p12"

# 1. Generar clave privada
echo "Generando clave privada..."
openssl genrsa -out $ARCHIVO_KEY 2048

# 2. Crear solicitud de certificado (opcional, no se usará aquí)
# openssl req -new -key $ARCHIVO_KEY -out ${NOMBRE}.csr

# 3. Crear certificado autofirmado
echo "Generando certificado autofirmado..."
openssl req -new -x509 -key $ARCHIVO_KEY -out $ARCHIVO_CRT -days $DIAS_VALIDO -subj "//CN=Hola"

# 4. Crear archivo .p12 con contraseña
echo "Empaquetando en archivo .p12..."
openssl pkcs12 -export -out $ARCHIVO_P12 \
  -inkey $ARCHIVO_KEY \
  -in $ARCHIVO_CRT \
  -name "$NOMBRE" \
  -passout pass:$CONTRASENA

echo "✅ Archivo generado: $ARCHIVO_P12 (contraseña: $CONTRASENA)"

# 5. Mostrar detalles del certificado
echo "🔍 Detalles del certificado:"
openssl x509 -in $ARCHIVO_CRT -noout -subject -dates