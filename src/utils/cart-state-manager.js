/**
 * Gerenciador centralizado de estado do carrinho
 * Resolve problemas de sincronização e condições de corrida
 */
import { cartLockHelpers } from './cart-lock';

class CartStateManager {
  constructor() {
    this.cart = null;
    this.subscribers = new Set(); // CORREÇÃO: Usar Set em vez de array
    this.lockHelper = cartLockHelpers; // CORREÇÃO: Usar cartLockHelpers diretamente
    this.isInitialized = false;
  }

  /**
   * Inicializar o gerenciador de estado
   */
  initialize() {
    console.log('🚀 [CartStateManager] Inicializado');
    this.isInitialized = true;
    this.loadFromLocalStorage();
  }

  /**
   * Carregar carrinho do localStorage
   */
  loadFromLocalStorage() {
    try {
      const savedCart = localStorage.getItem('woo-next-cart');
      if (savedCart) {
        const parsedCart = JSON.parse(savedCart);
        this.cart = this.validateCartData(parsedCart);
        this.notifySubscribers();
        console.log('📦 [CartStateManager] Carrinho carregado do localStorage');
      }
    } catch (error) {
      console.error('❌ [CartStateManager] Erro ao carregar carrinho do localStorage:', error);
      this.clearLocalStorage();
    }
  }

  /**
   * Validar dados do carrinho
   */
  validateCartData(cartData) {
    if (!cartData || typeof cartData !== 'object') {
      return null;
    }

    // Validar estrutura básica do carrinho
    const validatedCart = {
      products: Array.isArray(cartData.products) ? cartData.products : [],
      totalProductsCount: cartData.totalProductsCount || 0,
      totalProductsPrice: cartData.totalProductsPrice || 0,
      ...(cartData.chosenShippingMethod && { chosenShippingMethod: cartData.chosenShippingMethod }),
      ...(cartData.totalPrice && { totalPrice: cartData.totalPrice }),
      ...(cartData.session && { session: cartData.session })
    };

    // Validar produtos individuais
    validatedCart.products = validatedCart.products.filter(product => {
      return product && 
             product.productId && 
             typeof product.qty === 'number' && 
             product.qty > 0;
    });

    // Recalcular totais se necessário
    if (validatedCart.products.length !== validatedCart.totalProductsCount) {
      validatedCart.totalProductsCount = validatedCart.products.length;
    }

    return validatedCart;
  }

  /**
   * Salvar carrinho no localStorage
   */
  saveToLocalStorage() {
    if (typeof window === 'undefined') return;

    try {
      if (this.cart) {
        localStorage.setItem('woo-next-cart', JSON.stringify(this.cart));
        console.log('💾 [CartStateManager] Carrinho salvo no localStorage');
      } else {
        localStorage.removeItem('woo-next-cart');
        console.log('🗑️ [CartStateManager] Carrinho removido do localStorage');
      }
    } catch (error) {
      console.error('❌ [CartStateManager] Erro ao salvar carrinho no localStorage:', error);
    }
  }

  /**
   * Limpar localStorage
   */
  clearLocalStorage() {
    if (typeof window === 'undefined') return;
    
    localStorage.removeItem('woo-next-cart');
    console.log('🧹 [CartStateManager] localStorage limpo');
  }

  /**
   * Lidar com mudanças no localStorage (outras abas)
   */
  handleStorageChange(event) {
    if (event.key === 'woo-next-cart') {
      console.log('🔄 [CartStateManager] Mudança detectada em outra aba');
      this.loadFromLocalStorage();
    }
  }

  /**
   * Lidar com mudanças de visibilidade da página
   */
  handleVisibilityChange() {
    if (!document.hidden) {
      // Página ficou visível, verificar se há atualizações
      console.log('👁️ [CartStateManager] Página ficou visível, verificando atualizações');
      this.queueSync();
    }
  }

