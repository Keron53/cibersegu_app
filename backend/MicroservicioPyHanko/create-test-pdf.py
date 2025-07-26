#!/usr/bin/env python3
"""
Script para crear un PDF de prueba simple
"""

from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter

def create_test_pdf(filename):
    """Crea un PDF de prueba simple"""
    c = canvas.Canvas(filename, pagesize=letter)
    width, height = letter
    
    # Agregar texto al PDF
    c.setFont("Helvetica", 16)
    c.drawString(100, height - 100, "Documento de Prueba")
    
    c.setFont("Helvetica", 12)
    c.drawString(100, height - 150, "Este es un documento PDF de prueba para firmar con pyHanko.")
    c.drawString(100, height - 170, "Contenido de ejemplo para verificar la funcionalidad de firma digital.")
    
    c.save()
    print(f"✅ PDF de prueba creado: {filename}")

if __name__ == "__main__":
    create_test_pdf("test-document.pdf") 