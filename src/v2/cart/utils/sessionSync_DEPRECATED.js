/**
 * NOTICE: Este arquivo foi descontinuado e substituído por uma implementação mais simples
 * Está sendo mantido apenas para referência histórica
 */

export const SESSION_EVENTS = {
  CREATED: 'created',
  CHANGED: 'changed',
  SYNCED: 'synced',
  RESET: 'reset',
};

// Esta função não é mais usada
export const getUnifiedSessionId = () => {
  console.warn('[SessionSync] getUnifiedSessionId está depreciada. Use o sistema de sessão simples.');
  return null;
};

// Esta função não é mais usada
export const forceNewSession = () => {
  console.warn('[SessionSync] forceNewSession está depreciada. Use o sistema de sessão simples.');
  return null;
};

// Esta função não é mais usada
export const addSessionListener = (callback) => {
  console.warn('[SessionSync] addSessionListener está depreciada. Use o sistema de sessão simples.');
  return () => {}; // Return empty cleanup function
};

// Esta função não é mais usada
export const initSessionSync = () => {
  console.warn('[SessionSync] initSessionSync está depreciada. Use o sistema de sessão simples.');
  return () => {}; // Return empty cleanup function
};
