import { useContext } from 'react';
import { CartV2Context } from '../context/CartProvider';

/**
 * Custom hook to access cart context
 * @returns {Object} Cart context value with state and operations
 */
export const useCart = () => {
  const context = useContext(CartV2Context);
  
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  
  return context;
};

// Default export for compatibility
export default useCart;