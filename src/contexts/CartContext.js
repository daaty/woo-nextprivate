// CartContext.js - Enhanced version integrated with state manager
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useCart } from '../v2/cart/hooks/useCart'; // Using Cart v2

// Create context with enhanced default values
const CartContext = createContext({
  // Core cart data
  cartItems: [],
  cartTotal: '0',
  formattedTotal: 'R$ 0,00',
  
  // Loading states
  loading: false,
  error: null,
  addingToCart: false,
  updatingCart: false,
  removingFromCart: false,
  clearingCart: false,
  operationInProgress: false,
  
  // Actions
  addToCart: async () => ({ success: false, error: 'Not initialized' }),
  updateCartItem: async () => ({ success: false, error: 'Not initialized' }),
  removeCartItem: async () => ({ success: false, error: 'Not initialized' }),
  clearCart: async () => ({ success: false, error: 'Not initialized' }),
  refetchCart: async () => {},
  continueIterating: async () => {},
  
  // State management
  syncWithServer: async () => {},
  resetErrors: () => {},
  
  // Status
  lastAddedProduct: null,
  requestError: null,
  isIterating: false
});

/**
 * Enhanced Cart Provider with state manager integration
 */
export const CartProvider = ({ children }) => {
  const [contextReady, setContextReady] = useState(false);
  const [lastOperation, setLastOperation] = useState(null);
  const [cartTotalValue, setCartTotalValue] = useState(0);
  const [lastLogTimestamp, setLastLogTimestamp] = useState(0); // Novo estado para controlar logs duplicados
  
  const cartData = useCart(); // Agora é REST puro!

  // Efeito para sincronizar o contador e marcar contexto como pronto
  useEffect(() => {
    // Evitar logs duplicados muito próximos (menos de 300ms)
    const now = Date.now();
    if (now - lastLogTimestamp > 300) {
      console.log('[CartContext] 🔍 Dados recebidos do useCart:', {
        cartItems: cartData.cartItems?.length || 0,
        cartCount: cartData.cartCount,
        loading: cartData.loading,
        cart: cartData.cart,
        hasCart: !!cartData.cart
      });
      setLastLogTimestamp(now);
    }

    // Marcar contexto como pronto assim que o loading for false
    if (cartData.loading === false) {
      console.log('[CartContext] ✅ Loading finalizado, marcando contexto como pronto');
      setContextReady(true);
      
      // Buscar dados atualizados diretamente da API apenas se o contador for zero 
      // ou se houver divergência entre número de itens e contador
      const calculatedCount = cartData.cartItems?.reduce((total, item) => {
        return total + (parseInt(item.quantity || item.qty) || 1);
      }, 0) || 0;
      
      if (cartCount === 0 || (cartData.cartItems?.length > 0 && calculatedCount !== cartCount)) {
        console.log('[CartContext] 🔄 Iniciando sincronização por divergência de dados');
        fetchLatestCartData();
      } else {
        console.log('[CartContext] ✓ Dados já sincronizados, contador:', cartCount);
      }
    }
    // Se ainda está carregando, manter contexto não pronto
    else if (cartData.loading === true) {
      console.log('[CartContext] ⏳ Ainda carregando, contexto não pronto');
      setContextReady(false);
    }
  }, [cartData.cartItems, cartData.cartCount, cartData.loading, cartData.cart, cartCount, lastLogTimestamp]);

  // NOVO: Função para calcular total do carrinho com validação mais robusta
  const calculateCartTotal = (items) => {
    if (!Array.isArray(items) || items.length === 0) {
      return 0;
    }

    return items.reduce((total, item) => {
      let price = 0;
      let quantity = 1;
      
      // Extrair preço com fallbacks robustos
      if (typeof item.price === 'number') {
        price = item.price;
      } else if (item.price_raw && !isNaN(parseFloat(item.price_raw))) {
        price = parseFloat(item.price_raw);
      } else if (typeof item.price === 'string') {
        // Limpar a string e converter para número
        const cleanedPrice = item.price.replace(/[^\d.,\-]/g, '').replace(',', '.');
        if (!isNaN(parseFloat(cleanedPrice))) {
          price = parseFloat(cleanedPrice);
        }
      } else if (item.totals?.total && !isNaN(parseFloat(item.totals.total))) {
        price = parseFloat(item.totals.total);
      }
      
      // Extrair quantidade com fallbacks robustos
      if (item.quantity && !isNaN(parseInt(item.quantity))) {
        quantity = parseInt(item.quantity);
      } else if (item.qty && !isNaN(parseInt(item.qty))) {
        quantity = parseInt(item.qty);
      }
      
      const itemTotal = price * quantity;
      
      if (!isNaN(itemTotal) && itemTotal > 0) {
        return total + itemTotal;
      }
      
      return total;
    }, 0);
  };

  // NOVO: Efeito para sincronizar o total do carrinho quando os itens mudam
  useEffect(() => {
    if (Array.isArray(cartData.cartItems) && cartData.cartItems.length > 0) {
      const newTotal = calculateCartTotal(cartData.cartItems);
      if (newTotal > 0 && Math.abs(newTotal - cartTotalValue) > 0.01) {
        console.log('[CartContext] 💰 Total do carrinho calculado:', newTotal);
        setCartTotalValue(newTotal);
        
        // Armazenar em uma propriedade global para debugging e backups
        if (typeof window !== 'undefined') {
          window._cartTotalCalculated = newTotal;
        }
      }
    }
  }, [cartData.cartItems, cartTotalValue]);

  // Função para buscar os dados mais recentes do carrinho com tratamento de erro melhorado
  const fetchLatestCartData = async () => {
    try {
      console.log('[CartContext] 🔄 Buscando dados atualizados do carrinho');
      
      const response = await fetch('/api/cart/simple-get', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin'
      });
      
      if (!response.ok) {
        throw new Error(`Erro na API: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      if (result.success && result.cart) {
        // CORRIGIDO: Cálculo mais preciso da contagem de itens
        let newCount = 0;
        
        // Primeiro tenta usar o valor específico de items_count da API
        if (typeof result.cart.items_count === 'number') {
          newCount = result.cart.items_count;
        } 
        // Se não existe, calcula baseado nos itens e suas quantidades
        else if (Array.isArray(result.cart.items)) {
          newCount = result.cart.items.reduce((total, item) => {
            return total + (parseInt(item.quantity) || 1);
          }, 0);
        }
        
        console.log('[CartContext] ✅ Contador atualizado via API direta:', newCount);
        setCartCount(newCount);
        setLastOperation({type: 'fetch', timestamp: Date.now(), success: true});
        
        // NOVO: Atualizar o valor total do carrinho
        if (typeof result.cart.total_numeric === 'number') {
          console.log('[CartContext] 💰 Total do carrinho atualizado da API:', result.cart.total_numeric);
          setCartTotalValue(result.cart.total_numeric);
        } else if (Array.isArray(result.cart.items)) {
          const calculatedTotal = calculateCartTotal(result.cart.items);
          console.log('[CartContext] 💰 Total do carrinho calculado dos itens:', calculatedTotal);
          setCartTotalValue(calculatedTotal);
        }
        
        // Verificar se há dados adicionais no sistema melhorado de carrinho
        if (result.cart.items && result.cart.items.length) {
          console.log(`[CartContext] ℹ️ Carrinho do servidor tem ${result.cart.items.length} tipos de itens (${newCount} unidades totais)`);
        }
      } else {
        console.warn('[CartContext] ⚠️ Resposta da API sem dados do carrinho:', result);
      }
      return result;
    } catch (error) {
      console.error('[CartContext] ❌ Erro ao buscar dados do carrinho:', error);
      setLastOperation({type: 'fetch', timestamp: Date.now(), success: false, error: error.message});
      return {success: false, error: error.message};
    }
  };

  // NOVO: Garantir sincronização entre cartItems e cartCount
  useEffect(() => {
    // Se não estiver carregando e tivermos itens, mas contador for zero
    if (!cartData.loading && cartData.cartItems?.length > 0 && cartCount === 0) {
      console.log('[CartContext] ⚠️ Detectada inconsistência: temos itens mas contador é zero, sincronizando...');
      
      // Calcula contagem baseada nos itens disponíveis do useCart
      const calculatedCount = cartData.cartItems.reduce((total, item) => {
        return total + (parseInt(item.quantity) || 1);
      }, 0);
      
      if (calculatedCount > 0) {
        console.log('[CartContext] 🔄 Atualizando contador para', calculatedCount, 'baseado nos itens existentes');
        setCartCount(calculatedCount);
      } else {
        // Se ainda tiver inconsistência, forçar atualização da API
        fetchLatestCartData();
      }
    }
  }, [cartData.loading, cartData.cartItems, cartCount]);

  // Escutar eventos de atualização do carrinho com tratamento melhorado
  useEffect(() => {
    const handleCartUpdate = async (event) => {
      console.log('[CartContext] 🔔 Evento de atualização recebido:', event.type, event.detail);
      
      // Tratamento especial para cartCleared
      if (event.type === 'cartCleared') {
        console.log('[CartContext] 🧹 Carrinho foi limpo, zerando dados imediatamente');
        setCartCount(0);
        setCartTotalValue(0);
        setContextReady(true);
        setLastOperation({type: 'clear', timestamp: Date.now(), success: true});
        
        // IMPORTANTE: Limpar qualquer estado local de itens para evitar recuperação incorreta
        if (cartData && typeof cartData.setCartItems === 'function') {
          cartData.setCartItems([]);
        }
        
        // Forçar limpeza de qualquer backup ou cache local
        if (typeof window !== 'undefined') {
          try {
            // Limpar propriedades globais usadas para debug/backup
            window._cartTotalCalculated = 0;
            window._calculatedSubtotal = 0;
            sessionStorage.removeItem('cartItemsBackup');
          } catch (e) {
            console.error('[CartContext] Erro ao limpar armazenamento local:', e);
          }
        }
        
        // Garantir que a sessão do servidor também seja limpa através de API
        try {
          await fetch('/api/cart/clear-session', {
            method: 'POST',
            credentials: 'same-origin'
          });
        } catch (err) {
          console.error('[CartContext] Erro ao limpar sessão do servidor:', err);
        }
        
        return;
      }

      // Se o evento incluir dados completos do carrinho, use-os imediatamente
      if (event.detail?.fullCart?.items_count !== undefined) {
        const newCount = event.detail.fullCart.items_count;
        console.log('[CartContext] ✅ Contador atualizado via evento com dados completos:', newCount);
        setCartCount(newCount);
        setLastOperation({type: 'update', timestamp: Date.now(), source: 'event', success: true});
        return;
      }
      
      // Forçar atualização dos dados do carrinho
      if (cartData.refetchCart && typeof cartData.refetchCart === 'function') {
        try {
          await cartData.refetchCart();
          setLastOperation({type: 'refetch', timestamp: Date.now(), success: true});
        } catch (error) {
          console.error('[CartContext] ❌ Erro ao recarregar carrinho:', error);
          setLastOperation({type: 'refetch', timestamp: Date.now(), success: false, error: error.message});
        }
      }
      
      // Sempre buscar dados atualizados diretamente da API para maior precisão
      await fetchLatestCartData();
    };

    // Registrar função de atualização manual no objeto window para depuração
    window.forceCartUpdate = handleCartUpdate;

    // Escutar vários tipos de eventos de carrinho
    window.addEventListener('cartUpdated', handleCartUpdate);
    window.addEventListener('productAddedToCart', handleCartUpdate);
    window.addEventListener('productRemovedFromCart', handleCartUpdate);
    window.addEventListener('cartCleared', handleCartUpdate);
    window.addEventListener('minicartUpdate', handleCartUpdate);

    return () => {
      // Limpar event listeners e função de depuração
      window.removeEventListener('cartUpdated', handleCartUpdate);
      window.removeEventListener('productAddedToCart', handleCartUpdate);
      window.removeEventListener('productRemovedFromCart', handleCartUpdate);
      window.removeEventListener('cartCleared', handleCartUpdate);
      window.removeEventListener('minicartUpdate', handleCartUpdate);
      delete window.forceCartUpdate;
    };
  }, [cartData.refetchCart]);

  // Função para formatar valores monetários
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };
  // Criar valor do contexto enriquecido 
  const contextValue = {
    ...cartData,
    cartTotal: cartTotalValue || cartData.cartTotal || 0, // NOVO: Usar valor total calculado
    formattedTotal: formatCurrency(cartTotalValue || cartData.cartTotal || 0), // NOVO: Formatar o total
    subtotal: cartTotalValue || cartData.cartTotal || 0, // Novo campo para clareza
    formattedSubtotal: formatCurrency(cartTotalValue || cartData.cartTotal || 0), // Novo campo formatado
    contextReady,
    lastOperation,
    // Função utilitária para forçar atualização do contador
    updateCartCount: async () => {
      try {
        const result = await fetchLatestCartData();
        return result.success ? (result.cart?.items_count || 0) : cartCount;
      } catch (error) {
        console.error('[CartContext] ❌ Erro em updateCartCount:', error);
        return cartCount;
      }
    },
    // Método de diagnóstico para depuração
    diagnosticInfo: {
      lastOperation,
      contextReady,
      cartCount,
      cartTotal: cartTotalValue,
      formattedTotal: formatCurrency(cartTotalValue),
      hasCartData: !!cartData.cart,
      timestamp: Date.now()
    }
  };
  
  return (
    <CartContext.Provider value={contextValue}>
      {children}
    </CartContext.Provider>
  );
};

/**
 * Enhanced hook to access cart context with validation
 */
export const useCartContext = () => {
  const context = useContext(CartContext);
  const [lastLogTime, setLastLogTime] = useState(0);
  
  if (!context) {
    console.log('[CartContext] ⚠️ Contexto não inicializado, retornando valores padrão');
    // Retornar contexto padrão em vez de logar erro
    return {
      loading: true,
      error: null,
      cartItems: [],
      cartCount: 0, // NOVO: Incluir cartCount no fallback
      cartTotal: 'R$ 0,00',
      formattedTotal: 'R$ 0,00',
      contextReady: false, // NOVO: Incluir contextReady no fallback
      addToCart: () => {
        console.log('[CartContext] ⚠️ addToCart chamado mas contexto não está pronto');
        return Promise.resolve({ success: false, error: 'Context not ready' });
      },
      updateCartItem: () => {
        console.log('[CartContext] ⚠️ updateCartItem chamado mas contexto não está pronto');
        return Promise.resolve({ success: false });
      },
      removeCartItem: () => {
        console.log('[CartContext] ⚠️ removeCartItem chamado mas contexto não está pronto');
        return Promise.resolve({ success: false });
      },
      clearCart: () => {
        console.log('[CartContext] ⚠️ clearCart chamado mas contexto não está pronto');
        return Promise.resolve({ success: false });
      },
      refetchCart: () => {
        console.log('[CartContext] ⚠️ refetchCart chamado mas contexto não está pronto');
        return Promise.resolve();
      },
      updateCartCount: () => {
        console.log('[CartContext] ⚠️ updateCartCount chamado mas contexto não está pronto');
        return Promise.resolve(0);
      },
      operationInProgress: false
    };
  }
  
  // Limitar logs para reduzir duplicatas
  const now = Date.now();
  if (now - lastLogTime > 500) {
    console.log('[CartContext] ✅ Contexto acessado com sucesso:', {
      loading: context.loading,
      hasError: !!context.error,
      itemCount: context.cartItems?.length || 0,
      cartCount: context.cartCount,
      total: context.cartTotal,
      contextReady: context.contextReady,
      operationInProgress: context.operationInProgress
    });
    setLastLogTime(now);
  }
  
  return context;
};

// Hook removido - usar useCartCountV2 do novo sistema

/**
 * Convenience hook for cart summary data only
 */
export const useCartSummary = () => {
  const { cartSummary } = useCartContext();
  return cartSummary;
};

/**
 * Convenience hook for cart operations only
 */
export const useCartOperations = () => {
  const {
    addToCart,
    updateCartItem,
    removeCartItem,
    clearCart,
    refetchCart,
    syncWithServer,
    resetErrors
  } = useCartContext();
  
  return {
    addToCart,
    updateCartItem,
    removeCartItem,
    clearCart,
    refetchCart,
    syncWithServer,
    resetErrors
  };
};

export { CartContext };