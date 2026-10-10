import api from './api';

// Notifications are created by the server (on enrollment, payment, grade changes, etc.)
export const notificationService = {
  getUserNotifications: async () => (await api.get('/notifications')).data,
  getAllNotifications: async () => (await api.get('/notifications')).data,

  markAsRead: async (notificationId) => {
    await api.patch(`/notifications/${notificationId}/read`);
    return true;
  },

  markAllAsRead: async () => {
    await api.patch('/notifications/read-all');
    return true;
  }
};
