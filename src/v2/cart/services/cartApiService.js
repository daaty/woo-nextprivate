/**
 * Serviço para comunicação com a API do carrinho
 * Usa variáveis de ambiente para as URLs
 */

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || '';

/**
 * Funções auxiliares para chamadas à API do carrinho
 */
export const cartApiService = {
  /**
   * Buscar carrinho por session ID
   */
  async getCart(sessionId) {
    try {
      const response = await fetch(`${BASE_URL}/api/v2/cart/`, {
        headers: {
          'Content-Type': 'application/json',
          'x-cart-session-id': sessionId
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch cart');
      }
      
      return await response.json();
    } catch (error) {
      console.error('[Cart API Service] Error fetching cart:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Adicionar item ao carrinho
   */
  async addToCart(sessionId, product, quantity = 1) {
    try {
      const response = await fetch(`${BASE_URL}/api/v2/cart/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-cart-session-id': sessionId
        },
        body: JSON.stringify({ product, quantity })
      });
      
      if (!response.ok) {
        throw new Error('Failed to add item to cart');
      }
      
      return await response.json();
    } catch (error) {
      console.error('[Cart API Service] Error adding item to cart:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Atualizar quantidade de item no carrinho
   */
  async updateCartItem(sessionId, itemId, quantity) {
    try {
      const response = await fetch(`${BASE_URL}/api/v2/cart/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-cart-session-id': sessionId
        },
        body: JSON.stringify({ itemId, quantity })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update cart item');
      }
      
      return await response.json();
    } catch (error) {
      console.error('[Cart API Service] Error updating cart item:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Remover item do carrinho
   */
  async removeFromCart(sessionId, itemId) {
    try {
      const response = await fetch(`${BASE_URL}/api/v2/cart/`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-cart-session-id': sessionId
        },
        body: JSON.stringify({ itemId })
      });
      
      if (!response.ok) {
        throw new Error('Failed to remove item from cart');
      }
      
      return await response.json();
    } catch (error) {
      console.error('[Cart API Service] Error removing item from cart:', error);
      return { success: false, error: error.message };
    }
  }
};
