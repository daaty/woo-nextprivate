import React, { useState, useEffect, createContext, useContext } from 'react';

// Create context for toast notifications
const ToastContext = createContext();

export const ToastTypes = {
  SUCCESS: 'success',
  ERROR: 'error',
  INFO: 'info',
  WARNING: 'warning',
};

// Provider component
export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = ToastTypes.INFO, duration = 3000) => {
    const id = Date.now();
    setToasts((prevToasts) => [...prevToasts, { id, message, type, duration }]);
    return id;
  };

  const removeToast = (id) => {
    setToasts((prevToasts) => prevToasts.filter(toast => toast.id !== id));
  };

  // Convenience methods
  const toast = {
    success: (message, duration) => addToast(message, ToastTypes.SUCCESS, duration),
    error: (message, duration) => addToast(message, ToastTypes.ERROR, duration),
    info: (message, duration) => addToast(message, ToastTypes.INFO, duration),
    warning: (message, duration) => addToast(message, ToastTypes.WARNING, duration),
  };

  const value = {
    toasts,
    addToast,
    removeToast,
    toast,
  };

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
};

// Hook to use the toast context
export const useToast = () => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

// Toast Container Component
export const ToastContainer = () => {
  const { toasts, removeToast } = useToast();

  return (
    <div className="fixed top-0 right-0 p-4 z-50 w-full md:w-auto" style={{ maxWidth: '320px' }}>
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          id={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
};

// Individual Toast Component
const Toast = ({ id, message, type, duration, onClose }) => {
  useEffect(() => {
    if (duration) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const getToastClasses = () => {
    let baseClasses = "flex p-4 mb-3 rounded-lg shadow-lg transform transition-all duration-300 ease-in-out";
    
    switch (type) {
      case ToastTypes.SUCCESS:
        return `${baseClasses} bg-green-100 border-l-4 border-green-500 text-green-700`;
      case ToastTypes.ERROR:
        return `${baseClasses} bg-red-100 border-l-4 border-red-500 text-red-700`;
      case ToastTypes.WARNING:
        return `${baseClasses} bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700`;
      case ToastTypes.INFO:
      default:
        return `${baseClasses} bg-blue-100 border-l-4 border-blue-500 text-blue-700`;
    }
  };

  return (
    <div
      className={`${getToastClasses()} animate-slide-in`}
      role="alert"
    >
      <div className="flex-grow mr-2">{message}</div>
      <button
        type="button"
        onClick={onClose}
        className="inline-flex items-center justify-center flex-shrink-0 w-6 h-6 text-gray-600 rounded-full hover:text-gray-700 focus:outline-none"
        aria-label="Close"
      >
        ×
      </button>
    </div>
  );
};

export default Toast;
