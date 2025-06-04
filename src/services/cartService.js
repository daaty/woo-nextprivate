import axios from 'axios';
import { CART_CONFIG, isBrowser, shouldUseLocalCart } from '../utils/cart-config';

/**
 * Serviço de carrinho que implementa uma abordagem híbrida:
 * - Usa localStorage para operações locais (rápidas e sempre disponíveis)
 * - Sincroniza com a API do WooCommerce quando necessário
 */
class CartService {
  constructor() {
    this.localStorageKey = CART_CONFIG.localStorageKey;
  }

  /**
   * Obtém o carrinho atual do localStorage
   * 
   * @returns {Object} Objeto do carrinho
   */
  getLocalCart() {
    if (!isBrowser) return { items: [], totals: { total: 0, subtotal: 0, tax: 0 } };

    try {
      const savedCart = localStorage.getItem(this.localStorageKey);
      return savedCart ? JSON.parse(savedCart) : { items: [], totals: { total: 0, subtotal: 0, tax: 0 } };
    } catch (error) {
      console.error('Erro ao recuperar carrinho do localStorage:', error);
      return { items: [], totals: { total: 0, subtotal: 0, tax: 0 } };
    }
  }

  /**
   * Salva o carrinho no localStorage
   * 
   * @param {Object} cart - Objeto do carrinho
   */
  saveLocalCart(cart) {
    if (!isBrowser) return;

    try {
      localStorage.setItem(this.localStorageKey, JSON.stringify(cart));
    } catch (error) {
      console.error('Erro ao salvar carrinho no localStorage:', error);
    }
  }

  /**
   * Adiciona um item ao carrinho
   * 
   * @param {Object} product - Objeto do produto
   * @param {Number} quantity - Quantidade a adicionar
   * @returns {Promise<Object>} - Promessa com resultado da operação
   */
  async addToCart(product, quantity = 1) {
    if (!product || !product.id) {
      throw new Error('Produto inválido');
    }

    // Primeiro tenta realizar a operação remotamente via API
    try {
      const response = await axios.post(CART_CONFIG.api.addToCart, {
        id: product.id,
        quantity,
        variation_id: product.variationId || undefined
      });

      // Se for um sucesso da API do WooCommerce, retorna os dados
      if (response.data.success && response.data.mode === 'woocommerce_api') {
        return {
          success: true,
          cart: response.data.cart,
          mode: 'api'
        };
      }

      // Se chegou aqui, significa que a API falhou ou estamos em modo local
      // Vamos fazer a operação localmente
    } catch (error) {
      console.log('Falha ao adicionar ao carrinho via API, usando abordagem local', error.message);
    }

    // Abordagem local se a API falhou ou se estamos em modo local primeiro
    try {
      const cart = this.getLocalCart();
      
      // Verificar se o produto já existe no carrinho
      const existingItemIndex = cart.items.findIndex(item => 
        item.id === product.id && 
        (product.variationId ? item.variationId === product.variationId : true)
      );

      if (existingItemIndex >= 0) {
        // Atualiza quantidade se já existe
        cart.items[existingItemIndex].quantity += quantity;
      } else {
        // Adiciona novo item
        cart.items.push({
          id: product.id,
          name: product.name,
          price: product.price || 0,
          regular_price: product.regularPrice || product.regular_price || 0,
          sale_price: product.salePrice || product.sale_price || 0,
          image: product.images?.[0]?.src || '',
          quantity: quantity,
          variationId: product.variationId || null,
          attributes: product.attributes || []
        });
      }

      // Recalcula totais
      this.recalculateCart(cart);
      
      // Salva carrinho atualizado
      this.saveLocalCart(cart);

      return {
        success: true,
        cart: cart,
        mode: 'local'
      };
    } catch (error) {
      console.error('Erro ao adicionar produto ao carrinho:', error);
      throw error;
    }
  }

