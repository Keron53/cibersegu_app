// Servicio para manejar notificaciones de forma persistente
class NotificationService {
  constructor() {
    this.storageKey = 'cibersegu_notifications';
    this.maxNotifications = 100; // Máximo de notificaciones a guardar
  }

  // Obtener todas las notificaciones
  getAll() {
    try {
      const notifications = localStorage.getItem(this.storageKey);
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

      localStorage.setItem(this.storageKey, JSON.stringify(notifications));
      
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
      
      localStorage.setItem(this.storageKey, JSON.stringify(updated));
      
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
      
      localStorage.setItem(this.storageKey, JSON.stringify(updated));
      
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
      
      localStorage.setItem(this.storageKey, JSON.stringify(updated));
      
      window.dispatchEvent(new CustomEvent('notificationsUpdated', {
        detail: { notifications: updated, unreadCount: this.getUnread().length }
      }));

      return true;
    } catch (error) {
      console.error('Error eliminando notificación:', error);
      return false;
    }
  }

  // Limpiar todas las notificaciones
  clear() {
    try {
      localStorage.removeItem(this.storageKey);
      
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
