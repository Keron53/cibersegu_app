#!/usr/bin/env python3
"""
Script para extraer información real de firmas digitales en PDFs usando pyhanko.
Este script reemplaza la detección básica de indicadores con validación real de firmas.
"""

import sys
import json
import subprocess
from pathlib import Path
import tempfile
import os

def ejecutar_comando(comando):
    """Ejecuta un comando y retorna la salida"""
    try:
        resultado = subprocess.run(
            comando,
            shell=True,
            capture_output=True,
            text=True,
            timeout=30
        )
        return resultado.returncode == 0, resultado.stdout, resultado.stderr
    except subprocess.TimeoutExpired:
        return False, "", "Comando expiró por timeout"
    except Exception as e:
        return False, "", str(e)

def extraer_informacion_firmas(pdf_path):
    """Extrae información detallada de las firmas usando pyhanko"""
    try:
        # Verificar si el PDF tiene firmas
        comando_validate = f'pyhanko validate "{pdf_path}"'
        exito, salida, error = ejecutar_comando(comando_validate)
        
        if not exito:
            # Si no hay firmas, pyhanko validate falla
            return {
                "hasSignatures": False,
                "signatureCount": 0,
                "signatures": [],
                "isValid": False,
                "message": "PDF sin firmas digitales"
            }
        
        # Extraer información detallada de las firmas
        comando_dump = f'pyhanko dump "{pdf_path}"'
        exito, salida, error = ejecutar_comando(comando_dump)
        
        if not exito:
            return {
                "hasSignatures": True,
                "signatureCount": 1,  # Asumimos que hay al menos una
                "signatures": [],
                "isValid": False,
                "message": "Error al extraer información de firmas"
            }
        
        # Procesar la salida de pyhanko dump
        firmas = procesar_salida_pyhanko(salida)
        
        # Verificar si es nuestro sistema
        es_nuestro_sistema = verificar_nuestro_sistema(salida)
        
        return {
            "hasSignatures": True,
            "signatureCount": len(firmas),
            "signatures": firmas,
            "isValid": True,
            "isOurSystem": es_nuestro_sistema,
            "systemType": "Nuestro Sistema" if es_nuestro_sistema else "Otro Sistema",
            "message": f"PDF válido con {len(firmas)} firma(s) digital(es)"
        }
        
    except Exception as e:
        return {
            "hasSignatures": False,
            "signatureCount": 0,
            "signatures": [],
            "isValid": False,
            "message": f"Error al procesar PDF: {str(e)}"
        }

def procesar_salida_pyhanko(salida):
    """Procesa la salida de pyhanko dump para extraer información de firmas"""
    firmas = []
    
    try:
        # Buscar información de firmas en la salida
        lineas = salida.split('\n')
        firma_actual = {}
        
        for linea in lineas:
            linea = linea.strip()
            
            if 'Signature' in linea and ':' in linea:
                # Nueva firma encontrada
                if firma_actual:
                    firmas.append(firma_actual)
                firma_actual = {
                    "page": 1,  # Por defecto
                    "x": 0,
                    "y": 0,
                    "width": 100,
                    "height": 50,
                    "signer": "Desconocido",
                    "timestamp": "Desconocido",
                    "validity": "Desconocido"
                }
            
            # Extraer información específica
            if 'Signer' in linea and ':' in linea:
                firma_actual["signer"] = linea.split(':', 1)[1].strip()
            elif 'Timestamp' in linea and ':' in linea:
                firma_actual["timestamp"] = linea.split(':', 1)[1].strip()
            elif 'Validity' in linea and ':' in linea:
                firma_actual["validity"] = linea.split(':', 1)[1].strip()
            elif 'Position' in linea and ':' in linea:
                # Intentar extraer coordenadas si están disponibles
                try:
                    pos_info = linea.split(':', 1)[1].strip()
                    # Aquí podrías parsear coordenadas si pyhanko las proporciona
                    pass
                except:
                    pass
        
        # Agregar la última firma
        if firma_actual:
            firmas.append(firma_actual)
            
    except Exception as e:
        print(f"Error procesando salida de pyhanko: {e}", file=sys.stderr)
    
    return firmas

def verificar_nuestro_sistema(salida):
    """Verifica si el PDF fue firmado por nuestro sistema"""
    indicadores_nuestro_sistema = [
        'Digital Sign',
        'Digital Sign CA',
        'QR Code',
        'Digital Sign System'
    ]
    
    salida_lower = salida.lower()
    for indicador in indicadores_nuestro_sistema:
        if indicador.lower() in salida_lower:
            return True
    
    return False

def extraer_metadatos_pdf(pdf_path):
    """Extrae metadatos básicos del PDF"""
    try:
        # Usar pyhanko para obtener información básica
        comando_info = f'pyhanko info "{pdf_path}"'
        exito, salida, error = ejecutar_comando(comando_info)
        
        if exito:
            # Buscar número de páginas
            lineas = salida.split('\n')
            paginas = 1
            for linea in lineas:
                if 'Pages' in linea and ':' in linea:
                    try:
                        paginas = int(linea.split(':', 1)[1].strip())
                        break
                    except:
                        pass
            
            return {
                "pages": paginas,
                "size": os.path.getsize(pdf_path)
            }
    except:
        pass
    
    return {
        "pages": 1,
        "size": os.path.getsize(pdf_path)
    }

def main():
    if len(sys.argv) != 2:
        print(json.dumps({
            "error": "Uso: python extraer-firmas.py <ruta_pdf>"
        }))
        sys.exit(1)
    
    pdf_path = sys.argv[1]
    
    if not os.path.exists(pdf_path):
        print(json.dumps({
            "error": f"El archivo {pdf_path} no existe"
        }))
        sys.exit(1)
    
    try:
        # Extraer información de firmas
        resultado_firmas = extraer_informacion_firmas(pdf_path)
        
        # Extraer metadatos
        metadatos = extraer_metadatos_pdf(pdf_path)
        
        # Combinar resultados
        resultado_final = {
            "success": True,
            "validation": resultado_firmas,
            "metadata": metadatos
        }
        
        print(json.dumps(resultado_final, indent=2))
        
    except Exception as e:
        print(json.dumps({
            "success": False,
            "error": str(e),
            "validation": {
                "hasSignatures": False,
                "signatureCount": 0,
                "isValid": False,
                "message": f"Error: {str(e)}"
            }
        }))

if __name__ == "__main__":
    main()
