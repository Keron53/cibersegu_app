# Proyecto de Sistema de Firmas

## Estructura del Proyecto

- **frontend/**: Aplicación principal de React para la interfaz de usuario.
- **backend/**: Servidor Node.js con Express y MongoDB para la lógica de negocio y API.
- **frontend-A/**: (Eliminado/no usado) Otra versión de frontend.

## Instalación y Ejecución

### 1. Backend

```bash
cd backend
npm install
node src/app.js
```
El backend se ejecuta en `http://localhost:3001` y utiliza MongoDB (base de datos: `firmasDB`).

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```
El frontend se ejecuta normalmente en `http://localhost:3000`.

## Notas
- Asegúrate de tener MongoDB corriendo localmente en el puerto 27017.
- El archivo `.gitignore` ya está configurado para ignorar dependencias y archivos sensibles.

