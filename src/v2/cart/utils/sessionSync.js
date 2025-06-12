/**
 * CRITICAL SESSION SYNCHRONIZATION UTILITY
 * This ensures ALL cart operations across ALL components use the SAME session ID
 * Fixes the fragmentation issue where products are added to different sessions
 */

const SESSION_STORAGE_KEY = 'unified_cart_session_id';
const SESSION_PREFIX = 'cart_v2_';

// Global session state
let _globalSessionId = null;
let _sessionListeners = new Set();
let _syncInProgress = false;

/**
 * Session synchronization events
 */
const SESSION_EVENTS = {
  CREATED: 'session_created',
  CHANGED: 'session_changed',
  SYNCED: 'session_synced',
  RESET: 'session_reset'
};

/**
 * Get the current unified session ID
 * This is the MASTER function that ALL components must use
 */
export const getUnifiedSessionId = async () => {
  // Return cached session if available
  if (_globalSessionId) {
    console.log('[SessionSync] Using cached global session:', _globalSessionId);
    return _globalSessionId;
  }

  // Prevent multiple concurrent session creations
  if (_syncInProgress) {
    console.log('[SessionSync] Sync in progress, waiting...');
    await waitForSync();
    return _globalSessionId;
  }

  _syncInProgress = true;

  try {
    if (typeof window !== 'undefined') {
      // Check localStorage for existing session
      let sessionId = localStorage.getItem(SESSION_STORAGE_KEY);
      
      // Validate session format
      if (!sessionId || !sessionId.startsWith(SESSION_PREFIX)) {
        console.log('[SessionSync] Creating new unified session');
        sessionId = createNewSession();
        notifySessionEvent(SESSION_EVENTS.CREATED, { sessionId });
      } else {
        console.log('[SessionSync] Retrieved existing unified session:', sessionId);
      }

      // Update global state
      _globalSessionId = sessionId;
      
      // Sync across all listeners
      notifySessionEvent(SESSION_EVENTS.SYNCED, { sessionId });
      
      return sessionId;
    }
    
    return null;
  } finally {
    _syncInProgress = false;
  }
};

/**
 * Force create a new session and sync across all components
 */
export const forceNewSession = () => {
  console.log('[SessionSync] FORCING new session creation');
  
  // Clear current session
  _globalSessionId = null;
  
  if (typeof window !== 'undefined') {
    localStorage.removeItem(SESSION_STORAGE_KEY);
  }
  
  // Create new session
  const newSessionId = createNewSession();
  _globalSessionId = newSessionId;
  
  // Notify all listeners
  notifySessionEvent(SESSION_EVENTS.RESET, { sessionId: newSessionId });
  
  return newSessionId;
};

/**
 * Create a new session ID with proper format
 */
const createNewSession = () => {
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 15);
  const sessionId = `${SESSION_PREFIX}${timestamp}_${randomStr}`;
  
  if (typeof window !== 'undefined') {
    localStorage.setItem(SESSION_STORAGE_KEY, sessionId);
  }
  
  console.log('[SessionSync] New session created:', sessionId);
  return sessionId;
};

/**
 * Wait for ongoing sync to complete
 */
const waitForSync = () => {
  return new Promise((resolve) => {
    const checkSync = () => {
      if (!_syncInProgress) {
        resolve();
      } else {
        setTimeout(checkSync, 50);
      }
    };
    checkSync();
  });
};

/**
 * Add session event listener
 */
export const addSessionListener = (callback) => {
  _sessionListeners.add(callback);
  
  // Return cleanup function
  return () => {
    _sessionListeners.delete(callback);
  };
};

/**
 * Notify all session listeners
 */
const notifySessionEvent = (event, data) => {
  console.log('[SessionSync] Notifying listeners:', event, data);
  
  _sessionListeners.forEach(listener => {
    try {
      listener(event, data);
    } catch (error) {
      console.error('[SessionSync] Listener error:', error);
    }
  });
  
  // Also dispatch browser event for cross-tab sync
  if (typeof window !== 'undefined') {
    const customEvent = new CustomEvent('cartSessionSync', {
      detail: { event, ...data }
    });
    window.dispatchEvent(customEvent);
  }
};

/**
 * Validate session consistency across components
 */
export const validateSessionConsistency = async () => {
  if (typeof window === 'undefined') return true;
  
  const storedSession = localStorage.getItem(SESSION_STORAGE_KEY);
  const globalSession = _globalSessionId;
  
  if (storedSession !== globalSession) {
    console.warn('[SessionSync] Session inconsistency detected:', {
      stored: storedSession,
      global: globalSession
    });
    
    // Force sync to stored session (most recent)
    if (storedSession && storedSession.startsWith(SESSION_PREFIX)) {
      _globalSessionId = storedSession;
      notifySessionEvent(SESSION_EVENTS.CHANGED, { sessionId: storedSession });
      return false;
    }
  }
  
  return true;
};

/**
 * Initialize session synchronization for browser
 */
export const initSessionSync = () => {
  if (typeof window === 'undefined') return;
  
  console.log('[SessionSync] Initializing browser session sync');
  
  // Listen for storage changes (cross-tab sync)
  const handleStorageChange = (e) => {
    if (e.key === SESSION_STORAGE_KEY && e.newValue !== _globalSessionId) {
      console.log('[SessionSync] Cross-tab session change detected');
      _globalSessionId = e.newValue;
      notifySessionEvent(SESSION_EVENTS.CHANGED, { sessionId: e.newValue });
    }
  };
  
  // Listen for window focus (sync when returning to tab)
  const handleWindowFocus = async () => {
    console.log('[SessionSync] Window focus - validating session consistency');
    await validateSessionConsistency();
  };
  
  // Listen for custom sync events
  const handleSyncEvent = (e) => {
    const { event, sessionId } = e.detail;
    console.log('[SessionSync] Received sync event:', event, sessionId);
    
    if (sessionId && sessionId !== _globalSessionId) {
      _globalSessionId = sessionId;
    }
  };
  
  window.addEventListener('storage', handleStorageChange);
  window.addEventListener('focus', handleWindowFocus);
  window.addEventListener('cartSessionSync', handleSyncEvent);
  
  // Return cleanup function
  return () => {
    window.removeEventListener('storage', handleStorageChange);
    window.removeEventListener('focus', handleWindowFocus);
    window.removeEventListener('cartSessionSync', handleSyncEvent);
  };
};

/**
 * Debug utility to check session state
 */
export const debugSessionState = () => {
  const storedSession = typeof window !== 'undefined' 
    ? localStorage.getItem(SESSION_STORAGE_KEY) 
    : null;
    
  return {
    globalSession: _globalSessionId,
    storedSession,
    consistent: storedSession === _globalSessionId,
    listenerCount: _sessionListeners.size,
    syncInProgress: _syncInProgress
  };
};

export default {
  getUnifiedSessionId,
  forceNewSession,
  addSessionListener,
  validateSessionConsistency,
  initSessionSync,
  debugSessionState,
  SESSION_EVENTS
};
