import { useState, useEffect, useCallback, useReducer } from 'react';

/**
 * Redutor para gerenciar todos os estados do carrinho
 */
const cartReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_CART_ITEMS':
      return { 
        ...state, 
        cartItems: action.payload,
        cartCount: Array.isArray(action.payload) 
          ? action.payload.reduce((sum, item) => sum + (parseInt(item.qty || item.quantity) || 1), 0) 
          : 0
      };
    case 'SET_CART_TOTAL':
      return { ...state, cartTotal: action.payload };
    case 'CLEAR_CART':
      return { 
        ...state, 
        cartItems: [], 
        cartCount: 0, 
        cartTotal: 0,
        formattedTotal: 'R$ 0,00',
        // Manter loading e error como estão
      };
    case 'SET_OPERATION':
      return { ...state, operationInProgress: action.payload };
    default:
      return state;
  }
};

/**
 * Hook para gerenciar o carrinho de compras usando a API REST
 */
export const useCart = () => {
  // Estado inicial
  const initialState = {
    loading: true,
    error: null,
    cartItems: [],
    cartCount: 0,
    cartTotal: 0,
    formattedTotal: 'R$ 0,00',
    operationInProgress: false
  };

  // Use reducer para gerenciar estado
  const [state, dispatch] = useReducer(cartReducer, initialState);
  
  // Estado local para rastreamento de operações
  const [lastOp, setLastOp] = useState({
    type: null,
    timestamp: 0,
    product: null
  });

  // Formatar preço
  const formatPrice = useCallback((price) => {
    if (price === undefined || price === null) return 'R$ 0,00';
    if (typeof price === 'string') {
      // Remover formatações existentes caso seja string
      price = price.replace(/[^\d.,\-]/g, '').replace(',', '.');
    }
    const numPrice = parseFloat(price);
    return isNaN(numPrice) ? 'R$ 0,00' : `R$ ${numPrice.toFixed(2).replace('.', ',')}`;
  }, []);

  // Carregar dados do carrinho inicialmente
  useEffect(() => {
    const fetchCartData = async () => {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      try {
        const response = await fetch('/api/cart/simple-get', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin'
        });
        
        if (!response.ok) {
          throw new Error(`Network error: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success && result.cart) {
          dispatch({ type: 'SET_CART_ITEMS', payload: result.cart.items || [] });
          dispatch({ type: 'SET_CART_TOTAL', payload: result.cart.total_numeric || 0 });
          
          // Formatar total
          const formattedTotal = formatPrice(result.cart.total_numeric);
          
          return {
            cartItems: result.cart.items || [],
            cartTotal: result.cart.total_numeric,
            formattedTotal
          };
        } else {
          dispatch({ type: 'SET_CART_ITEMS', payload: [] });
          dispatch({ type: 'SET_CART_TOTAL', payload: 0 });
          return { cartItems: [], cartTotal: 0, formattedTotal: 'R$ 0,00' };
        }
      } catch (error) {
        console.error('Error fetching cart data:', error);
        dispatch({ type: 'SET_ERROR', payload: error.message });
        return { cartItems: [], cartTotal: 0, formattedTotal: 'R$ 0,00', error: error.message };
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    fetchCartData();
    
    // Event listener para limpar carrinho quando receber evento
    const handleCartCleared = () => {
      console.log('[useCart] 🗑️ Evento de limpeza de carrinho recebido, limpando estado');
      dispatch({ type: 'CLEAR_CART' });
    };
    
    window.addEventListener('cartCleared', handleCartCleared);
    return () => {
      window.removeEventListener('cartCleared', handleCartCleared);
    };
  }, [formatPrice]);

  // Recarregar dados do carrinho
  const refetchCart = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      const response = await fetch('/api/cart/simple-get', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        // Evitar cache
        cache: 'no-cache'
      });
      
      if (!response.ok) {
        throw new Error(`Network error: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success && result.cart) {
        dispatch({ type: 'SET_CART_ITEMS', payload: result.cart.items || [] });
        dispatch({ type: 'SET_CART_TOTAL', payload: result.cart.total_numeric || 0 });
        
        // Verificar se o carrinho foi limpo
        if (result.cart.wasCleared) {
          console.log('[useCart] 🧹 Carrinho foi limpo no servidor, atualizando estado');
          dispatch({ type: 'CLEAR_CART' });
        }
        
        return {
          cartItems: result.cart.items || [],
          cartTotal: result.cart.total_numeric,
          formattedTotal: formatPrice(result.cart.total_numeric)
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error refetching cart:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message });
      return null;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [formatPrice]);

  // Adicionar ao carrinho
  const addToCart = useCallback(async (productId, quantity = 1, variations = {}) => {
    dispatch({ type: 'SET_OPERATION', payload: true });
    setLastOp({ type: 'add', timestamp: Date.now(), product: productId });
    
    try {
      const response = await fetch('/api/cart/simple-add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          product_id: productId,
          quantity,
          variation_id: variations.id,
          append_to_server_storage: true // Importante: sempre acrescentar, não substituir
        })
      });
      
      if (!response.ok) {
        throw new Error(`Network error: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        // Atualizar o estado com os novos dados
        await refetchCart();
      }
      
      return result;
    } catch (error) {
      console.error('Error adding to cart:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message });
      return { success: false, error: error.message };
    } finally {
      dispatch({ type: 'SET_OPERATION', payload: false });
    }
  }, [refetchCart]);

  // Atualizar item no carrinho
  const updateCartItem = useCallback(async (cartKey, quantity) => {
    dispatch({ type: 'SET_OPERATION', payload: true });
    setLastOp({ type: 'update', timestamp: Date.now(), cartKey });

    try {
      const response = await fetch('/api/cart/update-item', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cartKey, quantity })
      });
      
      if (!response.ok) {
        throw new Error(`Network error: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        // Atualizar o estado com os novos dados
        await refetchCart();
      }
      
      return result;
    } catch (error) {
      console.error('Error updating cart item:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message });
      return { success: false, error: error.message };
    } finally {
      dispatch({ type: 'SET_OPERATION', payload: false });
    }
  }, [refetchCart]);

  // Remover item do carrinho
  const removeCartItem = useCallback(async (cartKey) => {
    dispatch({ type: 'SET_OPERATION', payload: true });
    setLastOp({ type: 'remove', timestamp: Date.now(), cartKey });

    try {
      const response = await fetch('/api/cart/remove-item', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cartKey })
      });
      
      if (!response.ok) {
        throw new Error(`Network error: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        // Atualizar o estado com os novos dados
        await refetchCart();
      }
      
      return result;
    } catch (error) {
      console.error('Error removing cart item:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message });
      return { success: false, error: error.message };
    } finally {
      dispatch({ type: 'SET_OPERATION', payload: false });
    }
  }, [refetchCart]);

  // Limpar carrinho
  const clearCart = useCallback(async () => {
    dispatch({ type: 'SET_OPERATION', payload: true });
    setLastOp({ type: 'clear', timestamp: Date.now() });

    try {
      const response = await fetch('/api/cart/clear-cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timestamp: Date.now() }) // Garantir novo request
      });
      
      if (!response.ok) {
        throw new Error(`Network error: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        // IMPORTANTE: Limpar estado local imediatamente
        dispatch({ type: 'CLEAR_CART' });
        
        // Atualizar o cache caso o servidor tenha gerado uma nova sessão
        if (result.newSessionId) {
          console.log(`[useCart] 🆕 Nova sessão de carrinho criada: ${result.newSessionId}`);
        }
        
        // Disparar evento para outros componentes saberem que o carrinho foi limpo
        window.dispatchEvent(new CustomEvent('cartCleared', { 
          detail: { timestamp: Date.now() } 
        }));
      }
      
      return result;
    } catch (error) {
      console.error('Error clearing cart:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message });
      return { success: false, error: error.message };
    } finally {
      dispatch({ type: 'SET_OPERATION', payload: false });
    }
  }, []);

  // Retornar os valores e funções do hook
  return {
    loading: state.loading,
    error: state.error,
    cartItems: state.cartItems,
    cartCount: state.cartCount,
    cartTotal: state.cartTotal,
    formattedTotal: formatPrice(state.cartTotal),
    operationInProgress: state.operationInProgress,
    addToCart,
    updateCartItem,
    removeCartItem,
    clearCart,
    refetchCart,
    lastOp
  };
};

export default useCart;
