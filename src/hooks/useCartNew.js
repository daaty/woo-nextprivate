/**
 * HOOK CUSTOMIZADO SIMPLIFICADO PARA O NOVO SISTEMA DE CARRINHO
 * Substitui o useCart.js complexo anterior
 */
import { useNewCart } from '../contexts/NewCartContext'

/**
 * Hook principal do carrinho - Versão Simplificada
 * @returns {Object} Todas as funcionalidades do carrinho
 */
export const useCartNew = () => {
  const cartContext = useNewCart()
  
  // Já retorna todo o contexto que foi simplificado
  return cartContext
}

/**
 * Hook para operações básicas do carrinho
 * @returns {Object} Apenas as operações principais
 */
export const useCartActions = () => {
  const { addItem, removeItem, updateQuantity, clearCart, clearError } = useNewCart()
  
  return {
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    clearError
  }
}

/**
 * Hook para estado do carrinho
 * @returns {Object} Apenas o estado atual
 */
export const useCartState = () => {
  const { 
    items, 
    itemCount, 
    subtotal, 
    total, 
    isLoading, 
    error, 
    isEmpty, 
    hasItems 
  } = useNewCart()
  
  return {
    items,
    itemCount,
    subtotal,
    total,
    isLoading,
    error,
    isEmpty,
    hasItems
  }
}

/**
 * Hook para verificar se um produto específico está no carrinho
 * @param {number} productId - ID do produto
 * @returns {Object} Informações sobre o produto no carrinho
 */
export const useProductInCart = (productId) => {
  const { items } = useNewCart()
  
  const productInCart = items.find(item => item.productId === parseInt(productId))
  
  return {
    isInCart: !!productInCart,
    quantity: productInCart?.quantity || 0,
    cartItem: productInCart || null
  }
}

/**
 * Hook para calcular informações de checkout
 * @returns {Object} Informações necessárias para checkout
 */
export const useCheckoutInfo = () => {
  const { items, itemCount, subtotal, total, isEmpty } = useNewCart()
  
  return {
    items,
    itemCount,
    subtotal,
    total,
    isEmpty,
    isReadyForCheckout: !isEmpty && itemCount > 0,
    checkoutData: {
      line_items: items.map(item => ({
        product_id: item.productId,
        quantity: item.quantity
      }))
    }
  }
}

// Export default para compatibilidade
export default useCartNew
