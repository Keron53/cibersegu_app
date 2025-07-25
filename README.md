# Sistema de Firmas Electrónicas

Este proyecto es un sistema web completo para la gestión y aplicación de firmas electrónicas en documentos PDF. Cuenta con una arquitectura de cliente-servidor (frontend y backend) que permite a los usuarios subir, visualizar, descargar, eliminar y **firmar digitalmente** documentos PDF con certificados digitales.

## Características Actuales

- **Autenticación de Usuarios:** Registro, inicio y cierre de sesión seguro mediante tokens JWT.
- **Gestión de Documentos:**
  - Subida de documentos PDF.
  - Visualización de documentos en el navegador.
  - Descarga de documentos.
  - Eliminación de documentos (borrado suave).
  - **Documentos asociados a usuarios:** Cada usuario solo puede gestionar sus propios documentos.
  - **Estado de firma visual:** Los documentos muestran claramente si están firmados o listos para firmar.
- **Gestión de Certificados Digitales:**
  - Subida de certificados digitales (.p12) con cifrado seguro.
  - Generación de certificados digitales personalizados desde la interfaz web.
  - Descarga de certificados generados.
  - **Lista de certificados:** Visualización de todos los certificados del usuario.
  - **Descarga segura:** Descarga de certificados almacenados con validación de contraseña.
  - **Eliminación de certificados:** Gestión completa del ciclo de vida de certificados.
  - Almacenamiento seguro con cifrado AES-256-CBC.
- **🆕 Firma Digital Completa:**
  - **Posicionamiento visual:** Interfaz intuitiva para seleccionar la posición exacta de la firma en el PDF.
  - **Vista previa en tiempo real:** Caja arrastrable que muestra cómo se verá la firma.
  - **Selección de certificado:** Elección del certificado digital a utilizar para la firma.
  - **Validación de contraseña:** Verificación segura de la contraseña del certificado.
  - **Generación de QR:** Código QR con toda la información de la firma para validación.
  - **Firma visual:** Aplicación de la firma digital directamente en el PDF.
  - **Información detallada:** Modal con todos los detalles de la firma aplicada.
- **Modo Oscuro/Claro:** Interfaz adaptable a las preferencias del usuario.

## Arquitectura del Sistema

El sistema sigue una arquitectura de componentes separados para el frontend y el backend, comunicándose a través de una API RESTful.

![Arquitectura de la Aplicación](./docs/arquitectura-app.jpg)

## Estructura del Backend (Node.js con Express y MongoDB)

El backend está construido con Node.js, utilizando el framework Express para las rutas API y Mongoose como ODM para interactuar con una base de datos MongoDB.

-   **`backend/src/app.js`**: Archivo principal de la aplicación. Configura Express, los middlewares y las rutas principales.
-   **`backend/src/config/db.js`**: Contiene la lógica para establecer la conexión con la base de datos MongoDB utilizando Mongoose.
-   **`backend/src/models/`**: Define los esquemas y modelos de Mongoose para las colecciones de la base de datos:
    -   `Usuario.js`: Define el esquema de usuario.
    -   `Documento.js`: Define el esquema de documento, incluyendo `nombre`, `ruta`, `usuario` (referencia al userId), `hash` (para verificar integridad futura), `estado` (activo/eliminado) y timestamps (`createdAt`, `updatedAt`).
    -   `TokenInvalidado.js`: Almacena tokens JWT que han sido invalidados (ej. por logout).
-   **`backend/src/controllers/`**: Contiene la lógica de negocio para manejar las solicitudes de los clientes. Aquí se procesan las operaciones relacionadas con usuarios (registro, login, logout), documentos (subir, listar, ver, eliminar) y certificados (subir, generar, listar, descargar, eliminar), asegurando que cada usuario interactúe solo con sus propios recursos y con borrado suave para documentos.
-   **`backend/src/api/`**: Define las rutas específicas de la API para cada recurso. Por ejemplo, `usuarioRoutes.js`, `documentoRoutes.js` y `certificadoRoutes.js` manejan las operaciones CRUD para usuarios, documentos y certificados, respectivamente.
-   **`backend/src/middleware/`**: Contiene middlewares como `auth.js` para la verificación de tokens JWT y la protección de rutas.
-   **`backend/src/utils/`**: Contiene utilidades como `CertificateManager.js` para el manejo seguro de certificados digitales (cifrado, descifrado, almacenamiento).
-   **`backend/uploads/`**: Directorio donde se almacenan físicamente los documentos PDF subidos por los usuarios.
-   **`backend/CrearCertificado/`**: Scripts para generar certificados de prueba desde la línea de comandos.

## Estructura del Frontend (React con TypeScript y Tailwind CSS)

