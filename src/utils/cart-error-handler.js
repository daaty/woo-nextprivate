/**
 * Sistema centralizado de tratamento de erros do carrinho
 * Fornece mensagens de erro consistentes e logs detalhados
 */

import { v4 as uuidv4 } from 'uuid';

// Tipos de erro conhecidos
export const CART_ERROR_TYPES = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT: 'TIMEOUT',
  INVALID_PRODUCT: 'INVALID_PRODUCT',
  OUT_OF_STOCK: 'OUT_OF_STOCK',
  INVALID_QUANTITY: 'INVALID_QUANTITY',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  RATE_LIMITED: 'RATE_LIMITED',
  SERVER_ERROR: 'SERVER_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
  PRODUCT_NOT_FOUND: 'PRODUCT_NOT_FOUND',
  CART_EMPTY: 'CART_EMPTY',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  FAST_ENDPOINT_ERROR: 'FAST_ENDPOINT_ERROR',
  CART_COUNT_MISMATCH: 'CART_COUNT_MISMATCH'
};

// Mensagens de erro amigáveis ao usuário
const ERROR_MESSAGES = {
  [CART_ERROR_TYPES.NETWORK_ERROR]: 'Problema de conexão. Verifique sua internet e tente novamente.',
  [CART_ERROR_TYPES.TIMEOUT]: 'A operação demorou muito. Tente novamente.',
  [CART_ERROR_TYPES.INVALID_PRODUCT]: 'Produto inválido ou não disponível.',
  [CART_ERROR_TYPES.OUT_OF_STOCK]: 'Produto fora de estoque.',
  [CART_ERROR_TYPES.INVALID_QUANTITY]: 'Quantidade inválida. Deve ser entre 1 e 999.',
  [CART_ERROR_TYPES.SESSION_EXPIRED]: 'Sua sessão expirou. A página será recarregada.',
  [CART_ERROR_TYPES.RATE_LIMITED]: 'Muitas operações em pouco tempo. Aguarde um momento.',
  [CART_ERROR_TYPES.SERVER_ERROR]: 'Erro interno do servidor. Tente novamente em alguns minutos.',
  [CART_ERROR_TYPES.UNKNOWN_ERROR]: 'Ocorreu um erro inesperado. Tente novamente.',
  [CART_ERROR_TYPES.PRODUCT_NOT_FOUND]: 'Produto não encontrado.',
  [CART_ERROR_TYPES.CART_EMPTY]: 'Carrinho está vazio.',
  [CART_ERROR_TYPES.VALIDATION_ERROR]: 'Dados inválidos fornecidos.',
  [CART_ERROR_TYPES.FAST_ENDPOINT_ERROR]: 'Erro no processamento rápido. Usando método alternativo.',
  [CART_ERROR_TYPES.CART_COUNT_MISMATCH]: 'Inconsistência na contagem do carrinho corrigida.'
};

class CartErrorHandler {
  constructor() {
    this.errorLog = [];
    this.maxLogSize = 100;
    this.errorCallbacks = new Set();
  }

  /**
   * Processar erro e retornar informações padronizadas
   */
  processError(error, context = {}) {
    const processedError = this.categorizeError(error);
    const errorInfo = {
      ...processedError,
      context,
      timestamp: new Date().toISOString(),
      id: this.generateErrorId()
    };

    // Adicionar ao log
    this.addToLog(errorInfo);

    // Notificar callbacks registrados
    this.notifyCallbacks(errorInfo);

    // Log no console com detalhes
    this.logError(errorInfo);

    return errorInfo;
  }

