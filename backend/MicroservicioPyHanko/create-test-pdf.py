#!/usr/bin/env python3
"""
Script para crear un PDF de prueba simple
"""

from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors

def create_test_pdf(output_path):
    """
    Crea un PDF de prueba simple
    """
    # Crear el PDF
    c = canvas.Canvas(output_path, pagesize=letter)
    width, height = letter
    
    # Título
    c.setFont("Helvetica-Bold", 16)
    c.drawString(100, height - 100, "Documento de Prueba - Digital Sign System")
    
    # Contenido
    c.setFont("Helvetica", 12)
    c.drawString(100, height - 150, "Este es un documento de prueba para validar el sistema de firma digital.")
    c.drawString(100, height - 170, "Fecha: 2024-01-01")
    c.drawString(100, height - 190, "Sistema: Digital Sign")
    c.drawString(100, height - 210, "Firmante: Sistema de Prueba")
    
    # Información adicional
    c.drawString(100, height - 250, "Este documento será firmado con nuestro sistema de firma digital")
    c.drawString(100, height - 270, "para probar la validación de PDFs.")
    
    # Guardar el PDF
    c.save()
    print(f"PDF de prueba creado: {output_path}")

if __name__ == "__main__":
    create_test_pdf("test-document.pdf")
    print("✅ PDF de prueba creado exitosamente") 