El frontend es una aplicación de React construida con TypeScript y estilizada con Tailwind CSS, ofreciendo una experiencia de usuario moderna y responsiva.

-   **`frontend/src/App.tsx`**: Componente raíz de la aplicación. Configura el enrutamiento (`react-router-dom`), provee el contexto del tema y la autenticación a toda la aplicación.
-   **`frontend/src/pages/`**: Contiene los componentes de página de nivel superior que corresponden a las rutas de la aplicación (ej. `LoginPage.tsx`, `RegisterPage.tsx`).
-   **`frontend/src/components/`**: Almacena componentes UI reutilizables. Esto incluye subcarpetas para:
    -   **`components/home/`**: Contiene `HomePage.tsx`, la página principal para la gestión de documentos y certificados.
    -   **`components/layout/`**: Componentes relacionados con el diseño general de la aplicación, como la barra de navegación (`Navigation.tsx`) y notificaciones (`Notification.tsx`).
    -   **`components/documentos/`**: Componentes específicos para la interacción con documentos, como `DocumentUpload.tsx` (subida), `DocumentList.tsx` (listado) y `PDFViewer.tsx` (visor).
        - **`PDFSignatureViewer.jsx`**: Visor modal para posicionar firmas digitales en PDFs con interfaz horizontal
        - **`SignatureConfirmationModal.jsx`**: Modal de confirmación con detalles de firma y validación de contraseña
        - **`QRCodeGenerator.jsx`**: Generador de códigos QR para validación de firmas
    -   **`components/certificados/`**: Componentes específicos para la gestión de certificados digitales, como `CertificateUpload.jsx` (subida), `CertificateGenerator.jsx` (generación), y `CertificateList.jsx` (listado y gestión).
    -   **`components/auth/`**: Componentes de autenticación como formularios de login y registro.
    -   **`components/login/`** y **`components/register/`**: Páginas específicas para autenticación.
-   **`frontend/src/context/ThemeContext.tsx`**: Provee un contexto React para gestionar el estado del tema (claro/oscuro) a través de la aplicación.
-   **`frontend/src/services/api.ts`**: Contiene los servicios para interactuar con la API del backend, incluyendo `authService` para la autenticación y `documentoService` para las operaciones de documentos. Utiliza Axios para las peticiones HTTP.
-   **`tailwind.config.js`**: Archivo de configuración de Tailwind CSS, donde se definen las rutas de los archivos que Tailwind debe escanear para generar los estilos, y se pueden personalizar colores, tipografías, etc.

## Funcionalidades de Firma Digital Implementadas ✅

El sistema ya cuenta con funcionalidades completas de firma electrónica:

### **Proceso de Firma Digital:**

1. **Selección de Documento:** El usuario selecciona un documento PDF de su lista.
2. **Posicionamiento de Firma:** 
   - Interfaz modal horizontal con visor de PDF y panel de información
   - Selección visual de la posición exacta donde se aplicará la firma
   - Vista previa arrastrable de la firma con QR code
   - Navegación entre páginas del PDF
3. **Selección de Certificado:** Elección del certificado digital a utilizar.
4. **Validación de Contraseña:** Verificación segura de la contraseña del certificado.
5. **Aplicación de Firma:** 
   - Generación de código QR con información de la firma
   - Aplicación visual de la firma en el PDF
   - Almacenamiento de metadatos de firma en la base de datos
6. **Confirmación:** Modal con detalles completos de la firma aplicada.

### **Características Técnicas:**

- **Posicionamiento preciso:** Coordenadas exactas en el PDF
- **QR Code de validación:** Contiene toda la información de la firma
- **Metadatos completos:** Firmante, fecha, certificado, validador, etc.
- **Validación de integridad:** Verificación de la contraseña del certificado
- **Interfaz responsiva:** Modales compactos y adaptables
- **Estado visual:** Los documentos muestran claramente si están firmados

## Flujo Completo de Firma Digital

### **1. Preparación:**
- Usuario sube un documento PDF
- Usuario sube o genera un certificado digital (.p12)

### **2. Proceso de Firma:**
1. **Selección:** Usuario hace clic en "Firmar" en un documento
2. **Posicionamiento:** Modal horizontal se abre con:
   - Visor de PDF a la izquierda
   - Panel de información a la derecha
   - Botón "Seleccionar Posición" para activar el modo de posicionamiento
3. **Selección de Posición:** 
   - Usuario hace clic en el PDF donde quiere la firma
   - Aparece una caja arrastrable con vista previa de la firma
   - Botón "Confirmar Posición" para continuar
4. **Selección de Certificado:**
   - Si hay múltiples certificados, se muestra selector
   - Si hay solo uno, se selecciona automáticamente
