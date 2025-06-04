/**
 * Sistema de bloqueio para operações do carrinho
 * Previne condições de corrida e operações simultâneas
 */

class CartLockManager {
  constructor() {
    this.locks = new Map();
    this.operationQueue = new Map();
  }

  /**
   * Criar um identificador único para a operação
   */
  createOperationId(type, productId = null, key = null) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `${type}_${productId || 'global'}_${key || 'default'}_${timestamp}_${random}`;
  }

  /**
   * Verificar se uma operação está bloqueada
   */
  isLocked(lockKey) {
    return this.locks.has(lockKey);
  }

  /**
   * Adquirir um bloqueio para uma operação
   */
  async acquireLock(lockKey, operationId, timeout = 10000) {
    return new Promise((resolve, reject) => {
      const attemptLock = () => {
        if (!this.locks.has(lockKey)) {
          this.locks.set(lockKey, {
            operationId,
            timestamp: Date.now(),
            timeout: setTimeout(() => {
              this.releaseLock(lockKey, operationId);
              reject(new Error(`Lock timeout para ${lockKey}`));
            }, timeout)
          });
          
          console.log(`🔒 [CartLock] Lock adquirido: ${lockKey} (${operationId})`);
          resolve();
        } else {
          // Se já está bloqueado, aguardar um pouco e tentar novamente
          setTimeout(attemptLock, 50);
        }
      };
      
      attemptLock();
    });
  }

  /**
   * Liberar um bloqueio
   */
  releaseLock(lockKey, operationId) {
    const lock = this.locks.get(lockKey);
    
    if (lock && lock.operationId === operationId) {
      clearTimeout(lock.timeout);
      this.locks.delete(lockKey);
      console.log(`🔓 [CartLock] Lock liberado: ${lockKey} (${operationId})`);
      
      // Processar próxima operação na fila se existir
      this.processQueue(lockKey);
    }
  }

  /**
   * Executar operação com bloqueio automático
   */
  async executeWithLock(lockKey, operation, timeout = 10000) {
    const operationId = this.createOperationId('execute', lockKey);
    
    try {
      await this.acquireLock(lockKey, operationId, timeout);
      const result = await operation();
      this.releaseLock(lockKey, operationId);
      return result;
    } catch (error) {
      this.releaseLock(lockKey, operationId);
      throw error;
    }
  }

  /**
   * Adicionar operação à fila
   */
  addToQueue(lockKey, operation) {
    if (!this.operationQueue.has(lockKey)) {
      this.operationQueue.set(lockKey, []);
    }
    this.operationQueue.get(lockKey).push(operation);
  }
  /**
   * Processar fila de operações
   */
  processQueue(lockKey) {
    const queue = this.operationQueue.get(lockKey);
    if (queue && queue.length > 0) {
      const nextOperation = queue.shift();
      if (typeof nextOperation === 'function') {
        setTimeout(nextOperation, 10);
      }
    }
  }

  /**
   * Limpar todos os bloqueios (emergência)
   */
  clearAllLocks() {
    for (const [lockKey, lock] of this.locks.entries()) {
      clearTimeout(lock.timeout);
      console.log(`🧹 [CartLock] Lock emergencial liberado: ${lockKey}`);
    }
    this.locks.clear();
    this.operationQueue.clear();
  }

  /**
   * Obter status dos bloqueios
   */
  getLockStatus() {
    const status = {};
    for (const [lockKey, lock] of this.locks.entries()) {
      status[lockKey] = {
        operationId: lock.operationId,
        timestamp: lock.timestamp,
        age: Date.now() - lock.timestamp
      };
    }
    return status;
  }
}

// Instância singleton
const cartLockManager = new CartLockManager();

export default cartLockManager;

// Tipos de bloqueio específicos para operações do carrinho
export const LOCK_TYPES = {
  ADD_TO_CART: 'add_to_cart',
  UPDATE_CART_ITEM: 'update_cart_item',
  REMOVE_CART_ITEM: 'remove_cart_item',
  CLEAR_CART: 'clear_cart',
  CART_SYNC: 'cart_sync',
  CHECKOUT_PROCESS: 'checkout_process',
  SESSION_UPDATE: 'session_update'
};

// Helpers para operações específicas
export const cartLockHelpers = {
  /**
   * Adquirir bloqueio manual (para uso direto)
   */
  async acquireLock(lockKey, timeout = 10000) {
    const operationId = cartLockManager.createOperationId('manual', lockKey);
    await cartLockManager.acquireLock(lockKey, operationId, timeout);
    return operationId;
  },

  /**
   * Liberar bloqueio manual (para uso direto)
   */
  releaseLock(lockKey, operationId) {
    cartLockManager.releaseLock(lockKey, operationId);
  },

  /**
   * Verificar se está bloqueado
   */
  isLocked(lockKey) {
    return cartLockManager.isLocked(lockKey);
  },

  /**
   * Bloqueio para adicionar produto ao carrinho
   */
  async addToCart(productId, operation) {
    const lockKey = `${LOCK_TYPES.ADD_TO_CART}_${productId}`;
    return cartLockManager.executeWithLock(lockKey, operation);
  },

  /**
   * Bloqueio para atualizar item do carrinho
   */
  async updateCartItem(cartKey, operation) {
    const lockKey = `${LOCK_TYPES.UPDATE_CART_ITEM}_${cartKey}`;
    return cartLockManager.executeWithLock(lockKey, operation);
  },

  /**
   * Bloqueio para remover item do carrinho
   */
  async removeCartItem(cartKey, operation) {
    const lockKey = `${LOCK_TYPES.REMOVE_CART_ITEM}_${cartKey}`;
    return cartLockManager.executeWithLock(lockKey, operation);
  },

  /**
   * Bloqueio para limpar carrinho
   */
  async clearCart(operation) {
    const lockKey = LOCK_TYPES.CLEAR_CART;
    return cartLockManager.executeWithLock(lockKey, operation);
  },

  /**
   * Bloqueio para sincronização do carrinho
   */
  async syncCart(operation) {
    const lockKey = LOCK_TYPES.CART_SYNC;
    return cartLockManager.executeWithLock(lockKey, operation);
  },

  /**
   * Bloqueio para processo de checkout
   */
  async checkoutProcess(operation) {
    const lockKey = LOCK_TYPES.CHECKOUT_PROCESS;
    return cartLockManager.executeWithLock(lockKey, operation, 30000); // 30s timeout
  },

  /**
   * Bloqueio para atualização de sessão
   */
  async updateSession(operation) {
    const lockKey = LOCK_TYPES.SESSION_UPDATE;
    return cartLockManager.executeWithLock(lockKey, operation);
  }
};
