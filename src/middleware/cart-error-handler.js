/**
 * Middleware para tratamento padronizado de erros do carrinho
 */

import { getPersistedCartState, persistCartState } from '../utils/cart-utils';

/**
 * Constantes para tipos de erro do carrinho
 */
export const CART_ERROR_TYPES = {
  NETWORK: 'network_error',
  COOKIE: 'cookie_corruption',
  INTERNAL: 'internal_error',
  VALIDATION: 'validation_error',
  SESSION: 'session_expired',
  API: 'api_error',
  UNKNOWN: 'unknown_error'
};

/**
 * Detector centralizado de erros do carrinho
 * @param {Error} error - Erro capturado
 * @param {Object} context - Contexto adicional do erro
 * @returns {Object} Objeto com informações tratadas do erro
 */
export const detectCartErrorType = (error, context = {}) => {
  const errorMessage = error?.message || '';
  const errorStack = error?.stack || '';
  
  // Verificar se é erro de rede
  if (
    errorMessage.includes('Failed to fetch') || 
    errorMessage.includes('NetworkError') ||
    errorMessage.includes('Network request failed')
  ) {
    return {
      type: CART_ERROR_TYPES.NETWORK,
      recoverable: true,
      message: 'Falha na conexão com o servidor. Verifique sua conexão e tente novamente.'
    };
  }
  
  // Verificar se é corrupção de cookie
  if (
    errorMessage.includes('cookie') ||
    errorMessage.includes('Cookie') ||
    errorMessage.includes('Invalid JSON')
  ) {
    return {
      type: CART_ERROR_TYPES.COOKIE,
      recoverable: true,
      message: 'Houve um problema com os dados do seu carrinho. Tentando recuperar...'
    };
  }
  
  // Verificar se é erro de sessão
  if (
    errorMessage.includes('session') ||
    errorMessage.includes('Session') ||
    errorMessage.includes('expired')
  ) {
    return {
      type: CART_ERROR_TYPES.SESSION,
      recoverable: true,
      message: 'Sua sessão expirou. Recarregando dados...'
    };
  }
  
  // Verificar se é erro de API
  if (
    errorMessage.includes('API') ||
    errorMessage.includes('api') ||
    errorMessage.includes('status') ||
    context.apiError
  ) {
    return {
      type: CART_ERROR_TYPES.API,
      recoverable: true,
      message: 'Erro na comunicação com a API. Tentando novamente...'
    };
  }
  
  // Erro desconhecido
  return {
    type: CART_ERROR_TYPES.UNKNOWN,
    recoverable: false,
    message: 'Ocorreu um erro inesperado. Por favor, tente novamente.'
  };
};

/**
 * Tratador de erros do carrinho com tentativas de recuperação
 * @param {Error} error - Erro capturado
 * @param {Object} options - Opções de configuração
 */
export const handleCartError = async (error, options = {}) => {
  const { 
    context = {}, 
    notification = null, 
    recovery = true,
    setCartItems = null,
    setCartCount = null
  } = options;
  
  console.error('[Cart Error Handler] Tratando erro:', error);
  
  // Detectar tipo de erro
  const errorInfo = detectCartErrorType(error, context);
  console.log('[Cart Error Handler] Tipo de erro detectado:', errorInfo);
  
  // Log de telemetria
  try {
    if (typeof window !== 'undefined') {
      const telemetryData = {
        error: {
          message: error?.message,
          type: errorInfo.type,
          stack: error?.stack?.slice(0, 200) || 'No stack',
          timestamp: new Date().toISOString()
        },
        context,
        recovery: errorInfo.recoverable && recovery,
        url: window.location.href
      };
      
      // Enviar dados de telemetria de forma não-bloqueante
      setTimeout(() => {
        try {
          fetch('/api/telemetry/cart-error', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(telemetryData),
            keepalive: true
          }).catch(() => {});
        } catch (e) {
          // Ignorar erros de telemetria
        }
      }, 10);
    }
  } catch (telemetryError) {
    // Ignorar erros na telemetria para não interferir com a recuperação
  }
  
  // Se o erro for recuperável e a recuperação estiver habilitada
  if (errorInfo.recoverable && recovery) {
    // Mostrar notificação se disponível
    if (notification) {
      notification.warning(errorInfo.message);
    }
    
    // Tentar recuperar estado do carrinho
    if (errorInfo.type === CART_ERROR_TYPES.COOKIE || 
        errorInfo.type === CART_ERROR_TYPES.SESSION) {
      
      try {
        // Limpar cookies problemáticos
        document.cookie = "woocommerce_cart=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        document.cookie = "woocommerce_session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        
        // Recuperar estado salvo do carrinho
        const savedCartState = getPersistedCartState();
        
        if (savedCartState && Array.isArray(savedCartState.items)) {
          console.log('[Cart Error Handler] Recuperando carrinho do estado salvo:', savedCartState);
          
          // Restaurar estado
          if (setCartItems && typeof setCartItems === 'function') {
            setCartItems(savedCartState.items);
          }
          
          if (setCartCount && typeof setCartCount === 'function') {
            setCartCount(savedCartState.count || savedCartState.items.length);
          }
          
          // Sincronizar com o servidor
          try {
            const response = await fetch('/api/cart/recover', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ items: savedCartState.items })
            });
            
            if (response.ok) {
              const result = await response.json();
              console.log('[Cart Error Handler] Carrinho restaurado com sucesso:', result);
              
              // Notificar sucesso
              if (notification) {
                notification.success('Seu carrinho foi restaurado com sucesso!');
              }
              
              // Emitir evento de atualização do carrinho
              window.dispatchEvent(new CustomEvent('cartUpdated', { 
                detail: { 
                  source: 'recovery',
                  timestamp: Date.now()
                } 
              }));
              
              return {
                success: true,
                recovered: true,
                items: result.items || savedCartState.items
              };
            }
          } catch (recoveryError) {
            console.error('[Cart Error Handler] Erro ao sincronizar carrinho recuperado:', recoveryError);
          }
        }
      } catch (recoveryAttemptError) {
        console.error('[Cart Error Handler] Falha na tentativa de recuperação:', recoveryAttemptError);
      }
    }
  } else {
    // Erro não recuperável
    if (notification) {
      notification.error(errorInfo.message);
    }
  }
  
  return {
    success: false,
    recovered: false,
    errorInfo
  };
};

/**
 * HOC para envolver funções do carrinho com tratamento de erro
 * @param {Function} cartFunction - Função original do carrinho
 * @param {Object} options - Opções de configuração
 */
export const withErrorHandling = (cartFunction, options = {}) => {
  return async (...args) => {
    try {
      const result = await cartFunction(...args);
      return result;
    } catch (error) {
      return handleCartError(error, options);
    }
  };
};