5. **Validación de Contraseña:**
   - Modal de confirmación con detalles de la firma
   - Campo para ingresar contraseña del certificado
   - Validación en tiempo real con el backend
6. **Aplicación de Firma:**
   - Se aplica la firma visual al PDF
   - Se genera código QR con metadatos
   - Se guarda información en la base de datos
7. **Confirmación:**
   - Modal con detalles completos de la firma
   - Código QR para validación
   - Información del certificado utilizado

### **3. Resultado:**
- Documento PDF firmado digitalmente
- Estado visual actualizado: "Documento firmado" en lugar de "Listo para firmar"
- Código QR para validación de la firma
- Metadatos completos almacenados

## Próximos Pasos (Mejoras Futuras)

Con la base actual completamente funcional, las siguientes mejoras podrían implementarse:

- **Verificación de firmas:** Validación de documentos firmados por otros usuarios
- **Múltiples firmantes:** Soporte para firmas múltiples en un mismo documento
- **Plantillas de firma:** Posiciones predefinidas para tipos de documentos
- **Auditoría avanzada:** Historial detallado de todas las operaciones de firma
- **Integración con servicios externos:** Validación con autoridades certificadoras

## Configuración y Ejecución

Para levantar el proyecto, sigue los siguientes pasos:

### Backend

1.  Navega a la carpeta `backend`:
    `cd backend`
2.  Instala las dependencias:
    `npm install`
3.  Inicia el servidor (asegúrate de que MongoDB esté corriendo):
    `node src/app.js`

### Frontend

1.  Navega a la carpeta `frontend`:
    `cd frontend`
2.  Instala las dependencias:
    `npm install`
3.  Inicia la aplicación React:
    `npm run dev`

La aplicación estará disponible en `http://localhost:5173` (frontend) y la API en `http://localhost:3001/api` (backend).

### Rutas Disponibles

#### Frontend
- **`/`** - Página de login (redirige desde la raíz)
- **`/login`** - Página de inicio de sesión
- **`/register`** - Página de registro
- **`/home`** - Página principal con gestión de documentos y certificados
- **`/certificado`** - Subida de certificados digitales
- **`/generar-certificado`** - Generación de certificados personalizados
- **`/mis-certificados`** - Gestión de certificados almacenados

#### Backend API
- **`/api/usuarios/*`** - Gestión de usuarios (login, registro, logout)
- **`/api/documentos/*`** - Gestión de documentos PDF
  - **`/api/documentos/:id/firmar`** - Aplicar firma digital a un documento
  - **`/api/documentos/:id/info-pdf`** - Obtener información del PDF (páginas, dimensiones)
- **`/api/certificados/*`** - Gestión de certificados digitales
  - **`/api/certificados/:id/validate-password`** - Validar contraseña de certificado

## Notas
- Asegúrate de tener MongoDB corriendo localmente en el puerto 27017.
- El archivo `.gitignore` está configurado para ignorar dependencias, archivos sensibles y la carpeta `backend/uploads/` donde se guardan los PDFs.

## Generar un certificado de prueba (.p12)

En la carpeta `backend/CrearCertificado` se encuentra el script `crear_certificado_prueba.sh` que permite generar un certificado digital de prueba en formato `.p12`.

### ¿Qué hace el script?
- Genera una clave privada RSA de 2048 bits.
- Crea un certificado autofirmado.
- Empaqueta la clave y el certificado en un archivo `.p12` protegido con contraseña.
- Muestra los detalles del certificado generado.

### ¿Cómo ejecutarlo?

1. Abre una terminal y navega a la carpeta del script:
   ```bash
   cd backend/CrearCertificado
   ```
2. Da permisos de ejecución al script (solo la primera vez):
   ```bash
   chmod +x crear_certificado_prueba.sh
   ```
3. Ejecuta el script:
   ```bash
   ./crear_certificado_prueba.sh
   ```

Esto generará los archivos `Hola.key`, `Hola.crt` y `Hola.p12` en la misma carpeta. La contraseña por defecto del archivo `.p12` es `123456` (puedes modificarla editando el script).

## Generar Certificados desde la Interfaz Web

El sistema incluye una funcionalidad completa para generar certificados digitales directamente desde la interfaz web:

### Características del Generador
- **Formulario completo** para configurar todos los datos del certificado:
  - Información personal (nombre común, email)
  - Información organizacional (empresa, departamento)
  - Ubicación (ciudad, provincia, país)
  - Configuración (validez, contraseña)
- **Generación automática** de certificados autofirmados
- **Descarga directa** del archivo .p12 generado
- **Subida automática** al sistema tras la generación
- **Validaciones** de seguridad y formato

