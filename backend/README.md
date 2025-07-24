# Firma Digital de PDFs con PyHanko (Python)

## Flujo actualizado

1. El backend Node.js valida el certificado y prepara los datos.
2. El PDF, el certificado (.p12) y la contraseña se envían a un microservicio Python (PyHanko).
3. PyHanko firma el PDF digitalmente y lo devuelve al backend.
4. El backend entrega el PDF firmado al usuario.

## Dependencias eliminadas
- node-signpdf
- @signpdf/signpdf

## Nueva dependencia
- PyHanko (Python, instalar por separado)

## Próximos pasos
- Implementar el microservicio Python con PyHanko.
- Integrar la llamada HTTP desde Node.js a PyHanko. 