import React, { useState, useEffect, createContext, useContext } from 'react';

// Contexto para notificações
const NotificationContext = createContext();

// Tipos de notificações
export const NotificationType = {
  SUCCESS: 'success',
  ERROR: 'error',
  INFO: 'info',
  WARNING: 'warning',
};

// Componente Provider
export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const showNotification = (message, type = NotificationType.INFO, duration = 3000) => {
    // Generate unique ID using timestamp + random component to prevent duplicates
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setNotifications(prev => [...prev, { id, message, type, duration }]);
    return id;
  };

  const hideNotification = (id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  // Métodos auxiliares
  const notification = {
    success: (message, duration) => showNotification(message, NotificationType.SUCCESS, duration),
    error: (message, duration) => showNotification(message, NotificationType.ERROR, duration),
    info: (message, duration) => showNotification(message, NotificationType.INFO, duration),
    warning: (message, duration) => showNotification(message, NotificationType.WARNING, duration),
  };

  return (
    <NotificationContext.Provider value={{ notifications, showNotification, hideNotification, notification }}>
      {children}
      <NotificationDisplay />
    </NotificationContext.Provider>
  );
};

// Hook para usar o contexto de notificações
export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification deve ser usado dentro de NotificationProvider');
  }
  return context;
};

// Componente para mostrar uma notificação
const NotificationItem = ({ id, message, type, duration, onClose }) => {
  useEffect(() => {
    if (duration) {
      const timer = setTimeout(() => {
        onClose(id);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, id, onClose]);

  let bgColor, textColor;
  switch (type) {
    case NotificationType.SUCCESS:
      bgColor = 'bg-green-100 border-green-500';
      textColor = 'text-green-800';
      break;
    case NotificationType.ERROR:
      bgColor = 'bg-red-100 border-red-500';
      textColor = 'text-red-800';
      break;
    case NotificationType.WARNING:
      bgColor = 'bg-yellow-100 border-yellow-500';
      textColor = 'text-yellow-800';
      break;
    default: // INFO
      bgColor = 'bg-blue-100 border-blue-500';
      textColor = 'text-blue-800';
  }

  return (
    <div 
      className={`${bgColor} ${textColor} px-4 py-3 rounded border-l-4 mb-2 flex justify-between items-center animate-fade-in-top`}
      role="alert"
    >
      <span>{message}</span>
      <button 
        onClick={() => onClose(id)} 
        className="ml-3 text-gray-500 hover:text-gray-700"
      >
        &times;
      </button>
    </div>
  );
};

// Componente que exibe todas as notificações ativas
const NotificationDisplay = () => {
  const { notifications, hideNotification } = useContext(NotificationContext);

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm w-full">
      {notifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          {...notification}
          onClose={hideNotification}
        />
      ))}
    </div>
  );
};