  /**
   * Categorizar erro baseado no tipo e conteúdo
   */
  categorizeError(error) {
    let errorType = CART_ERROR_TYPES.UNKNOWN_ERROR;
    let message = ERROR_MESSAGES[CART_ERROR_TYPES.UNKNOWN_ERROR];
    let shouldRetry = false;
    let retryAfter = null;

    // Analisar diferentes tipos de erro
    if (error?.code === 'ECONNABORTED' || error?.code === 'ENOTFOUND') {
      errorType = CART_ERROR_TYPES.NETWORK_ERROR;
      message = ERROR_MESSAGES[CART_ERROR_TYPES.NETWORK_ERROR];
      shouldRetry = true;
      retryAfter = 3000;
    } else if (error?.code === 'TIMEOUT' || error?.message?.includes('timeout')) {
      errorType = CART_ERROR_TYPES.TIMEOUT;
      message = ERROR_MESSAGES[CART_ERROR_TYPES.TIMEOUT];
      shouldRetry = true;
      retryAfter = 2000;
    } else if (error?.response?.status === 400) {
      // Analisar erros 400 mais especificamente
      const responseData = error.response.data;
      if (responseData?.error === 'INVALID_QUANTITY') {
        errorType = CART_ERROR_TYPES.INVALID_QUANTITY;
        message = ERROR_MESSAGES[CART_ERROR_TYPES.INVALID_QUANTITY];
      } else if (responseData?.error === 'PRODUCT_NOT_FOUND') {
        errorType = CART_ERROR_TYPES.PRODUCT_NOT_FOUND;
        message = ERROR_MESSAGES[CART_ERROR_TYPES.PRODUCT_NOT_FOUND];
      } else {
        errorType = CART_ERROR_TYPES.VALIDATION_ERROR;
        message = responseData?.message || ERROR_MESSAGES[CART_ERROR_TYPES.VALIDATION_ERROR];
      }
    } else if (error?.response?.status === 401 || error?.response?.status === 403) {
      errorType = CART_ERROR_TYPES.SESSION_EXPIRED;
      message = ERROR_MESSAGES[CART_ERROR_TYPES.SESSION_EXPIRED];
      shouldRetry = false;
    } else if (error?.response?.status === 404) {
      errorType = CART_ERROR_TYPES.PRODUCT_NOT_FOUND;
      message = ERROR_MESSAGES[CART_ERROR_TYPES.PRODUCT_NOT_FOUND];
    } else if (error?.response?.status === 429) {
      errorType = CART_ERROR_TYPES.RATE_LIMITED;
      message = ERROR_MESSAGES[CART_ERROR_TYPES.RATE_LIMITED];
      shouldRetry = true;
      retryAfter = 5000;
    } else if (error?.response?.status >= 500) {
      // Detectar se é um erro relacionado ao endpoint rápido
      if (error.config?.url?.includes('/api/cart/add-to-cart-fast') || 
          error.message?.includes('add-to-cart-fast')) {
        errorType = CART_ERROR_TYPES.FAST_ENDPOINT_ERROR;
        message = ERROR_MESSAGES[CART_ERROR_TYPES.FAST_ENDPOINT_ERROR];
        shouldRetry = false; // Não tentar novamente, já temos fallback
      } else {
        errorType = CART_ERROR_TYPES.SERVER_ERROR;
        message = ERROR_MESSAGES[CART_ERROR_TYPES.SERVER_ERROR];
        shouldRetry = true;
        retryAfter = 10000;
      }
    } else if (error?.message?.toLowerCase().includes('out of stock')) {
      errorType = CART_ERROR_TYPES.OUT_OF_STOCK;
      message = ERROR_MESSAGES[CART_ERROR_TYPES.OUT_OF_STOCK];
    } else if (error?.message?.toLowerCase().includes('expired token')) {
      errorType = CART_ERROR_TYPES.SESSION_EXPIRED;
      message = ERROR_MESSAGES[CART_ERROR_TYPES.SESSION_EXPIRED];
    } else if (error?.message?.toLowerCase().includes('discrepância') || 
               error?.message?.toLowerCase().includes('mismatch')) {
      errorType = CART_ERROR_TYPES.CART_COUNT_MISMATCH;
      message = ERROR_MESSAGES[CART_ERROR_TYPES.CART_COUNT_MISMATCH];
    }

    return {
      type: errorType,
      message,
      originalError: error,
      shouldRetry,
      retryAfter
    };
  }

  /**
   * Gerar ID único para o erro
   */
  generateErrorId() {
    return uuidv4();
  }

  /**
   * Adicionar erro ao log, mantendo tamanho máximo
   */
  addToLog(errorInfo) {
    this.errorLog.unshift(errorInfo);
    
    // Limitar tamanho do log
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog = this.errorLog.slice(0, this.maxLogSize);
    }
  }

  /**
   * Registrar callback para ser notificado de erros
   */
  onError(callback) {
    this.errorCallbacks.add(callback);
    
    // Retornar função para remover o callback
    return () => {
      this.errorCallbacks.delete(callback);
    };
  }

  /**
   * Notificar todos os callbacks registrados
   */
  notifyCallbacks(errorInfo) {
    this.errorCallbacks.forEach(callback => {
      try {
        callback(errorInfo);
      } catch (err) {
        console.error('Erro ao executar callback de erro:', err);
      }
    });
  }

  /**
   * Log detalhado do erro no console para debug
   */
  logError(errorInfo) {
    console.group(`🚨 Erro do carrinho: ${errorInfo.type}`);
    console.error('Mensagem:', errorInfo.message);
    console.info('Contexto:', errorInfo.context);
    console.debug('Erro original:', errorInfo.originalError);
    console.info('ID:', errorInfo.id);
    console.info('Timestamp:', errorInfo.timestamp);
    console.groupEnd();
  }

  /**
   * Verificar se é um erro crítico (requer intervenção do usuário)
   */
  isCriticalError(errorType) {
    return [
      CART_ERROR_TYPES.SESSION_EXPIRED,
      CART_ERROR_TYPES.SERVER_ERROR
    ].includes(errorType);
  }

  /**
   * Obter todos os erros registrados
   */
  getErrorLog() {
    return [...this.errorLog];
  }

  /**
   * Limpar log de erros
   */
  clearErrorLog() {
    this.errorLog = [];
  }

  /**
   * Tratar erros genéricos com informações de contexto
   */
  handleCartError(error, context = {}) {
    return this.processError(error, context);
  }
}

// Utilitários para tratamento de erros de carrinho
export const cartErrorUtils = {
  /**
   * Formatar erro para exibição ao usuário
   */
  formatErrorForUser: (errorInfo) => {
    return {
      message: errorInfo.message,
      type: errorInfo.type,
      retry: errorInfo.shouldRetry,
      retryAfter: errorInfo.retryAfter
    };
  },
  
  /**
   * Verificar se o erro é de um tipo específico
   */
  isErrorOfType: (errorInfo, errorType) => {
    return errorInfo?.type === errorType;
  },
  
  /**
   * Processar erro com contexto e retornar informações formatadas para o usuário
   */
  handleCartError: (error, context = {}) => {
    const errorHandler = new CartErrorHandler();
    const processedError = errorHandler.processError(error, context);
    return cartErrorUtils.formatErrorForUser(processedError);
  }
};

// Singleton
const cartErrorHandler = new CartErrorHandler();
export default cartErrorHandler;