  /**
   * Obter carrinho atual
   */
  getCart() {
    return this.cart;
  }
  /**
   * Atualizar carrinho com proteção contra condições de corrida
   */
  async updateCart(newCartData, source = 'unknown') {
    return cartLockHelpers.syncCart(async () => {
      console.log(`🔄 [CartStateManager] Atualizando carrinho (fonte: ${source})`);
      
      const validatedCart = this.validateCartData(newCartData);
      
      // Verificar se realmente há mudanças (mais preciso)
      if (this.isCartEqual(this.cart, validatedCart)) {
        console.log('⏭️ [CartStateManager] Nenhuma mudança detectada, pulando atualização');
        return this.cart;
      }

      const previousCart = this.cart;
      this.cart = validatedCart;
      this.saveToLocalStorage();
      
      // Notify subscribers immediately for real-time UI updates
      this.notifySubscribers();
      this.lastSyncTimestamp = Date.now();
      
      // Log changes for debugging
      if (previousCart && validatedCart) {
        const prevCount = this.calculateCartCount(previousCart);
        const newCount = this.calculateCartCount(validatedCart);
        if (prevCount !== newCount) {
          console.log(`📊 [CartStateManager] Cart count changed: ${prevCount} → ${newCount}`);
        }
      }
      
      console.log('✅ [CartStateManager] Carrinho atualizado com sucesso');
      return this.cart;
    });
  }
  /**
   * Comparar se dois carrinhos são iguais
   */
  isCartEqual(cart1, cart2) {
    if (!cart1 && !cart2) return true;
    if (!cart1 || !cart2) return false;

    try {
      // Compare cart counts first for quick check
      const count1 = this.calculateCartCount(cart1);
      const count2 = this.calculateCartCount(cart2);
      if (count1 !== count2) return false;
      
      return JSON.stringify(cart1) === JSON.stringify(cart2);
    } catch {
      return false;
    }
  }

  /**
   * Calculate cart count from cart data
   */
  calculateCartCount(cartData) {
    if (!cartData?.products || !Array.isArray(cartData.products)) {
      return 0;
    }
    
    return cartData.products.reduce((total, item) => {
      const qty = parseInt(item.qty || 0);
      return total + (isNaN(qty) ? 0 : qty);
    }, 0);
  }

  /**
   * Limpar carrinho
   */
  async clearCart() {
    return cartLockHelpers.clearCart(async () => {
      console.log('🗑️ [CartStateManager] Limpando carrinho');
      
      this.cart = null;
      this.clearLocalStorage();
      this.notifySubscribers();
      
      console.log('✅ [CartStateManager] Carrinho limpo com sucesso');
      return null;
    });
  }

  /**
   * Adicionar produto ao carrinho
   */
  async addProduct(productData) {
    if (!productData?.productId) {
      throw new Error('ID do produto é obrigatório');
    }

    return cartLockHelpers.addToCart(productData.productId, async () => {
      console.log(`➕ [CartStateManager] Adicionando produto ${productData.productId}`);
      
      const currentCart = this.cart || { products: [], totalProductsCount: 0, totalProductsPrice: 0 };
      const existingProductIndex = currentCart.products.findIndex(
        product => product.productId === productData.productId
      );

      let updatedProducts = [...currentCart.products];

      if (existingProductIndex >= 0) {
        // Produto já existe, atualizar quantidade
        updatedProducts[existingProductIndex] = {
          ...updatedProducts[existingProductIndex],
          qty: updatedProducts[existingProductIndex].qty + (productData.qty || 1)
        };
      } else {
        // Novo produto
        updatedProducts.push({
          ...productData,
          qty: productData.qty || 1
        });
      }

      const updatedCart = {
        ...currentCart,
        products: updatedProducts,
        totalProductsCount: updatedProducts.length
      };

      return this.updateCart(updatedCart, 'addProduct');
    });
  }

  /**
   * Remover produto do carrinho
   */
  async removeProduct(productId) {
    if (!productId) {
      throw new Error('ID do produto é obrigatório');
    }

    return cartLockHelpers.removeCartItem(productId, async () => {
      console.log(`➖ [CartStateManager] Removendo produto ${productId}`);
      
      if (!this.cart?.products) {
        console.log('🔍 [CartStateManager] Carrinho vazio, nada para remover');
        return this.cart;
      }

      const updatedProducts = this.cart.products.filter(
        product => product.productId !== productId
      );

      const updatedCart = {
        ...this.cart,
        products: updatedProducts,
        totalProductsCount: updatedProducts.length
      };

      return this.updateCart(updatedCart, 'removeProduct');
    });
  }

