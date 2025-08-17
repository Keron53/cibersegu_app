// Servicio para manejar notificaciones de forma persistente por usuario
class NotificationService {
  constructor() {
    this.baseStorageKey = 'cibersegu_notifications';
    this.maxNotifications = 100; // Máximo de notificaciones a guardar
    this.currentUserId = null;
  }

  // Establecer el usuario actual
  setCurrentUser(userId) {
    this.currentUserId = userId;
  }

  // Obtener la clave de storage específica del usuario
  getStorageKey() {
    if (!this.currentUserId) {
      // Si no hay usuario, usar clave temporal
      return `${this.baseStorageKey}_temp`;
    }
    return `${this.baseStorageKey}_${this.currentUserId}`;
  }

  // Limpiar notificaciones del usuario anterior al cambiar de usuario
  clearPreviousUserNotifications() {
    // Limpiar todas las claves de notificaciones existentes
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(this.baseStorageKey)) {
        localStorage.removeItem(key);
      }
    });
  }

  // Obtener todas las notificaciones del usuario actual
  getAll() {
    try {
      const notifications = localStorage.getItem(this.getStorageKey());
      return notifications ? JSON.parse(notifications) : [];
    } catch (error) {
      console.error('Error obteniendo notificaciones:', error);
      return [];
    }
  }

  // Obtener notificaciones no leídas
  getUnread() {
    const notifications = this.getAll();
    return notifications.filter(n => !n.leida);
  }

  // Agregar nueva notificación
  add(notification) {
    try {
      const notifications = this.getAll();
      const newNotification = {
        id: Date.now() + Math.random(),
        ...notification,
        timestamp: new Date().toISOString(),
        leida: false
      };

      // Agregar al inicio
      notifications.unshift(newNotification);

      // Limitar el número de notificaciones
      if (notifications.length > this.maxNotifications) {
        notifications.splice(this.maxNotifications);
      }

      localStorage.setItem(this.getStorageKey(), JSON.stringify(notifications));
      
      // Emitir evento personalizado para actualizar la UI
      window.dispatchEvent(new CustomEvent('notificationsUpdated', {
        detail: { notifications, unreadCount: this.getUnread().length }
      }));

      return newNotification;
    } catch (error) {
      console.error('Error agregando notificación:', error);
      return null;
    }
  }

  // Marcar como leída
  markAsRead(id) {
    try {
      const notifications = this.getAll();
      const updated = notifications.map(n => 
        n.id === id ? { ...n, leida: true } : n
      );
      
      localStorage.setItem(this.getStorageKey(), JSON.stringify(updated));
      
      window.dispatchEvent(new CustomEvent('notificationsUpdated', {
        detail: { notifications: updated, unreadCount: this.getUnread().length }
      }));

      return true;
    } catch (error) {
      console.error('Error marcando notificación como leída:', error);
      return false;
    }
  }

  // Marcar todas como leídas
  markAllAsRead() {
    try {
      const notifications = this.getAll();
      const updated = notifications.map(n => ({ ...n, leida: true }));
      
      localStorage.setItem(this.getStorageKey(), JSON.stringify(updated));
      
      window.dispatchEvent(new CustomEvent('notificationsUpdated', {
        detail: { notifications: updated, unreadCount: 0 }
      }));

      return true;
    } catch (error) {
      console.error('Error marcando todas las notificaciones como leídas:', error);
      return false;
    }
  }

  // Eliminar notificación
  remove(id) {
    try {
      const notifications = this.getAll();
      const updated = notifications.filter(n => n.id !== id);
      
      localStorage.setItem(this.getStorageKey(), JSON.stringify(updated));
      
      window.dispatchEvent(new CustomEvent('notificationsUpdated', {
        detail: { notifications: updated, unreadCount: this.getUnread().length }
      }));

      return true;
    } catch (error) {
      console.error('Error eliminando notificación:', error);
      return false;
    }
  }

  // Limpiar todas las notificaciones del usuario actual
  clear() {
    try {
      localStorage.removeItem(this.getStorageKey());
      
      window.dispatchEvent(new CustomEvent('notificationsUpdated', {
        detail: { notifications: [], unreadCount: 0 }
      }));

      return true;
    } catch (error) {
      console.error('Error limpiando notificaciones:', error);
      return false;
    }
  }

  // Obtener contador de no leídas
  getUnreadCount() {
    return this.getUnread().length;
  }

  // Verificar si hay notificaciones nuevas
  hasNewNotifications() {
    return this.getUnreadCount() > 0;
  }
}

// Crear instancia global
const notificationService = new NotificationService();

export default notificationService;
