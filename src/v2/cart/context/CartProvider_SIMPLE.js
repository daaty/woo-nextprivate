import React, { createContext, useContext, useState, useEffect } from 'react';

// Create context
export const CartV2Context = createContext({
  cartItems: [],
  cartCount: 0,
  cartTotal: '0',
  loading: false,
  error: null,
  addToCart: () => {},
  updateCartItem: () => {},
  removeCartItem: () => {},
  clearCart: () => {},
});

// SIMPLE SESSION MANAGEMENT - NO COMPLEX SYNC
let _sessionId = null;

/**
 * Simple session management - generates session ID once per browser session
 */
const getSessionId = () => {
  if (_sessionId) {
    return _sessionId;
  }

  if (typeof window !== 'undefined') {
    // Check for existing session in localStorage
    let sessionId = localStorage.getItem('cart_v2_session_id');
    
    if (!sessionId) {
      // Generate new session ID
      sessionId = `cart_v2_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('cart_v2_session_id', sessionId);
      console.log('[CartProvider] Created new session:', sessionId);
    } else {
      console.log('[CartProvider] Using existing session:', sessionId);
    }
    
    _sessionId = sessionId;
    return sessionId;
  }
  
  // Server-side fallback
  return `cart_v2_${Date.now()}_temp`;
};

/**
 * API call helper with session management
 */
const apiCall = async (endpoint, options = {}) => {
  const sessionId = getSessionId();
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      'X-Cart-Session-Id': sessionId,
    },
  };

  const mergedOptions = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers,
    },
  };

  const response = await fetch(endpoint, mergedOptions);
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  return await response.json();
};

/**
 * Cart Provider Component
 */
export const CartV2Provider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [cartCount, setCartCount] = useState(0);
  const [cartTotal, setCartTotal] = useState('0');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load cart on mount
  useEffect(() => {
    loadCart();
  }, []);

  // Update cart count when items change
  useEffect(() => {
    const count = cartItems.reduce((total, item) => total + item.quantity, 0);
    setCartCount(count);
    console.log('[CartProvider] Cart count updated:', count);
  }, [cartItems]);

  // Update cart total when items change
  useEffect(() => {
    const total = cartItems.reduce((sum, item) => {
      const price = parseFloat(item.price?.replace('R$', '').replace('.', '').replace(',', '.') || 0);
      return sum + (price * item.quantity);
    }, 0);
    setCartTotal(total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }));
  }, [cartItems]);

  /**
   * Load cart from API
   */
  const loadCart = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await apiCall('/api/v2/cart');
      
      if (data.success) {
        setCartItems(data.items || []);
        console.log('[CartProvider] Cart loaded:', data.items?.length || 0, 'items');
      } else {
        setError(data.error || 'Failed to load cart');
      }
    } catch (err) {
      console.error('[CartProvider] Error loading cart:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Add item to cart
   */
  const addToCart = async (product) => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await apiCall('/api/v2/cart', {
        method: 'POST',
        body: JSON.stringify({
          product,
          quantity: 1,
        }),
      });
      
      if (data.success) {
        setCartItems(data.items || []);
        console.log('[CartProvider] Product added to cart:', product.name);
        return { success: true };
      } else {
        setError(data.error || 'Failed to add to cart');
        return { success: false, error: data.error };
      }
    } catch (err) {
      console.error('[CartProvider] Error adding to cart:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Update cart item quantity
   */
  const updateCartItem = async (itemId, quantity) => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await apiCall('/api/v2/cart', {
        method: 'PUT',
        body: JSON.stringify({
          itemId,
          quantity,
        }),
      });
      
      if (data.success) {
        setCartItems(data.items || []);
        console.log('[CartProvider] Cart item updated:', itemId, 'qty:', quantity);
      } else {
        setError(data.error || 'Failed to update cart');
      }
    } catch (err) {
      console.error('[CartProvider] Error updating cart:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Remove item from cart
   */
  const removeCartItem = async (itemId) => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await apiCall('/api/v2/cart', {
        method: 'DELETE',
        body: JSON.stringify({
          itemId,
        }),
      });
      
      if (data.success) {
        setCartItems(data.items || []);
        console.log('[CartProvider] Cart item removed:', itemId);
      } else {
        setError(data.error || 'Failed to remove item');
      }
    } catch (err) {
      console.error('[CartProvider] Error removing item:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Clear entire cart
   */
  const clearCart = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await apiCall('/api/v2/cart/clear', {
        method: 'POST',
      });
      
      if (data.success) {
        setCartItems([]);
        console.log('[CartProvider] Cart cleared');
      } else {
        setError(data.error || 'Failed to clear cart');
      }
    } catch (err) {
      console.error('[CartProvider] Error clearing cart:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const value = {
    cartItems,
    cartCount,
    cartTotal,
    loading,
    error,
    addToCart,
    updateCartItem,
    removeCartItem,
    clearCart,
    loadCart, // Expose loadCart for manual refresh
  };

  return (
    <CartV2Context.Provider value={value}>
      {children}
    </CartV2Context.Provider>
  );
};

/**
 * Hook to use Cart V2 context
 */
export const useCartV2 = () => {
  const context = useContext(CartV2Context);
  if (!context) {
    throw new Error('useCartV2 must be used within a CartV2Provider');
  }
  return context;
};

export default CartV2Provider;
