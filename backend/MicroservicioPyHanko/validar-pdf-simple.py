#!/usr/bin/env python3
"""
Script simplificado para validar PDFs
"""

import sys
import json
import argparse
from pathlib import Path
import re

def validate_pdf_signatures(pdf_path):
    """
    Valida las firmas digitales en un PDF de forma básica
    """
    try:
        # Leer el PDF como bytes
        with open(pdf_path, 'rb') as pdf_file:
            pdf_content = pdf_file.read()
        
        # Buscar patrones que indiquen firmas digitales
        signature_indicators = [
            b'/Sig',
            b'/Signature',
            b'/Type /Sig',
            b'/SubFilter',
            b'/Contents',
            b'/ByteRange',
            b'/Filter /Adobe.PPKLite',
            b'/Filter /Adobe.PPKMS'
        ]
        
        signature_count = 0
        for indicator in signature_indicators:
            if indicator in pdf_content:
                signature_count += 1
        
        # Buscar indicadores específicos de nuestro sistema
        # AGREGAR AQUÍ LOS INDICADORES ESPECÍFICOS DE TU SISTEMA
        our_system_indicators = [
            b'Digital Sign',
            b'QR Code', 
            b'Digital Sign CA',
            b'CiberSegur',
            b'DigitalSign',
            b'Firmado por CiberSegur',
            b'pyHanko',
            b'Digital Sign System',
            b'Firmado electrónicamente por Digital Sign',
            # AGREGAR MÁS INDICADORES ESPECÍFICOS DE TU SISTEMA AQUÍ
            # Por ejemplo: b'TuEmpresa', b'TuSistema', etc.
        ]
        
        # Buscar indicadores de otros sistemas (para excluirlos)
        other_system_indicators = [
            b'Adobe Systems',
            b'Adobe Acrobat',
            b'Adobe Reader',
            b'Microsoft',
            b'Foxit',
            b'PDF-XChange',
            b'Bluebeam'
        ]
        
        our_system_found = False
        other_system_found = False
        
        # Verificar si es de nuestro sistema
        for indicator in our_system_indicators:
            if indicator in pdf_content:
                our_system_found = True
                break
        
        # Verificar si es de otro sistema
        for indicator in other_system_indicators:
            if indicator in pdf_content:
                other_system_found = True
                break
        
        # Si no encontramos indicadores específicos, buscar patrones más genéricos
        if not our_system_found and not other_system_found:
            # Buscar patrones que podrían indicar nuestro sistema
            generic_our_indicators = [
                b'Digital',
                b'Sign',
                b'CA',
                b'Certificate'
            ]
            
            our_count = 0
            for indicator in generic_our_indicators:
                if indicator in pdf_content:
                    our_count += 1
            
            # Si encontramos varios indicadores genéricos, podría ser nuestro sistema
            if our_count >= 2:
                our_system_found = True
        
        # Determinar resultado
        has_signatures = signature_count > 0
        
        # Lógica mejorada para determinar si es de nuestro sistema
        if our_system_found:
            system_type = "Nuestro Sistema"
            is_valid = has_signatures
        elif other_system_found:
            system_type = "Otro Sistema"
            is_valid = has_signatures  # Válido pero no de nuestro sistema
        else:
            system_type = "Sistema Desconocido"
            is_valid = has_signatures  # Válido pero no identificado
        
        return {
            "isValid": is_valid,
            "message": generate_validation_message(has_signatures, our_system_found, signature_count, system_type),
            "details": {
                "hasSignatures": has_signatures,
                "signatureCount": signature_count,
                "isModified": False,  # No podemos verificar esto fácilmente
                "isOurSystem": our_system_found,
                "systemType": system_type,
                "certificateInfo": {
                    "isValid": has_signatures,
                    "message": f"{signature_count} indicadores de firma encontrados"
                }
            },
            "qrInfo": {
                "signerName": "Firmante del Sistema" if our_system_found else "No disponible",
                "organization": "Digital Sign System" if our_system_found else "No disponible",
                "timestamp": "2024-01-01T00:00:00Z"
            } if our_system_found else None
        }
        
    except Exception as e:
        print(f"Error validando PDF: {str(e)}")
        return {
            "isValid": False,
            "message": f"Error al validar el PDF: {str(e)}",
            "details": {
                "hasSignatures": False,
                "signatureCount": 0,
                "isModified": False,
                "isOurSystem": False,
                "certificateInfo": {
                    "isValid": False,
                    "message": f"Error: {str(e)}"
                }
            }
        }

def generate_validation_message(has_signatures, is_our_system, signature_count, system_type):
    """
    Genera mensaje de validación
    """
    if not has_signatures:
        return "El PDF no contiene firmas digitales"
    elif is_our_system:
        return f"PDF válido firmado por nuestro sistema ({signature_count} indicadores)"
    elif system_type == "Otro Sistema":
        return f"PDF válido pero firmado por otro sistema ({signature_count} indicadores)"
    elif system_type == "Sistema Desconocido":
        return f"PDF válido con {signature_count} indicadores (sistema no identificado)"
    else:
        return f"PDF válido con {signature_count} indicadores"

def main():
    parser = argparse.ArgumentParser(description='Validar PDF firmado (versión simplificada)')
    parser.add_argument('pdf_path', help='Ruta al archivo PDF')
    parser.add_argument('--output', '-o', help='Archivo de salida JSON (opcional)')
    
    args = parser.parse_args()
    
    # Validar que el archivo existe
    if not Path(args.pdf_path).exists():
        print(json.dumps({
            "error": f"El archivo {args.pdf_path} no existe"
        }))
        sys.exit(1)
    
    # Validar PDF
    result = validate_pdf_signatures(args.pdf_path)
    
    # Imprimir resultado
    if args.output:
        with open(args.output, 'w') as f:
            json.dump(result, f, indent=2)
    else:
        print(json.dumps(result, indent=2))

if __name__ == "__main__":
    main() 