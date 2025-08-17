#!/usr/bin/env bash
set -euo pipefail

DOMAIN="${1:-localhost}"
OUT_DIR="$(cd "$(dirname "$0")/.." && pwd)/ssl/self-signed"

mkdir -p "$OUT_DIR"

openssl req -x509 -newkey rsa:2048 -sha256 -days 365 \
  -nodes -keyout "$OUT_DIR/privkey.pem" -out "$OUT_DIR/fullchain.pem" \
  -subj "/CN=$DOMAIN" \
  -addext "subjectAltName=DNS:$DOMAIN,IP:127.0.0.1"

echo "Certificado autofirmado generado en: $OUT_DIR"


