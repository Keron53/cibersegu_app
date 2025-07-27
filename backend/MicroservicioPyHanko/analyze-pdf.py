#!/usr/bin/env python3
"""
Script para analizar qué indicadores tiene un PDF específico
"""

import sys
import json
from pathlib import Path

def analyze_pdf_indicators(pdf_path):
    """
    Analiza todos los indicadores posibles en un PDF
    """
    try:
        print(f"Analizando PDF: {pdf_path}")
        
        # Leer el PDF como bytes
        with open(pdf_path, 'rb') as pdf_file:
            pdf_content = pdf_file.read()
        
        print(f"Tamaño del PDF: {len(pdf_content)} bytes")
        
        # Convertir a texto para búsqueda
        pdf_text = pdf_content.decode('utf-8', errors='ignore')
        
        # Buscar todos los indicadores posibles
        all_indicators = [
            # Indicadores de firma básicos
            b'/Sig', b'/Signature', b'/Type /Sig', b'/SubFilter', b'/Contents', b'/ByteRange',
            b'/Filter /Adobe.PPKLite', b'/Filter /Adobe.PPKMS',
            
            # Indicadores de sistemas
            b'Adobe', b'Acrobat', b'Microsoft', b'Foxit', b'PDF-XChange', b'Bluebeam',
            
            # Indicadores de nuestro sistema
            b'Digital Sign', b'QR Code', b'Digital Sign CA', b'CiberSegur', b'DigitalSign',
            b'pyHanko', b'Digital Sign System', b'Firmado electrónicamente',
            
            # Indicadores genéricos
            b'Certificate', b'PKCS', b'RSA', b'Digital', b'Sign', b'CA'
        ]
        
        found_indicators = []
        
        for indicator in all_indicators:
            if indicator in pdf_content:
                found_indicators.append(indicator.decode('utf-8', errors='ignore'))
        
        # Buscar patrones específicos en el texto
        text_patterns = [
            'Digital Sign', 'QR Code', 'pyHanko', 'CiberSegur', 'Adobe', 'Microsoft',
            'Certificate', 'Signature', 'Firmado', 'Digital'
        ]
        
        text_found = []
        for pattern in text_patterns:
            if pattern in pdf_text:
                text_found.append(pattern)
        
        return {
            "pdf_path": pdf_path,
            "size_bytes": len(pdf_content),
            "binary_indicators": found_indicators,
            "text_patterns": text_found,
            "total_binary_indicators": len(found_indicators),
            "total_text_patterns": len(text_found)
        }
        
    except Exception as e:
        print(f"Error analizando PDF: {str(e)}")
        return None

def main():
    if len(sys.argv) != 2:
        print("Uso: python analyze-pdf.py <ruta-del-pdf>")
        sys.exit(1)
    
    pdf_path = sys.argv[1]
    
    if not Path(pdf_path).exists():
        print(f"Error: El archivo {pdf_path} no existe")
        sys.exit(1)
    
    result = analyze_pdf_indicators(pdf_path)
    
    if result:
        print("\n=== ANÁLISIS DEL PDF ===")
        print(json.dumps(result, indent=2, ensure_ascii=False))
    else:
        print("Error en el análisis")

if __name__ == "__main__":
    main() 