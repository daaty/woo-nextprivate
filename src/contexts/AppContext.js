import React, { createContext, useContext, useState } from 'react';

// Create context
const AppContext = createContext();

// Provider component
export const AppProvider = ({ children }) => {
  const [appState, setAppState] = useState({
    notifications: [],
    settings: {
      theme: 'light',
      language: 'pt-BR'
    }
  });

  // Add any global methods here
  const updateSettings = (newSettings) => {
    setAppState(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        ...newSettings
      }
    }));
  };

  // Context value
  const value = {
    ...appState,
    updateSettings
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

// Custom hook to use the context
export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
