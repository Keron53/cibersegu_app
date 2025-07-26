# Sistema de Firmas Electrónicas

Este proyecto es un sistema web completo para la gestión y aplicación de firmas electrónicas en documentos PDF. Cuenta con una arquitectura de cliente-servidor (frontend y backend) que permite a los usuarios subir, visualizar, descargar, eliminar y **firmar digitalmente** documentos PDF con certificados digitales.

## 🚀 Instalación

### Prerrequisitos

- **Node.js** 16+ y npm
- **Python** 3.8+ y pip
- **MongoDB** (local o Atlas)

### Instalación del Backend

```bash
cd backend
npm install
```

### Instalación de pyHanko (Python)

**Linux/Mac:**
```bash
cd backend/MicroservicioPyHanko
chmod +x install.sh
./install.sh
```

**Windows:**
```cmd
cd backend\MicroservicioPyHanko
install.bat
```

**Manual:**
```bash
cd backend/MicroservicioPyHanko
pip install -r requirements.txt
```

**Nota importante:** Los certificados generados con el sistema anterior pueden no ser compatibles con pyHanko debido a caracteres especiales. Para obtener firmas válidas, usa el nuevo endpoint `/api/certificados/generate-pyhanko` que genera certificados compatibles.

### Instalación del Frontend

```bash
cd frontend
npm install
```

### Configuración de la Base de Datos

1. Asegúrate de que MongoDB esté ejecutándose
2. El sistema creará automáticamente la CA interna en `backend/CrearCACentral/`

### Ejecución

**Backend:**
```bash
cd backend
npm start
```

**Frontend:**
```bash
cd frontend
npm run dev
```

El sistema estará disponible en:
- Frontend: http://localhost:5173
- Backend: http://localhost:3001

## 🔐 Firma Digital con pyHanko

El sistema ahora utiliza **pyHanko** (Python) para crear firmas digitales válidas que son reconocidas por Adobe y otros validadores de PDF.

### Flujo de Firma Digital

1. **Usuario selecciona posición**: Hace clic en el PDF para elegir dónde aparecerá la firma
2. **Extracción de datos**: El sistema extrae nombre y organización del certificado .p12
3. **Firma con pyHanko**: Se ejecuta el microservicio Python que:
   - Crea una firma digital criptográficamente válida
   - Integra un QR code con los datos del firmante
   - Posiciona el sello visual en las coordenadas exactas
4. **Descarga**: El PDF firmado se descarga automáticamente

### Características de la Firma

- ✅ **Firma Válida**: Adobe y otros lectores reconocen la firma como válida
- ✅ **QR Integrado**: El QR es parte del sello oficial de la firma
- ✅ **Posicionamiento Preciso**: El usuario elige exactamente dónde aparece
- ✅ **Datos del Certificado**: Nombre y organización se extraen automáticamente
- ✅ **Tamaño Configurable**: El usuario puede ajustar el tamaño del QR

### Estructura del Sello Visual

El sello incluye:
- **QR Code**: Contiene nombre, email y organización del firmante
- **Texto**: "Firmado electrónicamente por: [NOMBRE] [ORGANIZACIÓN]"
- **Validación**: "Validar únicamente con Digital Sign PUCESE"

### Dependencias

**Backend Node.js:**
- `child_process` (para ejecutar Python)
- `tmp` (archivos temporales)
- `node-forge` (extracción de datos del certificado)
- `pdf-lib` (cálculo de coordenadas)

**Microservicio Python:**
- `pyhanko>=1.8.0` (firma digital)
- `cryptography>=3.4.8` (operaciones criptográficas)

### Instalación de Python

```bash
# En el directorio backend/MicroservicioPyHanko
pip install -r requirements.txt
```

### Gestión de Certificados Digitales

El sistema ahora genera **certificados compatibles con pyHanko** usando OpenSSL directamente:

#### **Características de los Certificados:**

- **✅ Compatibles con pyHanko**: Todos los certificados generados son compatibles con el sistema de firma digital
- **🔐 RSA 2048 bits**: Claves criptográficas seguras
- **📋 Datos limpios**: Solo caracteres ASCII para máxima compatibilidad
- **🏢 Firmados por CA**: Todos los certificados están firmados por la CA interna del sistema
- **📦 Formato PKCS#12**: Estándar compatible con todos los sistemas

#### **Generación de Certificados:**

```bash
POST /api/certificados/generate
{
  "commonName": "Nombre del Usuario",
  "organization": "Organización",
  "organizationalUnit": "Departamento",
  "locality": "Ciudad",
  "state": "Provincia", 
  "country": "EC",
  "email": "usuario@ejemplo.com",
  "password": "contraseña_segura"
}
```

#### **Limpieza Automática de Datos:**

El sistema limpia automáticamente los datos para compatibilidad:
- **Nombres**: Solo letras, números y espacios
- **Organizaciones**: Sin caracteres especiales
- **Emails**: Solo caracteres válidos de email
- **Ubicaciones**: Solo texto alfanumérico

#### **Ventajas vs Certificados Anteriores:**

| Aspecto | Anterior (node-forge) | Actual (OpenSSL) |
|---------|----------------------|------------------|
| **Compatibilidad pyHanko** | ❌ Caracteres especiales | ✅ Solo ASCII |
| **Firma Digital** | ⚠️ Posibles errores | ✅ 100% compatible |
| **Estándar** | ⚠️ Formato variable | ✅ PKCS#12 estándar |
| **Validación** | ❌ Falla en pyHanko | ✅ Pasa todas las pruebas |

### Archivos del Sistema

- `backend/src/controllers/documentoController.js`: Controlador principal
- `backend/MicroservicioPyHanko/firmar-pdf.py`: Script de Python para pyHanko
- `backend/MicroservicioPyHanko/requirements.txt`: Dependencias Python
- `backend/CrearCACentral/ca.crt`: Certificado CA del sistema (no se sube al repo)

### Ventajas vs Implementación Anterior

| Aspecto | Anterior (Node.js) | Actual (pyHanko) |
|---------|-------------------|------------------|
| **Validez de Firma** | ❌ "Invalid" en Adobe | ✅ Válida en Adobe |
| **QR Code** | 📍 Posicionamiento libre | 🔗 Integrado en sello |
| **Estándar PDF** | ⚠️ Modificación post-firma | ✅ Cumple PDF/A |
| **Validación** | ❌ Falla validación criptográfica | ✅ Pasa validación |

### Notas Técnicas

- El certificado CA del sistema se copia temporalmente para cada firma
- Las coordenadas se convierten de canvas (frontend) a PDF (backend)
- El sistema mantiene compatibilidad con la interfaz existente
- Los archivos temporales se limpian automáticamente después de cada firma