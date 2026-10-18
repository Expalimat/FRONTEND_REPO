import React, { createContext, useContext, useState, useEffect } from 'react';
import { notificationService } from '../services/notificationService';
import { pageParams } from '../services/api';
import { useAuth } from './AuthContext';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  const refreshNotifications = async () => {
    if (currentUser) {
      try {
        const page = await notificationService.getUserNotifications(pageParams(1));
        setNotifications(page.data);
        setUnreadCount(page.unreadCount ?? page.data.filter((n) => !n.isRead).length);
        setTotalCount(page.total ?? page.data.length);
      } catch {
        // keep the old list if the request fails
      }
    } else {
      setNotifications([]);
      setUnreadCount(0);
      setTotalCount(0);
    }
  };

  useEffect(() => {
    refreshNotifications();
  }, [currentUser]);

  const markAsRead = async (id) => {
    await notificationService.markAsRead(id);
    await refreshNotifications();
  };

  const markAllAsRead = async () => {
    if (currentUser) {
      await notificationService.markAllAsRead(currentUser.id);
      await refreshNotifications();
    }
  };

  return (
    <NotificationContext.Provider
      value={{ notifications, unreadCount, totalCount, refreshNotifications, markAsRead, markAllAsRead }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