  /**
   * Atualizar quantidade de produto
   */
  async updateProductQuantity(productId, newQuantity) {
    if (!productId) {
      throw new Error('ID do produto é obrigatório');
    }

    if (newQuantity <= 0) {
      return this.removeProduct(productId);
    }

    return cartLockHelpers.updateCartItem(productId, async () => {
      console.log(`🔢 [CartStateManager] Atualizando quantidade do produto ${productId} para ${newQuantity}`);
      
      if (!this.cart?.products) {
        throw new Error('Produto não encontrado no carrinho');
      }

      const productIndex = this.cart.products.findIndex(
        product => product.productId === productId
      );

      if (productIndex === -1) {
        throw new Error('Produto não encontrado no carrinho');
      }

      const updatedProducts = [...this.cart.products];
      updatedProducts[productIndex] = {
        ...updatedProducts[productIndex],
        qty: newQuantity
      };

      const updatedCart = {
        ...this.cart,
        products: updatedProducts
      };

      return this.updateCart(updatedCart, 'updateQuantity');
    });
  }

  /**
   * Subscribe to cart changes
   */
  subscribe(callback) {
    this.subscribers.add(callback);
    
    // Notificar imediatamente se há um carrinho
    if (this.cart) {
      callback(this.cart);
    }
    
    // Retornar função de unsubscribe
    return () => {
      this.subscribers.delete(callback); // CORREÇÃO: Usar delete em vez de splice
    };
  }

  /**
   * Notify all subscribers of cart changes
   */
  notifySubscribers() {
    this.subscribers.forEach(callback => { // CORREÇÃO: forEach funciona tanto com Set quanto array
      try {
        callback(this.cart);
      } catch (error) {
        console.error('🔴 [CartStateManager] Erro ao notificar subscriber:', error);
      }
    });
  }

  /**
   * Adicionar sincronização à fila
   */
  queueSync(forceSync = false) {
    const now = Date.now();
    
    // Verificar se é necessário sincronizar
    if (!forceSync && (now - this.lastSyncTimestamp) < 5000) {
      console.log('⏭️ [CartStateManager] Sincronização muito recente, pulando');
      return;
    }

    if (!this.syncInProgress) {
      this.syncInProgress = true;
      setTimeout(() => this.processSyncQueue(), 100);
    }
  }

