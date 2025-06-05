/**
 * Cart v2 Hook Adapter
 * Adapta o hook useCart do Cart v2 para manter compatibilidade com a página cart.js existente
 * Mantém a mesma interface do hook v1, mas usa a lógica v2 por baixo
 */

import { useCart as useCartV2 } from '../v2/cart/hooks/useCart';
import { useCart as useCartV1 } from './useCart';

// Default image placeholder (copied from cart.js for consistency)
const DEFAULT_PLACEHOLDER = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiNGRjY5MDAiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0id2hpdGUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxOCI+UHJvZHV0bzwvdGV4dD48L3N2Zz4=';

/**
 * Hook adaptador que decide qual versão usar baseado nas feature flags
 * Mantém a mesma interface para não quebrar a página existente
 */
export const useCartWithFallback = () => {
  // Feature flags
  const cartV2Enabled = process.env.NEXT_PUBLIC_CART_V2_ENABLED === 'true';
  const cartV2API = process.env.NEXT_PUBLIC_CART_V2_API === 'true';
  const cartV2Percentage = parseInt(process.env.NEXT_PUBLIC_CART_V2_PERCENTAGE || '0');
  
  // Debug logs for feature flags
  console.log('[Cart Hook] Feature Flags Debug:', {
    NEXT_PUBLIC_CART_V2_ENABLED: process.env.NEXT_PUBLIC_CART_V2_ENABLED,
    NEXT_PUBLIC_CART_V2_API: process.env.NEXT_PUBLIC_CART_V2_API,
    NEXT_PUBLIC_CART_V2_PERCENTAGE: process.env.NEXT_PUBLIC_CART_V2_PERCENTAGE,
    cartV2Enabled,
    cartV2API,
    cartV2Percentage
  });
  
  // Decidir qual versão usar
  const shouldUseCartV2 = cartV2Enabled && cartV2API && cartV2Percentage >= 100;
  
  console.log('[Cart Hook] Decision Logic:', {
    shouldUseCartV2,
    conditions: {
      cartV2Enabled,
      cartV2API,
      cartV2Percentage_gte_100: cartV2Percentage >= 100
    }
  });  // Usar Cart v2
  if (shouldUseCartV2) {
    console.log('[Cart Hook] Using Cart v2 🚀');
    const cartV2 = useCartV2();
    
    // Adaptar interface do v2 para compatibilidade com v1
    // Adaptar formato dos itens para compatibilidade com a estrutura esperada na página cart.js
    const adaptedCartItems = (cartV2.cartItems || []).map(item => {
      // Debug: Log original item data
      console.log('[Cart Hook] Adapting item:', {
        name: item.name,
        price: item.price,
        rawPrice: item.rawPrice,
        priceType: typeof item.price
      });
      
      // Parse price to number for calculations
      let numericPrice = 0;
      if (item.rawPrice && typeof item.rawPrice === 'number') {
        numericPrice = item.rawPrice;
      } else if (item.price) {
        // Parse the formatted price string "R$ 2.199,00"
        const priceString = item.price.toString();
        numericPrice = parseFloat(
          priceString
            .replace(/R\$\s*/g, '') // Remove R$ with optional space
            .replace(/\./g, '') // Remove thousands separator (dots)
            .replace(',', '.') // Convert decimal separator (comma to dot)
            .trim()
        ) || 0;
      }
      
      console.log('[Cart Hook] Parsed numeric price:', numericPrice);
      
      // Converter o formato dos itens de Cart v2 para o formato esperado pelo Cart v1
      return {
        cartKey: item.id || item.productId, // Usar id como cartKey
        productId: item.productId,
        name: item.name,
        price: numericPrice, // Use numeric price for compatibility
        qty: item.quantity,         // Cart v1 usa qty, Cart v2 usa quantity
        quantity: item.quantity,    // Manter ambos para compatibilidade
        
        // Calcular preço total baseado no preço numérico
        totalPrice: new Intl.NumberFormat('pt-BR', { 
          style: 'currency', 
          currency: 'BRL' 
        }).format(numericPrice * item.quantity),
        
        // Formatar também o preço unitário
        formattedPrice: new Intl.NumberFormat('pt-BR', { 
          style: 'currency', 
          currency: 'BRL' 
        }).format(numericPrice),
        
        // Adaptar formato da imagem para compatibilidade com a página cart.js
        // Em v1: item.image = { sourceUrl: "url" }
        // Em v2: item.image = "url" ou null
        image: {
          sourceUrl: typeof item.image === 'string'
            ? item.image
            : (item.image?.sourceUrl || DEFAULT_PLACEHOLDER)
        }
      };
    });
      console.log('[Cart Hook] Adapted cart items:', adaptedCartItems);
    
    // Calcular total manualmente baseado nos itens adaptados
    const calculatedTotal = adaptedCartItems.reduce((total, item) => {
      const itemPrice = item.price || 0;
      const itemQty = item.qty || 0;
      const itemTotal = itemPrice * itemQty;
      console.log(`[Cart Hook] Item: ${item.name}, Price: ${itemPrice}, Qty: ${itemQty}, Total: ${itemTotal}`);
      return total + itemTotal;
    }, 0);
    
    console.log('[Cart Hook] Manual calculated total:', calculatedTotal);
    console.log('[Cart Hook] CartV2 total:', cartV2.cartTotal);
    
    // Usar o total calculado se o cartV2.cartTotal for inválido
    const finalTotal = (cartV2.cartTotal && !isNaN(cartV2.cartTotal)) ? cartV2.cartTotal : calculatedTotal;
    
    console.log('[Cart Hook] Final total to use:', finalTotal);
    
    // Formatar valores monetários consistentemente
    const formatBRLCurrency = (value) => {
      const numValue = typeof value === 'number' && !isNaN(value) ? value : 0;
      return new Intl.NumberFormat('pt-BR', { 
        style: 'currency', 
        currency: 'BRL' 
      }).format(numValue);
    };
    // Defensive fallback: always return valid values
    const safeCartTotal = (typeof cartV2.cartTotal === 'number' && !isNaN(cartV2.cartTotal))
      ? cartV2.cartTotal
      : (typeof cartV2.cartTotal === 'string' && cartV2.cartTotal !== '' ? cartV2.cartTotal : 0);
    return {
      // Estados básicos - usando os valores calculados do contexto
      loading: !!cartV2.loading,
      error: cartV2.error,
      cartItems: adaptedCartItems || [], // Itens adaptados para formato v1
      cartTotal: safeCartTotal, // Já mapeado no contexto
      formattedTotal: formatBRLCurrency(safeCartTotal),
      subtotal: safeCartTotal, // Em Cart v2, subtotal = total (sem taxas adicionais)
      formattedSubtotal: formatBRLCurrency(safeCartTotal),
      
      // Funções de manipulação (adaptadas)
      updateCartItem: (key, quantity, productName = '') => {
        console.log('[Cart Hook v2] Updating item:', { key, quantity, productName });
        // O cartKey em v1 equivale ao productId em v2
        const productId = key;
        return cartV2.updateCartItem(productId, quantity)
          .then(result => {
            // Formatar resposta para manter compatibilidade com cart.js
            return {
              success: result.success || true,
              message: `Quantidade de ${productName || 'produto'} atualizada com sucesso!`
            };
          })
          .catch(error => {
            console.error('[Cart Hook v2] Error updating item:', error);
            return {
              success: false,
              error: error.message || 'Falha ao atualizar produto'
            };
          });
      },
      
      removeCartItem: (key, productName = '') => {
        console.log('[Cart Hook v2] Removing item:', { key, productName });
        // O cartKey em v1 equivale ao productId em v2
        const productId = key;
        return cartV2.removeCartItem(productId)
          .then(result => {
            // Formatar resposta para manter compatibilidade com cart.js
            return {
              success: result.success || true,
              message: `${productName || 'Produto'} removido com sucesso!`
            };
          })
          .catch(error => {
            console.error('[Cart Hook v2] Error removing item:', error);
            return {
              success: false,
              error: error.message || 'Falha ao remover produto'
            };
          });
      },      clearCart: () => {
        console.log('[Cart Hook v2] Clearing cart');
        return cartV2.clearCart()
          .then(result => {
            // Formatar resposta para manter compatibilidade com cart.js
            return {
              success: result.success || true,
              message: 'Carrinho esvaziado com sucesso!'
            };
          })
          .catch(error => {
            console.error('[Cart Hook v2] Error clearing cart:', error);
            return {
              success: false,
              error: error.message || 'Falha ao limpar carrinho'
            };
          });
      },
      
      // Estados adicionais - adaptar para v2
      operationInProgress: cartV2.loading,
      contextReady: !cartV2.loading,
      refetchCart: cartV2.refreshCart,
        // Informações extras do v2
      itemCount: cartV2.cartCount,
      sessionId: 'cart_v2_session', // Will be available from context after next improvement
      
      // Flag para indicar que está usando v2
      _isV2: true,
      _version: 'v2'
    };
  }
  
  // Fallback para Cart v1
  console.log('[Cart Hook] Using Cart v1 (fallback)');
  const cartV1 = useCartV1();
  
  return {
    ...cartV1,
    _isV2: false,
    _version: 'v1'
  };
};

export default useCartWithFallback;
