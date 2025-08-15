# Modal de Rechazo de Solicitud de Firma

## 🎯 **Características del Nuevo Modal**

### **✅ Antes (Modal Básico)**
- ❌ Solo un `prompt()` nativo del navegador
- ❌ Sin validaciones
- ❌ Sin opciones predefinidas
- ❌ Interfaz básica y poco atractiva

### **🚀 Ahora (Modal Moderno)**
- ✅ **Diseño moderno** con gradientes y sombras
- ✅ **Razones predefinidas** para facilitar la selección
- ✅ **Campo de texto personalizado** para comentarios adicionales
- ✅ **Validaciones** para asegurar que se seleccione una razón
- ✅ **Animaciones suaves** con Framer Motion
- ✅ **Responsive** y compatible con modo oscuro
- ✅ **Información contextual** de la solicitud

## 🎨 **Características Visuales**

### **Header con Gradiente**
- Fondo rojo degradado (`from-red-500 to-red-600`)
- Icono de XCircle con fondo semitransparente
- Título y nombre del documento

### **Contenido Informativo**
- Advertencia clara sobre la acción irreversible
- Información de la solicitud (solicitante, fecha)
- Razones predefinidas con descripciones

### **Formulario Inteligente**
- **Razones predefinidas:**
  1. No estoy autorizado para firmar este documento
  2. El documento está incompleto o tiene errores
  3. Falta información necesaria para la firma
  4. No cumple con las políticas internas
  5. Otro motivo (con campo de texto personalizado)

- **Campo de comentarios adicionales** (opcional)
- **Botones de acción** con estados de carga

## 🔧 **Funcionalidades Técnicas**

### **Estados del Modal**
- `isOpen`: Controla la visibilidad
- `isSubmitting`: Estado de envío (deshabilita botones)
- `selectedReason`: Razón seleccionada
- `motivo`: Comentarios adicionales

### **Validaciones**
- Debe seleccionarse una razón O escribir un comentario
- Botón de rechazo se deshabilita si no hay motivo válido
- No se puede cerrar durante el envío

### **Integración**
- Se integra perfectamente con el flujo existente
- Mantiene la misma API de rechazo
- Notifica al solicitante por email

## 📱 **Responsive Design**

- **Mobile**: Modal ocupa todo el ancho disponible
- **Tablet**: Ancho máximo de 2xl (672px)
- **Desktop**: Centrado con padding adecuado

## 🌙 **Modo Oscuro**

- Colores adaptados para tema oscuro
- Contraste adecuado en todos los elementos
- Transiciones suaves entre temas

## 🚀 **Uso del Componente**

```jsx
import RechazarSolicitudModal from './RechazarSolicitudModal';

// En tu componente
const [showRechazarModal, setShowRechazarModal] = useState(false);

// Función de rechazo
const rechazarSolicitud = async (motivo) => {
  // Lógica de rechazo
};

// Renderizar modal
<RechazarSolicitudModal
  isOpen={showRechazarModal}
  onClose={() => setShowRechazarModal(false)}
  onRechazar={rechazarSolicitud}
  solicitud={solicitud}
/>
```

## 🎯 **Beneficios del Nuevo Modal**

1. **Mejor UX**: Interfaz intuitiva y atractiva
2. **Estandarización**: Razones consistentes para rechazos
3. **Trazabilidad**: Mejor registro de motivos de rechazo
4. **Profesionalismo**: Apariencia más profesional del sistema
5. **Accesibilidad**: Mejor experiencia para usuarios con discapacidades

## 🔄 **Flujo de Uso**

1. Usuario hace clic en "Rechazar"
2. Se abre el modal con opciones predefinidas
3. Usuario selecciona una razón principal
4. Opcionalmente agrega comentarios adicionales
5. Hace clic en "Rechazar Solicitud"
6. Se envía la solicitud con el motivo
7. Se cierra el modal y se muestra confirmación
8. Se redirige al usuario a la página principal
