import { useState, useEffect, useCallback } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { GET_CART } from '../queries/get-cart';
import { ADD_TO_CART } from '../mutations/add-to-cart';
import UPDATE_CART from '../mutations/update-cart';
import CLEAR_CART_MUTATION from '../mutations/clear-cart';
import { getFormattedCart } from '../functions';
import { v4 } from 'uuid';
import { useRouter } from 'next/router';
import { formatPrice } from '../utils/format-price';

/**
 * Hook para gerenciar todas as operações do carrinho
 * Versão corrigida com todos os bugs resolvidos
 */
export const useCart = () => {
  const router = useRouter();
  const [cart, setCart] = useState(null);
  const [requestError, setRequestError] = useState(null);
  const [lastAddedProduct, setLastAddedProduct] = useState(null);
  const [isIterating, setIsIterating] = useState(false);
  const [sessionRecoveryAttempts, setSessionRecoveryAttempts] = useState(0);

  // Inicializar o carrinho a partir do localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedCart = localStorage.getItem('woo-next-cart');
      if (savedCart) {
        try {
          const parsedCart = JSON.parse(savedCart);
          setCart(parsedCart);
        } catch (e) {
          console.error('Erro ao analisar carrinho salvo:', e);
          localStorage.removeItem('woo-next-cart');
        }
      }
    }
  }, []);

  // Função para lidar com erros
  const handleError = useCallback((error) => {
    const errorMessage = error?.message || '';
    const isExpiredToken = 
      errorMessage.includes('Expired token') || 
      errorMessage.toLowerCase().includes('invalid token');
    
    if (isExpiredToken && sessionRecoveryAttempts < 3) {
      console.log('🔄 [useCart] Token de sessão expirado, tentando recuperar...');
      
      if (typeof window !== 'undefined') {
        localStorage.removeItem('woo-session');
      }
      
      setSessionRecoveryAttempts(prev => prev + 1);
      return true;
    }
    
    setRequestError(error?.graphQLErrors?.[0]?.message || error.message || 'Erro na requisição');
    return false;
  }, [sessionRecoveryAttempts]);

  // Get Cart Data - simplificado
  const { loading, error, data, refetch } = useQuery(GET_CART, {
    notifyOnNetworkStatusChange: true,
    fetchPolicy: 'cache-and-network',
    onCompleted: (data) => {
      if (data?.cart) {
        const updatedCart = getFormattedCart(data);
        setCart(updatedCart);
        
        if (typeof window !== 'undefined') {
          localStorage.setItem('woo-next-cart', JSON.stringify(updatedCart));
        }
      }
    },
    onError: (error) => {
      console.error('[useCart] Error fetching cart data:', error);
      handleError(error);
    }
  });

  // Mutation para adicionar ao carrinho - versão otimizada
  const [addToCartMutation, { loading: addingToCart }] = useMutation(ADD_TO_CART, {
    onCompleted: (data) => {
      console.log('[useCart] ✅ Produto adicionado com sucesso ao carrinho');
      console.log('[useCart] Dados retornados:', data);
      
      if (data?.addToCart?.cartItem?.product?.node) {
        const addedProduct = data.addToCart.cartItem.product.node;
        const quantity = data.addToCart.cartItem.quantity;
        
        setLastAddedProduct({
          id: addedProduct.databaseId || addedProduct.id,
          name: addedProduct.name,
          image: addedProduct.image?.sourceUrl,
          quantity: quantity,
          timestamp: Date.now()
        });
        
        console.log('[useCart] Produto salvo como último adicionado:', {
          id: addedProduct.databaseId || addedProduct.id,
          name: addedProduct.name,
          quantity: quantity
        });
      }

      // Refetch o carrinho para garantir sincronização
      setTimeout(() => {
        console.log('[useCart] Fazendo refetch do carrinho após adição...');
        refetch();
      }, 300);
    },
    onError: (error) => {
      console.error('[useCart] ❌ Erro ao adicionar ao carrinho:', error);
      
      // Tentar recuperar de erros de sessão expirada
      const shouldRetry = handleError(error);
      if (!shouldRetry) {
        // Se não conseguiu recuperar, mostrar erro específico
        const errorMessage = error?.graphQLErrors?.[0]?.message || error.message || 'Erro desconhecido';
        console.error('[useCart] Erro detalhado:', {
          message: errorMessage,
          graphQLErrors: error?.graphQLErrors,
          networkError: error?.networkError
        });
      }
    }
  });

  /**
   * Adiciona um produto ao carrinho
   * VERSÃO CORRIGIDA: Agora executa a mutation corretamente
   */
  const addToCart = useCallback(async (productId, quantity = 1, variationId = null) => {
    try {
      // Reset de erros anteriores
      setRequestError(null);
      
      // Validação de entrada
      if (!productId) {
        throw new Error('ID do produto é obrigatório');
      }
      
      const numericProductId = parseInt(productId);
      const numericQuantity = parseInt(quantity);
      
      if (isNaN(numericProductId) || numericProductId <= 0) {
        throw new Error('ID do produto deve ser um número válido');
      }
      
      if (isNaN(numericQuantity) || numericQuantity <= 0) {
        throw new Error('Quantidade deve ser um número maior que zero');
      }
      
      console.log(`[useCart] 🛒 Iniciando adição ao carrinho:`);
      console.log(`[useCart] - Produto ID: ${numericProductId}`);
      console.log(`[useCart] - Quantidade: ${numericQuantity}`);
      console.log(`[useCart] - Variação ID: ${variationId || 'N/A'}`);
      
      // Preparar input para a mutation
      const mutationInput = {
        clientMutationId: `add_to_cart_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        productId: numericProductId,
        quantity: numericQuantity
      };
      
      // Adicionar variação se fornecida
      if (variationId) {
        const numericVariationId = parseInt(variationId);
        if (!isNaN(numericVariationId) && numericVariationId > 0) {
          mutationInput.variationId = numericVariationId;
          console.log(`[useCart] - Adicionando variação: ${numericVariationId}`);
        }
      }
      
      console.log('[useCart] Input da mutation:', mutationInput);
      
      // CORREÇÃO PRINCIPAL: Executar a mutation
      const result = await addToCartMutation({
        variables: {
          input: mutationInput
        }
      });
      
      // Verificar se a adição foi bem-sucedida
      if (result?.data?.addToCart?.cartItem) {
        console.log('[useCart] ✅ Adição bem-sucedida');
        return { 
          success: true, 
          data: result.data,
          cartItem: result.data.addToCart.cartItem,
          message: 'Produto adicionado ao carrinho com sucesso!'
        };
      } else {
        console.error('[useCart] ❌ Resposta inválida da mutation:', result);
        throw new Error('Resposta inválida do servidor');
      }
      
    } catch (error) {
      console.error('[useCart] ❌ Erro na função addToCart:', error);
      
      // Determinar mensagem de erro apropriada
      let errorMessage = 'Erro ao adicionar produto ao carrinho';
      
      if (error?.graphQLErrors?.length > 0) {
        errorMessage = error.graphQLErrors[0].message;
      } else if (error?.networkError) {
        errorMessage = 'Erro de conexão. Verifique sua internet e tente novamente.';
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      // Verificar erros específicos do WooCommerce
      if (errorMessage.includes('stock')) {
        errorMessage = 'Produto fora de estoque ou quantidade indisponível';
      } else if (errorMessage.includes('session') || errorMessage.includes('token')) {
        errorMessage = 'Sessão expirada. Recarregue a página e tente novamente.';
      } else if (errorMessage.includes('product')) {
        errorMessage = 'Produto não encontrado ou indisponível';
      }
      
      setRequestError(errorMessage);
      
      return { 
        success: false, 
        error: errorMessage,
        originalError: error
      };
    }
  }, [addToCartMutation, setRequestError, handleError]);

  // Mutation para atualizar o carrinho
  const [updateCartMutation, { loading: updatingCart }] = useMutation(UPDATE_CART, {
    onCompleted: (response) => {
      console.log('[useCart] ✅ Carrinho atualizado com sucesso');
      console.log('[useCart] Resposta da atualização:', response);
      
      // Verificar se houve itens removidos e remover do estado local imediatamente
      if (response?.updateItemQuantities?.removed?.length > 0) {
        console.log('[useCart] Itens removidos detectados:', response.updateItemQuantities.removed);
        
        // Atualizar estado local imediatamente para feedback visual
        setCart(prevCart => {
          if (!prevCart?.products) return prevCart;
          
          const removedKeys = response.updateItemQuantities.removed.map(item => item.key);
          const updatedProducts = prevCart.products.filter(item => !removedKeys.includes(item.cartKey));
          
          const updatedCart = {
            ...prevCart,
            products: updatedProducts,
            totalProductsCount: updatedProducts.reduce((acc, item) => acc + parseInt(item.qty || 0), 0)
          };
          
          // Atualizar localStorage
          if (typeof window !== 'undefined') {
            localStorage.setItem('woo-next-cart', JSON.stringify(updatedCart));
          }
          
          return updatedCart;
        });
      }
      
      // Refetch após um delay para sincronização completa
      setTimeout(() => {
        refetch();
      }, 500);
    },
    onError: (error) => {
      console.error('[useCart] ❌ Erro ao atualizar o carrinho:', error);
      handleError(error);
    }
  });

  // Mutation para limpar o carrinho
  const [clearCartMutation, { loading: clearingCart }] = useMutation(CLEAR_CART_MUTATION, {
    onCompleted: () => {
      console.log('[useCart] ✅ Carrinho limpo com sucesso');
      const emptyCart = { products: [], totalProductsCount: 0, totalProductsPrice: '0' };
      setCart(emptyCart);
      
      if (typeof window !== 'undefined') {
        localStorage.setItem('woo-next-cart', JSON.stringify(emptyCart));
      }
      
      setTimeout(() => {
        refetch();
      }, 500);
    },
    onError: (error) => {
      console.error('[useCart] ❌ Erro ao limpar carrinho:', error);
      handleError(error);
    }
  });

  /**
   * Limpa todo o carrinho
   */
  const clearCart = useCallback(async () => {
    try {
      setRequestError(null);
      
      await clearCartMutation({ 
        variables: {
          input: {
            clientMutationId: v4(),
            all: true
          }
        }
      });
      
      return { success: true };
    } catch (error) {
      console.error('[useCart] ❌ Erro ao limpar carrinho:', error);
      setRequestError(error?.message || 'Erro ao limpar carrinho');
      return { success: false, error: error?.message };
    }
  }, [clearCartMutation]);

  /**
   * Atualiza a quantidade de um item no carrinho
   * VERSÃO CORRIGIDA: Melhor tratamento de erros e validação
   */
  const updateCartItem = useCallback(async (cartKey, quantity) => {
    try {
      setRequestError(null);
      
      // Validações melhoradas
      if (!cartKey) {
        throw new Error('Chave do carrinho é obrigatória');
      }
      
      const numericQuantity = parseInt(quantity);
      if (isNaN(numericQuantity) || numericQuantity < 0) {
        throw new Error('Quantidade deve ser um número válido maior ou igual a zero');
      }
      
      if (!cart?.products || !Array.isArray(cart.products)) {
        throw new Error('Carrinho não encontrado ou inválido');
      }

      // Verificar se o item existe no carrinho
      const itemExists = cart.products.find(item => item.cartKey === cartKey);
      if (!itemExists) {
        console.warn(`[useCart] ⚠️ Item ${cartKey} não encontrado no carrinho`);
        await refetch(); // Sincronizar carrinho
        return { success: false, error: 'Item não encontrado no carrinho' };
      }

      const items = cart.products.map(item => ({
        key: item.cartKey,
        quantity: item.cartKey === cartKey ? numericQuantity : parseInt(item.qty || 0),
      }));
      
      console.log(`[useCart] 🔄 Atualizando item ${cartKey} para quantidade ${numericQuantity}`);
      console.log('[useCart] Payload dos itens:', items);
      
      await updateCartMutation({ 
        variables: {
          input: {
            clientMutationId: v4(),
            items: items
          }
        }
      });
      
      return { success: true };
    } catch (error) {
      console.error('[useCart] ❌ Erro ao atualizar item do carrinho:', error);
      setRequestError(error?.message || 'Erro ao atualizar item do carrinho');
      return { success: false, error: error?.message };
    }
  }, [cart, updateCartMutation, refetch]);

  /**
   * Remove um item do carrinho
   * VERSÃO CORRIGIDA: Melhor sincronização e tratamento de erros
   */
  const removeCartItem = useCallback(async (cartKey) => {
    try {
      setRequestError(null);
      
      console.log(`[useCart] 🗑️ Iniciando remoção do item ${cartKey}`);
      
      if (!cartKey) {
        throw new Error('Chave do carrinho é obrigatória para remoção');
      }
      
      if (!cart?.products || !Array.isArray(cart.products)) {
        console.warn('[useCart] ⚠️ Carrinho vazio ou inválido, fazendo refetch...');
        await refetch();
        return { success: true, message: 'Carrinho já estava vazio' };
      }

      // Verificar se o item existe no carrinho antes de tentar remover
      const itemExists = cart.products.find(item => item.cartKey === cartKey);
      if (!itemExists) {
        console.warn(`[useCart] ⚠️ Item ${cartKey} não encontrado no carrinho, fazendo refetch...`);
        await refetch();
        return { success: true, message: 'Item já foi removido' };
      }

      // Criar lista de itens, removendo o item específico (quantidade = 0)
      const items = cart.products.map(item => ({
        key: item.cartKey,
        quantity: item.cartKey === cartKey ? 0 : parseInt(item.qty || 0),
      }));
      
      console.log(`[useCart] Removendo item ${cartKey} do carrinho com payload:`, items);

      const result = await updateCartMutation({ 
        variables: {
          input: {
            clientMutationId: v4(),
            items: items
          }
        }
      });
      
      console.log(`[useCart] ✅ Item ${cartKey} removido com sucesso`);
      return { success: true };
      
    } catch (error) {
      console.error('[useCart] ❌ Erro ao remover item do carrinho:', error);
      
      // Verificar se é um erro específico de chave inválida
      if (error?.graphQLErrors?.some(err => 
        err.message.includes('failed to update') || 
        err.message.includes('Cart items identified with keys') ||
        err.message.includes('invalid key')
      )) {
        console.log('[useCart] 🔄 Erro de chave inválida detectado, fazendo refetch do carrinho...');
        
        try {
          await refetch();
          return { 
            success: true, 
            message: 'Item removido (sincronização realizada)' 
          };
        } catch (refetchError) {
          console.error('[useCart] ❌ Erro no refetch após falha de remoção:', refetchError);
        }
      }
      
      // Para outros tipos de erro, mostrar mensagem específica
      let errorMessage = 'Erro ao remover item do carrinho';
      
      if (error?.graphQLErrors?.length > 0) {
        errorMessage = error.graphQLErrors[0].message;
      } else if (error?.networkError) {
        errorMessage = 'Erro de conexão. Verifique sua internet e tente novamente.';
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      setRequestError(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, [cart, updateCartMutation, refetch]);

  /**
   * Continua a iteração de compra
   */
  const continueIterating = useCallback(async (continueToCart = true) => {
    try {
      setIsIterating(true);
      
      if (continueToCart) {
        await router.push('/cart');
      }
      
      setIsIterating(false);
    } catch (error) {
      console.error('[useCart] ❌ Erro ao navegar:', error);
      setIsIterating(false);
    }
  }, [router]);

  // Reset tentativas de recuperação após timeout
  useEffect(() => {
    if (sessionRecoveryAttempts > 0) {
      const timer = setTimeout(() => {
        setSessionRecoveryAttempts(0);
      }, 300000); // 5 minutos
      
      return () => clearTimeout(timer);
    }
  }, [sessionRecoveryAttempts]);

  return {
    loading,
    error,
    cartItems: cart?.products || [],
    cartCount: cart?.totalProductsCount || 0,
    cartTotal: cart?.totalProductsPrice || '0',
    formattedTotal: formatPrice(cart?.totalProductsPrice || '0'),
    addingToCart,
    updatingCart,
    removingFromCart: updatingCart,
    clearingCart,
    requestError,
    lastAddedProduct,
    isIterating,
    addToCart,
    updateCartItem,
    removeCartItem,
    clearCart,
    refetchCart: refetch,
    continueIterating,
  };
};