  /**
   * Remove um item do carrinho
   * 
   * @param {String|Number} productId - ID do produto
   * @param {String|Number} variationId - ID da variação (opcional)
   * @returns {Promise<Object>} - Promessa com resultado da operação
   */
  async removeItem(productId, variationId = null) {
    // Primeiro tenta realizar a operação remotamente
    try {
      const response = await axios.post(CART_CONFIG.api.removeItem, {
        key: productId,
        variation_id: variationId
      });

      if (response.data.success && response.data.mode === 'woocommerce_api') {
        return {
          success: true,
          cart: response.data.cart,
          mode: 'api'
        };
      }
    } catch (error) {
      console.log('Falha ao remover item do carrinho via API, usando abordagem local');
    }

    // Abordagem local
    try {
      const cart = this.getLocalCart();
      
      // Filtra o item a ser removido
      cart.items = cart.items.filter(item => 
        !(item.id === productId && 
          (variationId ? item.variationId === variationId : true))
      );

      // Recalcula totais
      this.recalculateCart(cart);
      
      // Salva carrinho atualizado
      this.saveLocalCart(cart);

      return {
        success: true,
        cart: cart,
        mode: 'local'
      };
    } catch (error) {
      console.error('Erro ao remover item do carrinho:', error);
      throw error;
    }
  }

  /**
   * Atualiza a quantidade de um item no carrinho
   * 
   * @param {String|Number} productId - ID do produto
   * @param {Number} quantity - Nova quantidade
   * @param {String|Number} variationId - ID da variação (opcional)
   * @returns {Promise<Object>} - Promessa com resultado da operação
   */
  async updateItemQuantity(productId, quantity, variationId = null) {
    if (quantity < 1) {
      return this.removeItem(productId, variationId);
    }

    // Primeiro tenta realizar a operação remotamente
    try {
      const response = await axios.post(CART_CONFIG.api.updateItem, {
        key: productId,
        quantity: quantity,
        variation_id: variationId
      });

      if (response.data.success && response.data.mode === 'woocommerce_api') {
        return {
          success: true,
          cart: response.data.cart,
          mode: 'api'
        };
      }
    } catch (error) {
      console.log('Falha ao atualizar item no carrinho via API, usando abordagem local');
    }

    // Abordagem local
    try {
      const cart = this.getLocalCart();
      
      // Encontra o item e atualiza a quantidade
      const itemToUpdate = cart.items.find(item => 
        item.id === productId && 
        (variationId ? item.variationId === variationId : true)
      );

      if (itemToUpdate) {
        itemToUpdate.quantity = quantity;
        
        // Recalcula totais
        this.recalculateCart(cart);
        
        // Salva carrinho atualizado
        this.saveLocalCart(cart);

        return {
          success: true,
          cart: cart,
          mode: 'local'
        };
      } else {
        throw new Error('Item não encontrado no carrinho');
      }
    } catch (error) {
      console.error('Erro ao atualizar quantidade do item:', error);
      throw error;
    }
  }

  /**
   * Limpa o carrinho completamente
   * 
   * @returns {Promise<Object>} - Promessa com resultado da operação
   */
  async clearCart() {
    // Limpa o carrinho local
    try {
      const emptyCart = { items: [], totals: { total: 0, subtotal: 0, tax: 0 } };
      this.saveLocalCart(emptyCart);
      
      return {
        success: true,
        cart: emptyCart,
        mode: 'local'
      };
    } catch (error) {
      console.error('Erro ao limpar carrinho:', error);
      throw error;
    }
  }

  /**
   * Recalcula os totais do carrinho
   * 
   * @param {Object} cart - Objeto do carrinho
   */
  recalculateCart(cart) {
    let subtotal = 0;
    
    cart.items.forEach(item => {
      // Se houver preço de venda, use-o, caso contrário, use o preço regular
      const itemPrice = (item.sale_price && parseFloat(item.sale_price) > 0) 
        ? parseFloat(item.sale_price) 
        : parseFloat(item.price || item.regular_price || 0);
      
      subtotal += itemPrice * item.quantity;
    });
    
    // Simulação simplificada de impostos (10%)
    const tax = subtotal * 0.10;
    
    cart.totals = {
      subtotal: subtotal,
      tax: tax,
      total: subtotal + tax
    };
    
    return cart;
  }

  /**
   * Obtém o número de itens no carrinho (quantidade total)
   * 
   * @returns {Number} - Número total de itens
   */
  getCartItemCount() {
    const cart = this.getLocalCart();
    
    return cart.items.reduce((total, item) => total + item.quantity, 0);
  }

  /**
   * Sincroniza o carrinho local com o WooCommerce
   * Útil antes do checkout
   * 
   * @returns {Promise<Object>} - Promessa com resultado da operação
   */
  async syncWithWooCommerce() {
    // Esta função seria implementada para sincronizar o carrinho local
    // com o WooCommerce antes do checkout
    
    // Para ser implementada quando necessário
    return { success: false, message: 'Não implementado' };
  }
}

export default new CartService();