  /**
   * Processar fila de sincronização
   */
  async processSyncQueue() {
    try {
      console.log('🔄 [CartStateManager] Processando fila de sincronização');
      
      // Aqui seria integrado com o sistema de API para sincronizar com o servidor
      // Por enquanto, apenas simular o processo
      await new Promise(resolve => setTimeout(resolve, 500));
      
      this.lastSyncTimestamp = Date.now();
      console.log('✅ [CartStateManager] Sincronização concluída');
      
    } catch (error) {
      console.error('❌ [CartStateManager] Erro na sincronização:', error);
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Obter estatísticas do carrinho
   */
  getStats() {
    return {
      isInitialized: this.isInitialized,
      hasCart: !!this.cart,
      productCount: this.cart?.totalProductsCount || 0,
      syncInProgress: this.syncInProgress,
      lastSyncTimestamp: this.lastSyncTimestamp,
      subscriberCount: this.subscribers.size,
      lockStatus: cartLockManager.getLockStatus()
    };
  }

  /**
   * Destruir o gerenciador (cleanup)
   */
  destroy() {
    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', this.handleStorageChange.bind(this));
      document.removeEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
    }
    
    this.subscribers.clear();
    cartLockManager.clearAllLocks();
    this.isInitialized = false;
    
    console.log('🔥 [CartStateManager] Destruído');
  }

  /**
   * Update cart state with enhanced validation
   * CORREÇÃO: Prevenir corrupção da contagem do carrinho
   */
  updateCart(newCart, source = 'unknown') {
    console.log(`🔄 [CartStateManager] Atualizando carrinho (fonte: ${source})`);
    
    // CORREÇÃO CRÍTICA: Ignorar atualizações otimistas vazias
    if (source === 'fast-endpoint-optimistic' && (!newCart || !newCart.products)) {
      console.log('⏭️ [CartStateManager] Ignorando atualização otimista vazia');
      return;
    }
    
    // Validação de entrada
    if (!newCart && source !== 'clear-cart-mutation') {
      console.warn('⚠️ [CartStateManager] Tentativa de atualizar com carrinho null/undefined');
      return;
    }
    
    const lockId = 'cart_sync';
    
    // CORREÇÃO: Usar cartLockHelpers diretamente para operações thread-safe
    cartLockHelpers.acquireLock(lockId, 5000).then(operationId => {
      try {
        const currentCart = this.cart;
        
        // Se não há mudanças, pular atualização
        if (this.areCartsEqual(currentCart, newCart)) {
          console.log('⏭️ [CartStateManager] Nenhuma mudança detectada, pulando atualização');
          return;
        }
        
        // CORREÇÃO: Preservar a contagem correta do backend
        let finalCart = newCart;
        if (newCart && typeof newCart.totalProductsCount === 'number') {
          // Se temos uma contagem válida do backend, usar ela
          console.log(`📊 [CartStateManager] Usando contagem do backend: ${newCart.totalProductsCount}`);
        } else if (newCart && newCart.products && Array.isArray(newCart.products)) {
          // Calcular manualmente apenas se necessário
          const calculatedCount = newCart.products.reduce((total, item) => {
            const qty = parseInt(item.qty || 0);
            return total + (isNaN(qty) ? 0 : qty);
          }, 0);
          
          finalCart = {
            ...newCart,
            totalProductsCount: calculatedCount
          };
          console.log(`🔢 [CartStateManager] Contagem calculada manualmente: ${calculatedCount}`);
        }
        
        // Notificar mudança na contagem se houver
        const oldCount = currentCart?.totalProductsCount || 0;
        const newCount = finalCart?.totalProductsCount || 0;
        if (oldCount !== newCount) {
          console.log(`📊 [CartStateManager] Cart count changed: ${oldCount} → ${newCount}`);
        }
        
        this.cart = finalCart;
        console.log('✅ [CartStateManager] Carrinho atualizado com sucesso');
        
        // Salvar no localStorage apenas se for um carrinho válido
        if (finalCart && finalCart.products && finalCart.products.length > 0) {
          this.saveToLocalStorage();
        } else if (source === 'clear-cart-mutation' || (finalCart && finalCart.products && finalCart.products.length === 0)) {
          this.removeFromLocalStorage();
        }
        
        // Notificar subscribers
        this.notifySubscribers();
        
      } catch (error) {
        console.error('🔴 [CartStateManager] Erro ao atualizar carrinho:', error);
      } finally {
        cartLockHelpers.releaseLock(lockId, operationId);
      }
    }).catch(error => {
      console.error('🔴 [CartStateManager] Erro ao adquirir lock:', error);
    });
  }

  /**
   * Compare two cart objects to check if they are equal
   * ADICIONADO: Método que estava faltando
   */
  areCartsEqual(cart1, cart2) {
    // Se ambos são null/undefined, são iguais
    if (!cart1 && !cart2) return true;
    
    // Se apenas um é null/undefined, são diferentes
    if (!cart1 || !cart2) return false;
    
    try {
      // Comparar contagem total de produtos
      const count1 = cart1.totalProductsCount || 0;
      const count2 = cart2.totalProductsCount || 0;
      
      if (count1 !== count2) {
        console.log('🔄 [CartStateManager] Contagens diferentes:', count1, 'vs', count2);
        return false;
      }
      
      // Comparar array de produtos
      const products1 = cart1.products || [];
      const products2 = cart2.products || [];
      
      if (products1.length !== products2.length) {
        console.log('🔄 [CartStateManager] Número de produtos diferentes:', products1.length, 'vs', products2.length);
        return false;
      }
      
      // Comparar cada produto individualmente
      for (let i = 0; i < products1.length; i++) {
        const p1 = products1[i];
        const p2 = products2[i];
        
        // Comparar propriedades essenciais
        if (p1.cartKey !== p2.cartKey || 
            p1.qty !== p2.qty || 
            p1.productId !== p2.productId) {
          console.log('🔄 [CartStateManager] Produto diferente no índice', i, ':', p1, 'vs', p2);
          return false;
        }
      }
      
      // Comparar preço total
      const price1 = cart1.totalProductsPrice || '';
      const price2 = cart2.totalProductsPrice || '';
      
      if (price1 !== price2) {
        console.log('🔄 [CartStateManager] Preços diferentes:', price1, 'vs', price2);
        return false;
      }
      
      console.log('✅ [CartStateManager] Carrinhos são iguais');
      return true;
      
    } catch (error) {
      console.error('🔴 [CartStateManager] Erro ao comparar carrinhos:', error);
      return false;
    }
  }
}

// Instância singleton
const cartStateManager = new CartStateManager();

export default cartStateManager;
