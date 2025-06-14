# Sistema de Firmas Electrónicas

Este proyecto es un sistema web diseñado para la gestión y futura implementación de firmas electrónicas en documentos PDF. Cuenta con una arquitectura de cliente-servidor (frontend y backend) que permite a los usuarios subir, visualizar, descargar y eliminar documentos, con una base sólida para expandirse a funcionalidades de firma digital.

## Características Actuales

- **Autenticación de Usuarios:** Registro e inicio de sesión seguro.
- **Gestión de Documentos:**
  - Subida de documentos PDF.
  - Visualización de documentos en el navegador.
  - Descarga de documentos.
  - Eliminación de documentos.
- **Modo Oscuro/Claro:** Interfaz adaptable a las preferencias del usuario.

## Arquitectura del Sistema

El sistema sigue una arquitectura de componentes separados para el frontend y el backend, comunicándose a través de una API RESTful.

![Arquitectura de la Aplicación](./docs/arquitectura-app.jpg)

## Estructura del Backend (Node.js con Express y MongoDB)

El backend está construido con Node.js, utilizando el framework Express para las rutas API y Mongoose como ODM para interactuar con una base de datos MongoDB.

-   **`backend/src/app.js`**: Archivo principal de la aplicación. Configura Express, los middlewares y las rutas principales.
-   **`backend/src/config/db.js`**: Contiene la lógica para establecer la conexión con la base de datos MongoDB utilizando Mongoose.
-   **`backend/src/models/`**: Define los esquemas y modelos de Mongoose para las colecciones de la base de datos, como `Usuario.js` y `Documento.js`.
-   **`backend/src/controllers/`**: Contiene la lógica de negocio para manejar las solicitudes de los clientes. Aquí se procesan las operaciones relacionadas con usuarios (registro, login) y documentos (subir, listar, ver, eliminar).
-   **`backend/src/api/`**: Define las rutas específicas de la API para cada recurso. Por ejemplo, `usuarioRoutes.js` y `documentoRoutes.js` manejan las operaciones CRUD para usuarios y documentos, respectivamente.
-   **`backend/uploads/`**: Directorio donde se almacenan físicamente los documentos PDF subidos por los usuarios.

## Estructura del Frontend (React con TypeScript y Tailwind CSS)

El frontend es una aplicación de React construida con TypeScript y estilizada con Tailwind CSS, ofreciendo una experiencia de usuario moderna y responsiva.

-   **`frontend/src/App.tsx`**: Componente raíz de la aplicación. Configura el enrutamiento (`react-router-dom`), provee el contexto del tema y la autenticación a toda la aplicación.
-   **`frontend/src/pages/`**: Contiene los componentes de página de nivel superior que corresponden a las rutas de la aplicación (ej. `LoginPage.tsx`, `RegisterPage.tsx`).
-   **`frontend/src/components/`**: Almacena componentes UI reutilizables. Esto incluye subcarpetas para:
    -   **`components/home/`**: Contiene `HomePage.tsx`, la página principal para la gestión de documentos.
    -   **`components/layout/`**: Componentes relacionados con el diseño general de la aplicación, como la barra de navegación (`Navigation.tsx`) y notificaciones (`Notification.tsx`).
    -   **`components/documentos/`**: Componentes específicos para la interacción con documentos, como `DocumentUpload.tsx` (subida), `DocumentList.tsx` (listado) y `PDFViewer.tsx` (visor).
-   **`frontend/src/context/ThemeContext.tsx`**: Provee un contexto React para gestionar el estado del tema (claro/oscuro) a través de la aplicación.
-   **`frontend/src/services/api.ts`**: Contiene los servicios para interactuar con la API del backend, incluyendo `authService` para la autenticación y `documentoService` para las operaciones de documentos. Utiliza Axios para las peticiones HTTP.
-   **`tailwind.config.js`**: Archivo de configuración de Tailwind CSS, donde se definen las rutas de los archivos que Tailwind debe escanear para generar los estilos, y se pueden personalizar colores, tipografías, etc.

## Próximos Pasos (Firma Electrónica)

La base actual está diseñada para facilitar la futura integración de funcionalidades de firma electrónica, que incluirán:
- Generación y gestión de firmas digitales.
- Aplicación de firmas a documentos PDF.
- Verificación de la autenticidad de los documentos firmados.

## Configuración y Ejecución

Para levantar el proyecto, sigue los siguientes pasos:

### Backend

1.  Navega a la carpeta `backend`:
    `cd backend`
2.  Instala las dependencias:
    `npm install`
3.  Inicia el servidor (asegúrate de que MongoDB esté corriendo):
    `npm start`

### Frontend

1.  Navega a la carpeta `frontend`:
    `cd frontend`
2.  Instala las dependencias:
    `npm install`
3.  Inicia la aplicación React:
    `npm start`

La aplicación estará disponible en `http://localhost:5173` (frontend) y la API en `http://localhost:3001/api` (backend).

## Notas
- Asegúrate de tener MongoDB corriendo localmente en el puerto 27017.
- El archivo `.gitignore` ya está configurado para ignorar dependencias y archivos sensibles.

