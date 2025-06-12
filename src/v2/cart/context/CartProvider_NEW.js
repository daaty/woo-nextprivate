import React, { createContext, useContext, useState, useEffect } from 'react';
import { getUnifiedSessionId, addSessionListener, initSessionSync, SESSION_EVENTS, forceNewSession } from '../utils/sessionSync';

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

// SMART CACHING AND THROTTLING SYSTEM
let _cartCache = null;
let _lastFetchTime = 0;
let _isLoadingCart = false;
const CACHE_DURATION = 2000; // 2 seconds cache
const MIN_REQUEST_INTERVAL = 1000; // Minimum 1 second between requests

/**
 * Smart cart loading with caching and throttling
 * Now uses the unified session synchronization system
 */
const loadCartWithCache = async (forceRefresh = false) => {
  const now = Date.now();
  
  // Return cached data if still valid and not forcing refresh
  if (!forceRefresh && _cartCache && (now - _lastFetchTime) < CACHE_DURATION) {
    console.log('[CartProvider] Using cached cart data');
    return _cartCache;
  }
  
  // Prevent concurrent requests
  if (_isLoadingCart && !forceRefresh) {
    console.log('[CartProvider] Cart loading already in progress, waiting...');
    // Wait for the current loading to finish
    while (_isLoadingCart) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return _cartCache;
  }
  
  // Throttle requests - minimum interval between API calls
  if (!forceRefresh && (now - _lastFetchTime) < MIN_REQUEST_INTERVAL) {
    console.log('[CartProvider] Request throttled, using cache');
    return _cartCache;
  }
  
  _isLoadingCart = true;
  
  try {
    // CRITICAL: Use unified session system
    const sessionId = await getUnifiedSessionId();
    console.log('[CartProvider] Making API call to load cart with unified session:', sessionId);
    
    const response = await fetch('/api/v2/cart', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-cart-session-id': sessionId,
      },
    });

    if (response.ok) {
      const data = await response.json();
      _cartCache = data.items || [];
      _lastFetchTime = now;
      console.log('[CartProvider] Cart loaded successfully, items:', _cartCache.length);
      return _cartCache;
    } else {
      console.warn('[CartProvider] Failed to load cart:', response.status);
      return _cartCache || [];
    }
  } catch (err) {
    console.error('[CartProvider] Error loading cart:', err);
    return _cartCache || [];
  } finally {
    _isLoadingCart = false;
  }
};

// Provider component
export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Calculate cart count
  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);

  // Calculate cart total
  const cartTotal = cartItems.reduce((total, item) => {
    const price = parseFloat(item.price || 0);
    return total + (price * item.quantity);
  }, 0).toFixed(2);

  // CRITICAL: Initialize session synchronization system
  useEffect(() => {
    if (typeof window === 'undefined') return;

    console.log('[CartProvider] Initializing session synchronization system');
    
    // Initialize global session sync
    const cleanup = initSessionSync();
    
    // Listen for session events
    const removeSessionListener = addSessionListener((event, data) => {
      console.log('[CartProvider] Session event received:', event, data);
      
      switch (event) {
        case SESSION_EVENTS.CREATED:
        case SESSION_EVENTS.CHANGED:
        case SESSION_EVENTS.SYNCED:
          // Force reload cart when session changes
          console.log('[CartProvider] Session changed, reloading cart...');
          _cartCache = null;
          loadCart(true);
          break;
        case SESSION_EVENTS.RESET:
          // Clear all cart data on session reset
          console.log('[CartProvider] Session reset, clearing cart...');
          _cartCache = null;
          setCartItems([]);
          loadCart(true);
          break;
      }
    });

    return () => {
      if (cleanup) cleanup();
      removeSessionListener();
    };
  }, []);

  // Load cart from API with smart caching
  const loadCart = async (forceRefresh = false) => {
    if (typeof window === 'undefined') return;
    
    try {
      setLoading(true);
      setError(null);

      const cartItems = await loadCartWithCache(forceRefresh);
      setCartItems(cartItems);
    } catch (err) {
      console.error('[Cart v2] Error loading cart:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Load cart on mount with debounced initialization
  useEffect(() => {
    // Debounce initial load to prevent multiple rapid calls
    const timeoutId = setTimeout(() => {
      loadCart();
    }, 100);

    return () => clearTimeout(timeoutId);
  }, []);

  // Add refresh function for external use (forces cache refresh)
  const refreshCart = () => {
    return loadCart(true); // Force refresh bypasses cache
  };

  // CRITICAL: Force session reset when inconsistency detected
  const resetSession = async () => {
    console.log('[CartProvider] Forcing session reset...');
    const newSessionId = forceNewSession();
    _cartCache = null;
    await loadCart(true);
    return newSessionId;
  };

  // Add item to cart
  const addToCart = async (product, quantity = 1) => {
    try {
      setLoading(true);
      setError(null);

      // CRITICAL: Use unified session system
      const sessionId = await getUnifiedSessionId();
      console.log('[CartProvider] Adding to cart with unified session:', sessionId);
      
      const response = await fetch('/api/v2/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-cart-session-id': sessionId,
        },
        body: JSON.stringify({
          productId: product.id,
          quantity: quantity,
        }),
      });

      if (response.ok) {
        // Invalidate cache and reload cart after successful addition
        _cartCache = null;
        await loadCart(true);
        return { success: true };
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add to cart');
      }
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Update cart item quantity
  const updateCartItem = async (itemId, quantity) => {
    try {
      setLoading(true);
      setError(null);

      if (quantity <= 0) {
        return removeCartItem(itemId);
      }

      const sessionId = await getUnifiedSessionId();
      const response = await fetch('/api/v2/cart', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-cart-session-id': sessionId,
        },
        body: JSON.stringify({
          productId: itemId,
          quantity: quantity,
        }),
      });

      if (response.ok) {
        // Invalidate cache and reload cart after successful update
        _cartCache = null;
        await loadCart(true);
        return { success: true };
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update cart');
      }
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Remove item from cart
  const removeCartItem = async (itemId) => {
    try {
      setLoading(true);
      setError(null);

      const sessionId = await getUnifiedSessionId();
      const response = await fetch('/api/v2/cart', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-cart-session-id': sessionId,
        },
        body: JSON.stringify({
          productId: itemId,
        }),
      });

      if (response.ok) {
        // Invalidate cache and reload cart after successful removal
        _cartCache = null;
        await loadCart(true);
        return { success: true };
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to remove from cart');
      }
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Clear cart
  const clearCart = async () => {
    try {
      setLoading(true);
      setError(null);

      const sessionId = await getUnifiedSessionId();
      const response = await fetch('/api/v2/cart/clear', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-cart-session-id': sessionId,
        },
      });

      if (response.ok) {
        // Invalidate cache and clear cart state
        _cartCache = null;
        setCartItems([]);
        return { success: true };
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to clear cart');
      }
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Context value
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
    refreshCart,
    resetSession,
  };

  return (
    <CartV2Context.Provider value={value}>
      {children}
    </CartV2Context.Provider>
  );
};

// Hook to use cart context
export const useCartV2 = () => {
  const context = useContext(CartV2Context);
  if (!context) {
    throw new Error('useCartV2 must be used within a CartProvider');
  }
  return context;
};

export default CartProvider;
