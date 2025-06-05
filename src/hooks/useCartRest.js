import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/router';
import { formatPrice } from '../utils/format-price';
import { useNotification } from '../components/ui/Notification';

/**
 * Hook de carrinho usando APENAS API REST - MUITO MAIS RÁPIDO
 * SEM GraphQL, SEM Apollo, SEM complicações
 * VERSÃO SIMPLIFICADA que funciona 100%
 */
export const useCartRest = () => {
  const router = useRouter();
  const { notification } = useNotification();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [operationInProgress, setOperationInProgress] = useState(false);
  const [lastAddedProduct, setLastAddedProduct] = useState(null);
  const isMountedRef = useRef(true);
  // API REST base URL - usando API Cart v2
  const API_BASE = '/api/v2/cart';
  // Buscar carrinho via REST - VERSÃO SIMPLIFICADA
  const fetchCart = useCallback(async () => {
    if (!isMountedRef.current) return;
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('[useCartRest] 🔄 Buscando carrinho via API REST v2...');
      
      const response = await fetch(API_BASE, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.success && isMountedRef.current) {
        console.log('[useCartRest] ✅ Carrinho carregado:', data.cart);
        setCart(data.cart);
        
        // Salvar no localStorage para cache
        localStorage.setItem('woo-cart-cache', JSON.stringify({
          cart: data.cart,
          timestamp: Date.now()
        }));
      } else if (isMountedRef.current) {
        // CORRIGIDO: Mesmo se não houver sucesso, definir carrinho vazio
        console.log('[useCartRest] ⚠️ API retornou sem sucesso, definindo carrinho vazio');
        setCart({
          items: [],
          items_count: 0,
          total: 'R$ 0,00',
          total_numeric: 0
        });
      }
      
    } catch (err) {
      console.error('[useCartRest] ❌ Erro ao buscar carrinho:', err);
      setError(err.message);
      
      if (isMountedRef.current) {
        // Tentar carregar do cache em caso de erro
        try {
          const cached = localStorage.getItem('woo-cart-cache');
          if (cached) {
            const { cart: cachedCart, timestamp } = JSON.parse(cached);
            // Usar cache se for recente (menos de 5 minutos)
            if (Date.now() - timestamp < 300000) {
              setCart(cachedCart);
              console.log('[useCartRest] 📦 Usando carrinho do cache');
            } else {
              // Cache expirado, definir carrinho vazio
              setCart({
                items: [],
                items_count: 0,
                total: 'R$ 0,00',
                total_numeric: 0
              });
            }
          } else {
            // Sem cache, definir carrinho vazio
            setCart({
              items: [],
              items_count: 0,
              total: 'R$ 0,00',
              total_numeric: 0
            });
          }
        } catch (cacheErr) {
          console.warn('[useCartRest] ⚠️ Erro ao carregar cache, definindo carrinho vazio:', cacheErr);
          setCart({
            items: [],
            items_count: 0,
            total: 'R$ 0,00',
            total_numeric: 0
          });
        }
      }
    } finally {
      // CRÍTICO: Sempre definir loading como false no final
      if (isMountedRef.current) {
        setLoading(false);
        console.log('[useCartRest] ✅ Loading finalizado');
      }
    }
  }, []);

  // Adicionar produto ao carrinho via REST
  const addToCart = useCallback(async (productId, quantity = 1, variationId = null) => {
    if (!isMountedRef.current) return { success: false, error: 'Component unmounted' };
    
    setOperationInProgress(true);
    setError(null);
    
    try {
      console.log('[useCartRest] 🛒 Adicionando produto via API REST:', { productId, quantity, variationId });
      
      const payload = {
        product_id: parseInt(productId),
        quantity: parseInt(quantity)
      };
      
      if (variationId) {
        payload.variation_id = parseInt(variationId);
      }
        // Usar a API Cart v2
      // Adaptar os nomes dos campos para o formato da API v2
      const v2Payload = {
        productId: payload.product_id,
        quantity: payload.quantity,
        name: payload.product_name,
        price: payload.product_price,
        image: payload.product_image,
        variationId: payload.variation_id
      };
      
      const response = await fetch(API_BASE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        credentials: 'include',
        body: JSON.stringify(v2Payload)
      });
      
      const data = await response.json();
      
      console.log('[useCartRest] ✅ Resposta da API Cart v2:', {
        success: data.success,
        items: data.data?.length || 0,
        total: data.meta?.total || 0
      });

      if (data.data) {
        console.log('[useCartRest] 📦 DADOS DO PRODUTO RETORNADOS PELA API:');
        console.log('  Product ID:', data.data.product_id);
        console.log('  Quantity:', data.data.quantity);
        console.log('  Product Name:', data.data.product_name);
        console.log('  Product Price:', data.data.product_price, typeof data.data.product_price);
        console.log('  Product Image:', data.data.product_image?.substring(0, 100) + '...');
        console.log('  Has Real Image:', !data.data.product_image?.includes('data:image/svg+xml'));
        console.log('  Cart Item Key:', data.data.cart_item_key);
        
        if (data.data.cart) {
          console.log('  📊 ESTADO DO CARRINHO APÓS ADIÇÃO:');
          console.log('    Total Items:', data.data.cart.items_count);
          console.log('    Total Value:', data.data.cart.total);
          console.log('    Items no carrinho:', data.data.cart.items?.length);
          
          if (data.data.cart.items?.length > 0) {
            console.log('    📋 DETALHES DOS ITENS NO CARRINHO:');
            data.data.cart.items.forEach((item, index) => {
              console.log(`      Item ${index + 1}:`, {
                name: item.name,
                price: item.price,
                quantity: item.quantity,
                total: item.totalPrice,
                image_preview: item.image?.sourceUrl?.substring(0, 50) + '...',
                has_real_image: !item.image?.sourceUrl?.includes('data:image/svg+xml')
              });
            });
          }
        }
      }

      // Usar os dados REAIS retornados pela API
      const productName = data.data?.product_name || `Produto ${productId}`;
      const productImage = data.data?.product_image;
      const productPrice = data.data?.product_price;
      
      console.log('[useCartRest] 📦 DADOS FINAIS PARA FEEDBACK:', {
        name: productName,
        image_preview: productImage?.substring(0, 50) + '...',
        price: productPrice,
        has_real_data: !productImage?.includes('data:image/svg+xml')
      });
      
      // Definir produto adicionado para feedback visual
      setLastAddedProduct({
        id: parseInt(productId),
        name: productName,
        quantity: parseInt(quantity),
        timestamp: Date.now(),
        image: productImage,
        price: productPrice
      });
        // Atualizar carrinho imediatamente com dados retornados da API
      if (data.data?.cart) {
        console.log('[useCartRest] 🔄 Atualizando carrinho com dados da API');
        setCart(data.data.cart);
        
        // Atualizar cache
        localStorage.setItem('woo-cart-cache', JSON.stringify({
          cart: data.data.cart,
          timestamp: Date.now()
        }));
        
        // NOVO: Disparar evento para notificar CartContext
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('cartUpdated', {
            detail: { type: 'add', timestamp: Date.now() }
          }));
        }
      } else {
        // Fallback: refetch se não retornou dados do carrinho
        console.log('[useCartRest] 🔄 Fazendo refetch do carrinho...');
        await fetchCart();
        
        // Disparar evento mesmo com refetch
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('cartUpdated', {
            detail: { type: 'add', timestamp: Date.now() }
          }));
        }
      }
      
      // Usar mensagem personalizada com nome do produto
      const successMessage = data.message || `${productName} adicionado ao carrinho!`;
      notification.success(successMessage);
      
      return { 
        success: true, 
        message: successMessage,
        responseTime: data.responseTime,
        productName
      };
    } catch (err) {
      console.error('[useCartRest] ❌ Erro ao adicionar produto:', err);
      setError(err.message);
      notification.error(err.message || 'Erro ao adicionar produto ao carrinho');
      
      return { success: false, error: err.message };
    } finally {
      setOperationInProgress(false);
    }
  }, [fetchCart, notification]);

  // Atualizar quantidade via REST
  const updateCartItem = useCallback(async (cartKey, quantity) => {
    if (!isMountedRef.current) return { success: false, error: 'Component unmounted' };
    
    setOperationInProgress(true);
    setError(null);
    
    try {
      console.log('[useCartRest] 🔄 Atualizando item via API REST:', { cartKey, quantity });
      
      const response = await fetch(`${API_BASE}/simple-update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        credentials: 'include',
        body: JSON.stringify({
          cart_key: cartKey,
          quantity: parseInt(quantity)
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        console.log('[useCartRest] ✅ Item atualizado com sucesso');
          // Atualizar carrinho com dados retornados
        if (data.data) {
          setCart(data.data);
          
          // Atualizar cache
          localStorage.setItem('woo-cart-cache', JSON.stringify({
            cart: data.data,
            timestamp: Date.now()
          }));
        } else {
          await fetchCart();
        }
        
        // NOVO: Disparar evento para notificar CartContext
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('cartUpdated', {
            detail: { type: 'update', timestamp: Date.now() }
          }));
        }
        
        notification.success(data.message || 'Quantidade atualizada!');
        
        return { success: true, message: data.message };
      } else {
        throw new Error(data.message || 'Erro ao atualizar item');
      }
      
    } catch (err) {
      console.error('[useCartRest] ❌ Erro ao atualizar item:', err);
      setError(err.message);
      notification.error(err.message || 'Erro ao atualizar quantidade');
      
      return { success: false, error: err.message };
    } finally {
      setOperationInProgress(false);
    }
  }, [fetchCart, notification]);

  // Remover item via REST
  const removeCartItem = useCallback(async (cartKey) => {
    if (!isMountedRef.current) return { success: false, error: 'Component unmounted' };
    
    setOperationInProgress(true);
    setError(null);
    
    try {
      console.log('[useCartRest] 🗑️ Removendo item via API REST:', cartKey);
      
      const response = await fetch(`${API_BASE}/simple-remove`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        credentials: 'include',
        body: JSON.stringify({
          cart_key: cartKey
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        console.log('[useCartRest] ✅ Item removido com sucesso');
          // Atualizar carrinho com dados retornados
        if (data.data) {
          setCart(data.data);
          
          // Atualizar cache
          localStorage.setItem('woo-cart-cache', JSON.stringify({
            cart: data.data,
            timestamp: Date.now()
          }));
        } else {
          await fetchCart();
        }
        
        // NOVO: Disparar evento para notificar CartContext
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('cartUpdated', {
            detail: { type: 'remove', timestamp: Date.now() }
          }));
        }
        
        notification.success(data.message || 'Item removido do carrinho!');
        
        return { success: true, message: data.message };
      } else {
        throw new Error(data.message || 'Erro ao remover item');
      }
      
    } catch (err) {
      console.error('[useCartRest] ❌ Erro ao remover item:', err);
      setError(err.message);
      notification.error(err.message || 'Erro ao remover item');
      
      return { success: false, error: err.message };
    } finally {
      setOperationInProgress(false);
    }
  }, [fetchCart, notification]);

  // Limpar carrinho via REST
  const clearCart = useCallback(async () => {
    if (!isMountedRef.current) return { success: false, error: 'Component unmounted' };
    
    setOperationInProgress(true);
    setError(null);
    
    try {
      console.log('[useCartRest] 🧹 Limpando carrinho via API REST');
      
      const response = await fetch(`${API_BASE}/simple-clear`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        credentials: 'include'
      });
      
      const data = await response.json();
        if (data.success) {
        console.log('[useCartRest] ✅ Carrinho limpo com sucesso');
        
        // CORRIGIDO: Definir carrinho vazio em vez de null
        const emptyCart = data.data || {
          items: [],
          items_count: 0,
          total: 'R$ 0,00',
          total_numeric: 0,
          subtotal: 'R$ 0,00',
          shipping: 'R$ 0,00',
          taxes: 'R$ 0,00'
        };
        
        setCart(emptyCart);
        localStorage.removeItem('woo-cart-cache');
          // NOVO: Disparar evento para sincronizar componentes  
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('cartUpdated', {
            detail: { type: 'clear', timestamp: Date.now() }
          }));
        }
        
        notification.success(data.message || 'Carrinho limpo!');
        
        return { success: true, message: data.message };
      }else {
        throw new Error(data.message || 'Erro ao limpar carrinho');
      }
      
    } catch (err) {
      console.error('[useCartRest] ❌ Erro ao limpar carrinho:', err);
      setError(err.message);
      notification.error(err.message || 'Erro ao limpar carrinho');
      
      return { success: false, error: err.message };
    } finally {
      setOperationInProgress(false);
    }
  }, [notification]);

  // Carregar carrinho na inicialização
  useEffect(() => {
    fetchCart();
    
    return () => {
      isMountedRef.current = false;
    };
  }, [fetchCart]);

  // Cálculos derivados
  const cartItems = cart?.items || [];
  const cartCount = cart?.items_count || 0;
  const cartTotal = cart?.total || 'R$ 0,00';
  const formattedTotal = formatPrice(cart?.total_numeric || 0);

  return {
    // Estados
    loading,
    error,
    operationInProgress,
    
    // Dados do carrinho
    cart,
    cartItems,
    cartCount,
    cartTotal,
    formattedTotal,
    lastAddedProduct,
    
    // Ações
    addToCart,
    updateCartItem,
    removeCartItem,
    clearCart,
    refetchCart: fetchCart,
    
    // Estados de loading específicos (compatibilidade)
    addingToCart: operationInProgress,
    updatingCart: operationInProgress,
    removingFromCart: operationInProgress,
    clearingCart: operationInProgress
  };
};
