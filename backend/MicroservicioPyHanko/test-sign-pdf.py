#!/usr/bin/env python3
"""
Script para firmar un PDF de prueba y analizar los indicadores que deja
"""

import sys
import json
from pathlib import Path

def create_simple_pdf():
    """
    Crea un PDF simple para pruebas
    """
    try:
        # Crear un PDF simple usando reportlab si está disponible
        try:
            from reportlab.pdfgen import canvas
            from reportlab.lib.pagesizes import letter
            
            c = canvas.Canvas("test-document.pdf", pagesize=letter)
            width, height = letter
            
            c.setFont("Helvetica-Bold", 16)
            c.drawString(100, height - 100, "Documento de Prueba - Tu Sistema")
            
            c.setFont("Helvetica", 12)
            c.drawString(100, height - 150, "Este documento será firmado con tu sistema.")
            c.drawString(100, height - 170, "Fecha: 2024-01-01")
            c.drawString(100, height - 190, "Sistema: Tu Sistema de Firma")
            
            c.save()
            print("✅ PDF de prueba creado: test-document.pdf")
            return True
            
        except ImportError:
            print("⚠️ reportlab no está instalado. Creando PDF simple...")
            # Crear un PDF simple sin dependencias
            with open("test-document.pdf", "wb") as f:
                f.write(b"%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n")
            print("✅ PDF simple creado: test-document.pdf")
            return True
            
    except Exception as e:
        print(f"❌ Error creando PDF: {e}")
        return False

def analyze_signed_pdf(pdf_path):
    """
    Analiza un PDF firmado para encontrar indicadores específicos
    """
    try:
        with open(pdf_path, 'rb') as f:
            content = f.read()
        
        # Buscar indicadores específicos
        indicators = [
            b'Digital Sign', b'QR Code', b'pyHanko', b'CiberSegur',
            b'Adobe', b'Microsoft', b'Certificate', b'Signature',
            b'Digital', b'Sign', b'CA', b'PKCS', b'RSA'
        ]
        
        found = []
        for indicator in indicators:
            if indicator in content:
                found.append(indicator.decode('utf-8', errors='ignore'))
        
        return {
            "pdf_path": pdf_path,
            "size_bytes": len(content),
            "indicators_found": found,
            "total_indicators": len(found)
        }
        
    except Exception as e:
        print(f"❌ Error analizando PDF: {e}")
        return None

def main():
    print("🔧 Herramienta de Análisis de Firmas")
    print("=" * 40)
    
    # Paso 1: Crear PDF de prueba
    print("\n1️⃣ Creando PDF de prueba...")
    if not create_simple_pdf():
        print("❌ No se pudo crear el PDF de prueba")
        return
    
    # Paso 2: Instrucciones para firmar
    print("\n2️⃣ Instrucciones para firmar:")
    print("   - Firma el archivo 'test-document.pdf' con tu sistema")
    print("   - Guarda el PDF firmado como 'test-signed.pdf'")
    print("   - Luego ejecuta: python test-sign-pdf.py analyze")
    
    # Paso 3: Si se solicita análisis
    if len(sys.argv) > 1 and sys.argv[1] == "analyze":
        signed_pdf = "test-signed.pdf"
        
        if not Path(signed_pdf).exists():
            print(f"❌ No se encontró el archivo: {signed_pdf}")
            print("   Por favor firma el PDF primero")
            return
        
        print(f"\n3️⃣ Analizando PDF firmado: {signed_pdf}")
        result = analyze_signed_pdf(signed_pdf)
        
        if result:
            print("\n📊 RESULTADO DEL ANÁLISIS:")
            print(json.dumps(result, indent=2, ensure_ascii=False))
            
            print("\n💡 INDICADORES ENCONTRADOS:")
            for indicator in result["indicators_found"]:
                print(f"   ✅ {indicator}")
            
            print("\n🔧 PRÓXIMOS PASOS:")
            print("   1. Agrega los indicadores específicos a validar-pdf-simple.py")
            print("   2. Prueba la validación con el PDF firmado")
        else:
            print("❌ Error en el análisis")

if __name__ == "__main__":
    main() 