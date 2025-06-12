import React, { createContext, useContext, useState, useEffect } from 'react';
import { getUnifiedSessionId, addSessionListener, initSessionSync, SESSION_EVENTS } from '../utils/sessionSync';

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

// UNIFIED SESSION MANAGEMENT SYSTEM - USING GLOBAL SYNC
// This ensures ALL cart operations use the same session ID across ALL components

// SMART CACHING AND THROTTLING SYSTEM
let _cartCache = null;
let _lastFetchTime = 0;
let _isLoadingCart = false;
const CACHE_DURATION = 2000; // 2 seconds cache
const MIN_REQUEST_INTERVAL = 1000; // Minimum 1 second between requests

/**
 * Unified session management that ensures all cart operations use the same session
 * This is critical to prevent products being added to different sessions
 */
const getSessionId = async () => {
  // If we already have a cached session, return it immediately
  if (_sessionId) {
    console.log('[CartProvider] Using cached unified session ID:', _sessionId);
    return _sessionId;
  }

  // If there's already a session creation in progress, wait for it
  if (_sessionPromise) {
    console.log('[CartProvider] Waiting for existing session creation...');
    return await _sessionPromise;
  }

  // Create new session creation promise
  _sessionPromise = new Promise((resolve) => {
    try {
      if (typeof window !== 'undefined') {
        // Check for existing unified session
        let sessionId = localStorage.getItem(SESSION_STORAGE_KEY);
        
        // Clean up old sessions with different prefixes
        const allKeys = Object.keys(localStorage);
        const oldSessionKeys = allKeys.filter(key => 
          key.includes('cart_session') || 
          (key.includes('cart_') && key !== SESSION_STORAGE_KEY)
        );
        
        if (oldSessionKeys.length > 0) {
          console.log('[CartProvider] Cleaning up old session keys:', oldSessionKeys);
          oldSessionKeys.forEach(key => localStorage.removeItem(key));
        }
          if (!sessionId || !sessionId.startsWith(SESSION_PREFIX)) {
          // Create new unified session ID
          const timestamp = Date.now();
          const randomStr = Math.random().toString(36).substring(2, 15);
          sessionId = `${SESSION_PREFIX}${timestamp}_${randomStr}`;
          localStorage.setItem(SESSION_STORAGE_KEY, sessionId);
          console.log('[CartProvider] Created new unified session ID:', sessionId);
          
          // CRITICAL: Dispatch session change event for cross-component sync
          const event = new CustomEvent('cartSessionChanged', { 
            detail: { 
              sessionId: sessionId, 
              reason: 'new_session_created',
              timestamp: timestamp
            } 
          });
          window.dispatchEvent(event);
          console.log('[CartProvider] Session change event dispatched');
        } else {
          console.log('[CartProvider] Retrieved existing unified session ID:', sessionId);
        }
        
        _sessionId = sessionId;
        resolve(sessionId);
      } else {
        resolve(null);
      }
    } catch (error) {
      console.error('[CartProvider] Error creating session ID:', error);
      resolve(null);
    }
  });

  const result = await _sessionPromise;
  _sessionPromise = null; // Clear the promise
  return result;
};

/**
 * Force session reset - use this when session becomes inconsistent
 */
const resetSession = async () => {
  console.log('[CartProvider] Forcing session reset...');
  _sessionId = null;
  _sessionPromise = null;
  _cartCache = null;
  _lastFetchTime = 0;
  if (typeof window !== 'undefined') {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    // Clear any other cart-related storage
    const allKeys = Object.keys(localStorage);
    allKeys.forEach(key => {
      if (key.includes('cart_') || key.includes('session')) {
        localStorage.removeItem(key);
      }
    });
  }
  return await getSessionId();
};

/**
 * Smart cart loading with caching and throttling
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
    const sessionId = await getSessionId();
    console.log('[CartProvider] Making API call to load cart with session:', sessionId);
    
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

  // CRITICAL FIX: Session synchronization across browser events
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleSessionSync = async () => {
      console.log('[CartProvider] Session sync triggered - checking for session changes');
      
      // Check if stored session differs from cached session
      const storedSession = localStorage.getItem(SESSION_STORAGE_KEY);
      if (storedSession && storedSession !== _sessionId) {
        console.log('[CartProvider] Session change detected:', { 
          cached: _sessionId, 
          stored: storedSession 
        });
        
        // Force session update and reload cart
        _sessionId = storedSession;
        _cartCache = null;
        await loadCart(true);
      }
    };

    // Listen for storage changes (cross-tab synchronization)
    const handleStorageChange = (e) => {
      if (e.key === SESSION_STORAGE_KEY) {
        console.log('[CartProvider] Cross-tab session change detected');
        handleSessionSync();
      }
    };

    // Listen for window focus (session sync when returning to tab)
    const handleWindowFocus = () => {
      console.log('[CartProvider] Window focus - syncing session');
      handleSessionSync();
    };

    // Listen for custom session change events
    const handleSessionChange = (e) => {
      console.log('[CartProvider] Custom session change event received:', e.detail);
      handleSessionSync();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('focus', handleWindowFocus);
    window.addEventListener('cartSessionChanged', handleSessionChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleWindowFocus);
      window.removeEventListener('cartSessionChanged', handleSessionChange);
    };
  }, []);// Load cart from API with smart caching
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
  };  // Load cart on mount with debounced initialization
  useEffect(() => {
    // Debounce initial load to prevent multiple rapid calls
    const timeoutId = setTimeout(() => {
      loadCart();
    }, 100);

    return () => clearTimeout(timeoutId);
  }, []);

  // CRITICAL FIX: Force session synchronization on window focus
  useEffect(() => {
    const handleFocus = () => {
      console.log('[CartProvider] Window focused, forcing cart refresh...');
      loadCart(true); // Force refresh to sync with any external changes
    };

    const handleStorageChange = (e) => {
      if (e.key === SESSION_STORAGE_KEY) {
        console.log('[CartProvider] Session storage changed, refreshing cart...');
        _sessionId = null; // Reset cached session
        loadCart(true);
      }
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);
  // Add refresh function for external use (forces cache refresh)
  const refreshCart = () => {
    return loadCart(true); // Force refresh bypasses cache
  };
  // Add item to cart
  const addToCart = async (product, quantity = 1) => {
    try {
      setLoading(true);
      setError(null);

      const sessionId = await getSessionId();
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
      });      if (response.ok) {
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

      const sessionId = await getSessionId();
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
      });      if (response.ok) {
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

      const sessionId = await getSessionId();
      const response = await fetch('/api/v2/cart', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-cart-session-id': sessionId,
        },
        body: JSON.stringify({
          productId: itemId,
        }),
      });      if (response.ok) {
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

      const sessionId = await getSessionId();
      const response = await fetch('/api/v2/cart/clear', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-cart-session-id': sessionId,
        },
      });      if (response.ok) {
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
  };  // Context value
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