### Cómo usar el Generador
1. Desde la página principal, haz clic en "Generar Nuevo Certificado"
2. Completa el formulario con tus datos
3. Establece una contraseña segura (mínimo 6 caracteres)
4. Haz clic en "Generar Certificado"
5. Una vez generado, puedes:
   - Descargar el certificado directamente
   - Subirlo automáticamente al sistema

### Seguridad
- Los certificados generados son autofirmados
- Se utilizan claves RSA de 2048 bits
- El archivo .p12 está protegido con la contraseña que elijas
- Cumple con estándares PKCS#12 para máxima compatibilidad

## Gestión de Certificados Almacenados

El sistema incluye una funcionalidad completa para gestionar todos los certificados digitales almacenados:

### Características de la Gestión
- **Lista de Certificados:** Visualiza todos tus certificados subidos y generados
- **Descarga Segura:** Descarga certificados almacenados con validación de contraseña
- **Eliminación:** Elimina certificados que ya no necesites
- **Información Detallada:** Fecha de creación, nombre del archivo
- **Interfaz Intuitiva:** Diseño moderno con modo oscuro/claro

### Cómo Gestionar Certificados
1. Desde la página principal, haz clic en "Ver Mis Certificados"
2. En la lista verás todos tus certificados con fecha de creación
3. Para cada certificado puedes:
   - **Descargar:** Haz clic en "Descargar" e ingresa la contraseña
   - **Eliminar:** Haz clic en "Eliminar" y confirma la acción
4. Los certificados se muestran ordenados por fecha de creación (más recientes primero)

### Seguridad en la Gestión
- **Autenticación requerida:** Solo puedes ver tus propios certificados
- **Validación de contraseña:** Se requiere la contraseña original para descargar
- **Confirmación de eliminación:** Previene eliminaciones accidentales
- **Cifrado mantenido:** Los certificados permanecen cifrados en la base de datos

---

## 🆕 Flujo y Limitaciones de la Firma Digital (2024)

### Flujo real del sistema
1. El usuario sube un PDF y selecciona su certificado .p12.
2. El backend firma el PDF con `node-signpdf` usando el certificado y contraseña del usuario.
3. El backend extrae el nombre y la organización directamente del certificado .p12 (no del frontend).
4. Se genera un QR y un sello visual con esos datos y se insertan en el PDF usando `pdf-lib`.
5. El usuario descarga el PDF firmado y sellado. El QR y el texto visual muestran los datos reales del certificado.

### Estructura del sello visual
- QR a la izquierda
- A la derecha:
  - "Firmado electrónicamente por:"
  - NOMBRE DEL USUARIO (mayúsculas y negrita)
  - ORGANIZACIÓN (mayúsculas)
  - "Validar únicamente con Digital Sign PUCESE"

### Dependencias principales
- `node-signpdf` (firma digital de PDFs)
- `pdf-lib` (manipulación visual de PDFs)
- `qrcode` (generación de QR visual)
- `node-forge` (extracción de datos del certificado)
- `qpdf` (reparación de PDFs para compatibilidad, requiere instalación en el sistema)

### Seguridad y .gitignore
- La carpeta `/backend/CrearCACentral/` (CA interna del sistema) está en `.gitignore` y **no se sube al repositorio**.

### Explicación del error de validez de la firma
- **Motivo:** La firma digital aparece como "NO VÁLIDA" en Adobe y otros lectores porque, tras firmar el PDF, se modifica el archivo para agregar el QR y el sello visual. Cualquier modificación posterior a la firma invalida la firma digital.
- **Limitación técnica:** Las librerías de Node.js actuales no permiten agregar un sello visual y firmar en un solo paso. Si se firma después de modificar, la firma puede fallar o el PDF puede quedar corrupto.
- **Solución profesional:** Usar una librería como PyHanko (Python) para firmas visibles y digitales válidas en un solo paso. En este sistema, se priorizó la compatibilidad Node.js puro.

### Resumen visual del flujo
```mermaid
graph TD;
  A[Usuario sube PDF] --> B[Selecciona certificado .p12]
  B --> C[Firma digital con node-signpdf]
  C --> D[Extrae nombre/org. del certificado]
  D --> E[Genera QR y sello visual con pdf-lib]
  E --> F[Descarga PDF firmado y sellado]
```

### Notas finales
- El nombre y la organización en el sello visual **siempre se extraen del certificado** y no del frontend.
- El QR contiene los mismos datos que el sello visual.
- El sistema es 100% Node.js, sin dependencias de Python.
- Si necesitas una firma digital "válida" y un sello visual protegido, considera migrar a PyHanko o similar.