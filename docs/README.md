# 📊 Documentación de Diagramas - Cibersegu

Este directorio contiene los diagramas y documentación visual del sistema Cibersegu.

## 📋 Contenido

### 🔗 **Flujo Principal del Usuario**
- **Archivo**: `CodigoPlantUML`
- **Descripción**: Diagrama simplificado del flujo principal del usuario
- **Tecnología**: PlantUML
- **Contenido**: 
  - Registro e inicio de sesión
  - Subida de documentos
  - Posicionamiento y firma digital
  - Solicitudes de firma a otros usuarios
  - Notificaciones en tiempo real
  - Estados del documento

### 🖼️ **Imágenes Generadas**
- **Directorio**: `images/`
- **Contenido**: Imágenes PNG generadas desde los diagramas PlantUML

## 🛠️ Generación de Diagramas

### Prerrequisitos
```bash
# Instalar PlantUML
sudo apt install -y plantuml

# O usar Docker
docker run -v $(pwd):/data plantuml/plantuml /data/CodigoPlantUML
```

### Comandos de Generación
```bash
# Generar imagen desde código PlantUML
plantuml -tpng docs/CodigoPlantUML

# Generar con formato específico
plantuml -tsvg docs/CodigoPlantUML

# Generar múltiples formatos
plantuml -tpng -tsvg docs/CodigoPlantUML
```

### Servicios Online
Si no tienes PlantUML instalado, puedes usar servicios online:

1. **PlantUML Online Server**: http://www.plantuml.com/plantuml/
2. **PlantText**: https://www.planttext.com/
3. **PlantUML Editor**: https://plantuml-editor.kkeisuke.dev/

## 📊 Flujo Principal Documentado

### 1. **Registro e Inicio de Sesión**
- Registro con verificación de email
- Login con JWT
- Acceso al dashboard principal

### 2. **Subida de Documentos**
- Formulario de subida de PDF
- Almacenamiento en base de datos
- Confirmación de subida exitosa

### 3. **Posicionamiento y Firma**
- Selección de posición en el PDF
- Proceso de firma digital con pyHanko
- Descarga del documento firmado

### 4. **Solicitudes de Firma**
- Creación de solicitudes múltiples
- Notificaciones por email a firmantes
- Seguimiento del progreso

### 5. **Notificaciones en Tiempo Real**
- Actualizaciones de estado
- Progreso de firmas múltiples
- Notificaciones de completado

## 🔄 Actualización de Diagramas

### Cuándo Actualizar
- Nuevos pasos en el flujo del usuario
- Cambios en la experiencia de usuario
- Nuevas funcionalidades principales
- Modificaciones en el proceso de firma

### Proceso de Actualización
1. Editar el archivo `CodigoPlantUML`
2. Generar nueva imagen
3. Actualizar referencias en README.md
4. Commit de cambios

## 📝 Convenciones

### Colores
- **Frontend**: Azul claro (#E8F4FD)
- **Backend**: Azul medio (#2E86AB)
- **Base de Datos**: Azul claro (#F0F8FF)
- **Servicios Externos**: Verde claro (#E8F5E8)

### Estilo
- Componentes con bordes redondeados
- Flujos numerados y comentados
- Agrupación lógica por paquetes
- Nombres descriptivos para actores

## 🔗 Enlaces Relacionados

- **[Documentación del Backend](../backend/README.md)**
- **[Documentación del Frontend](../frontend/README.md)**
- **[API Endpoints](../Endpoints.md)**
- **[README Principal](../README.md)**

---

**Desarrollado por el equipo de Cibersegu** 📊
