#!/usr/bin/env python3
"""
Script para probar la compatibilidad de certificados .p12 con pyHanko
"""

import os
import sys
from pyhanko.sign import signers

def test_certificate(cert_path, password):
    """Prueba si un certificado .p12 es compatible con pyHanko"""
    print(f"[TEST] Probando certificado: {cert_path}")
    
    if not os.path.exists(cert_path):
        print(f"[ERROR] El archivo no existe: {cert_path}")
        return False
    
    if os.path.getsize(cert_path) == 0:
        print(f"[ERROR] El archivo está vacío: {cert_path}")
        return False
    
    print(f"[INFO] Tamaño del archivo: {os.path.getsize(cert_path)} bytes")
    
    try:
        # Intentar cargar el certificado sin CA primero
        print("[INFO] Intentando cargar certificado PKCS#12...")
        signer = signers.SimpleSigner.load_pkcs12(
            pfx_file=cert_path,
            passphrase=password.encode()
        )
        
        if signer is None:
            print("[ERROR] SimpleSigner.load_pkcs12 devolvió None")
            return False
        
        print("[OK] Certificado cargado exitosamente")
        
        # Intentar acceder al certificado de firma
        cert = signer.signing_cert
        if cert is None:
            print("[ERROR] No se pudo obtener el certificado de firma")
            return False
        
        print("[OK] Certificado de firma accesible")
        
        # Extraer información del certificado
        try:
            subj = getattr(cert.subject, 'native', {})
            cn = subj.get("common_name", "N/A")
            email = subj.get("email_address", "N/A")
            org = subj.get("organization_name", "N/A")
            
            print(f"[INFO] Información del certificado:")
            print(f"   - Nombre común: {cn}")
            print(f"   - Email: {email}")
            print(f"   - Organización: {org}")
            
        except Exception as e:
            print(f"[WARN] No se pudieron extraer datos del certificado: {e}")
        
        print("[OK] Certificado compatible con pyHanko")
        return True
        
    except ValueError as e:
        print(f"[ERROR] ValueError: {e}")
        print("[INFO] Esto puede indicar:")
        print("   - Contraseña incorrecta")
        print("   - Formato de certificado incompatible")
        print("   - Caracteres especiales en los datos del certificado")
        return False
        
    except Exception as e:
        print(f"[ERROR] {e}")
        return False

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Uso: python test-certificate.py cert.p12 password")
        sys.exit(1)
    
    cert_path = sys.argv[1]
    password = sys.argv[2]
    
    success = test_certificate(cert_path, password)
    
    if success:
        print("\n[SUCCESS] El certificado es compatible con pyHanko")
        sys.exit(0)
    else:
        print("\n[FAIL] El certificado NO es compatible con pyHanko")
        sys.exit(1) 