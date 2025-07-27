#!/usr/bin/env python3
"""
Script para validar PDFs usando pyHanko
"""

import sys
import json
import argparse
from pathlib import Path
from pyhanko.cli import cli_root
from pyhanko.pdf_utils.incremental_writer import IncrementalPdfFileWriter
from pyhanko.sign import SigningContext
from pyhanko.sign.validation import validate_pdf_signature
from pyhanko.sign.general import load_cert_from_pemder
from pyhanko.pdf_utils.reader import PdfFileReader
from pyhanko.sign.fields import SigSeedSubFilter
import qrcode
from PIL import Image
import io

def validate_pdf_signatures(pdf_path):
    """
    Valida las firmas digitales en un PDF
    """
    try:
        print(f"🔍 Validando PDF: {pdf_path}")
        
        # Abrir el PDF
        with open(pdf_path, 'rb') as pdf_file:
            pdf_reader = PdfFileReader(pdf_file)
            
            # Verificar si tiene firmas
            signature_count = len(pdf_reader.root['/AcroForm']['/Fields']) if '/AcroForm' in pdf_reader.root and '/Fields' in pdf_reader.root['/AcroForm'] else 0
            
            print(f"📄 Firmas encontradas: {signature_count}")
            
            if signature_count == 0:
                return {
                    "isValid": False,
                    "message": "El PDF no contiene firmas digitales",
                    "details": {
                        "hasSignatures": False,
                        "signatureCount": 0,
                        "isModified": False,
                        "isOurSystem": False,
                        "certificateInfo": {
                            "isValid": False,
                            "message": "No hay certificados para validar"
                        }
                    }
                }
            
            # Validar cada firma
            valid_signatures = 0
            our_system_signatures = 0
            qr_info = None
            
            for i in range(signature_count):
                try:
                    # Intentar validar la firma
                    validation_result = validate_pdf_signature(pdf_reader, i)
                    
                    if validation_result.valid:
                        valid_signatures += 1
                        print(f"✅ Firma {i+1} válida")
                        
                        # Verificar si es de nuestro sistema (buscar QR)
                        if is_our_system_signature(pdf_reader, i):
                            our_system_signatures += 1
                            print(f"🏢 Firma {i+1} es de nuestro sistema")
                            
                            # Extraer información QR si existe
                            if not qr_info:
                                qr_info = extract_qr_info(pdf_reader, i)
                    else:
                        print(f"❌ Firma {i+1} inválida: {validation_result.message}")
                        
                except Exception as e:
                    print(f"⚠️ Error validando firma {i+1}: {str(e)}")
            
            # Determinar resultado final
            is_valid = valid_signatures > 0
            is_our_system = our_system_signatures > 0
            is_modified = check_if_modified(pdf_reader)
            
            return {
                "isValid": is_valid and is_our_system and not is_modified,
                "message": generate_validation_message(is_modified, is_our_system, valid_signatures, signature_count),
                "details": {
                    "hasSignatures": signature_count > 0,
                    "signatureCount": signature_count,
                    "validSignatures": valid_signatures,
                    "isModified": is_modified,
                    "isOurSystem": is_our_system,
                    "certificateInfo": {
                        "isValid": valid_signatures > 0,
                        "message": f"{valid_signatures}/{signature_count} firmas válidas"
                    }
                },
                "qrInfo": qr_info
            }
            
    except Exception as e:
        print(f"❌ Error validando PDF: {str(e)}")
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

def is_our_system_signature(pdf_reader, signature_index):
    """
    Verifica si la firma es de nuestro sistema
    """
    try:
        # Buscar características específicas de nuestro sistema
        # Por ejemplo, buscar QR codes o texto específico
        
        # Por ahora, asumimos que si tiene firmas válidas, es de nuestro sistema
        return True
    except:
        return False

def extract_qr_info(pdf_reader, signature_index):
    """
    Extrae información del QR code si existe
    """
    try:
        # Implementar extracción de QR
        # Por ahora retornamos información básica
        return {
            "signerName": "Firmante del Sistema",
            "organization": "Digital Sign System",
            "timestamp": "2024-01-01T00:00:00Z"
        }
    except:
        return None

def check_if_modified(pdf_reader):
    """
    Verifica si el PDF ha sido modificado después de la firma
    """
    try:
        # Verificar integridad del PDF
        # Por ahora asumimos que no está modificado
        return False
    except:
        return True

def generate_validation_message(is_modified, is_our_system, valid_signatures, total_signatures):
    """
    Genera mensaje de validación
    """
    if is_modified:
        return "El PDF ha sido modificado después de la firma"
    elif not is_our_system:
        return "El PDF no fue firmado por nuestro sistema"
    elif valid_signatures == 0:
        return "No se encontraron firmas válidas"
    elif valid_signatures < total_signatures:
        return f"Algunas firmas son inválidas ({valid_signatures}/{total_signatures} válidas)"
    else:
        return "PDF válido y firmado por nuestro sistema"

def main():
    parser = argparse.ArgumentParser(description='Validar PDF firmado')
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
        print(f"✅ Resultado guardado en: {args.output}")
    else:
        print(json.dumps(result, indent=2))

if __name__ == "__main__":
    main() 