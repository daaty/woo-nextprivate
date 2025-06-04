/**
 * Serviço de carrinho local
 * 
 * Este módulo gerencia o carrinho de compras localmente com opção de sincronização
 * com o WooCommerce ao finalizar a compra
 */

import axios from 'axios';
import { 
  CART_CONFIG, 
  isBrowser, 
  shouldUseLocalCart, 
  shouldSyncWithApi,
  getWooPageUrl
} from './cart-config';

/**
 * Obtém o carrinho atual do localStorage
 * @returns {Object|null} O carrinho ou null se não existir
 */
export const getLocalCart = () => {
  if (!isBrowser) return null;
  
  try {
    const cartData = localStorage.getItem(CART_CONFIG.localStorageKey);
    return cartData ? JSON.parse(cartData) : null;
  } catch (error) {
    console.error('Erro ao ler carrinho do localStorage:', error);
    return null;
  }
};

/**
 * Salva o carrinho no localStorage
 * @param {Object} cart Objeto do carrinho
 */
export const saveLocalCart = (cart) => {
  if (!isBrowser) return;
  
  try {
    localStorage.setItem(CART_CONFIG.localStorageKey, JSON.stringify(cart));
  } catch (error) {
    console.error('Erro ao salvar carrinho no localStorage:', error);
  }
};

/**
 * Cria um carrinho vazio
 * @returns {Object} Objeto de carrinho vazio
 */
export const createEmptyCart = () => {
  return {
    items: [],
    totals: {
      subtotal: 0,
      total: 0,
      discount: 0,
      shipping: 0,
      tax: 0
    },
    coupons: [],
    itemCount: 0,
    createdAt: new Date().toISOString()
  };
};

/**
 * Calcula o total do carrinho
 * @param {Array} items Itens do carrinho
 * @returns {Object} Totais calculados
 */
export const calculateTotals = (items) => {
  const subtotal = items.reduce((total, item) => {
    return total + (item.price * item.quantity);
  }, 0);
  
  // Aqui você pode adicionar lógica para impostos, frete, etc.
  // Por enquanto, estamos apenas definindo o total igual ao subtotal
  return {
    subtotal,
    total: subtotal,
    discount: 0,
    shipping: 0,
    tax: 0
  };
};

/**
 * Adiciona um produto ao carrinho local
 * 
 * @param {Object} product Produto a ser adicionado
 * @param {Number} quantity Quantidade a ser adicionada
 * @returns {Object} Carrinho atualizado
 */
export const addToLocalCart = (product, quantity = 1) => {
  // Garantir que estamos no browser
  if (!isBrowser) return null;
  
  // Obter carrinho existente ou criar um novo
  let cart = getLocalCart() || createEmptyCart();
  
  // Verificar se o produto já existe no carrinho
  const existingItemIndex = cart.items.findIndex(item => 
    item.id === product.id && 
    (product.variationId ? item.variationId === product.variationId : true)
  );
  
  if (existingItemIndex > -1) {
    // Atualizar quantidade se o item já existir
    cart.items[existingItemIndex].quantity += quantity;
  } else {
    // Adicionar novo item
    const cartItem = {
      id: product.id,
      name: product.name,
      price: product.price,
      regularPrice: product.regularPrice || product.price,
      quantity,
      image: product.images?.[0]?.src || '',
      attributes: product.attributes || [],
      variationId: product.variationId || null,
      slug: product.slug || '',
      key: `${product.id}${product.variationId ? '_' + product.variationId : ''}`
    };
    
    cart.items.push(cartItem);
  }
  
  // Recalcular totais
  cart.totals = calculateTotals(cart.items);
  cart.itemCount = cart.items.reduce((count, item) => count + item.quantity, 0);
  
  // Salvar carrinho
  saveLocalCart(cart);
  
  return cart;
};

/**
 * Remove um item do carrinho local
 * @param {String} itemKey Chave do item a ser removido
 * @returns {Object} Carrinho atualizado
 */
export const removeFromLocalCart = (itemKey) => {
  if (!isBrowser) return null;
  
  const cart = getLocalCart();
  if (!cart) return createEmptyCart();
  
  // Filtrar o item a ser removido
  cart.items = cart.items.filter(item => item.key !== itemKey);
  
  // Recalcular totais
  cart.totals = calculateTotals(cart.items);
  cart.itemCount = cart.items.reduce((count, item) => count + item.quantity, 0);
  
  // Salvar carrinho
  saveLocalCart(cart);
  
  return cart;
};

/**
 * Atualiza a quantidade de um item no carrinho
 * @param {String} itemKey Chave do item
 * @param {Number} quantity Nova quantidade
 * @returns {Object} Carrinho atualizado
 */
export const updateCartItemQuantity = (itemKey, quantity) => {
  if (!isBrowser) return null;
  
  const cart = getLocalCart();
  if (!cart) return createEmptyCart();
  
  // Encontrar o item
  const itemIndex = cart.items.findIndex(item => item.key === itemKey);
  if (itemIndex === -1) return cart;
  
  // Atualizar quantidade
  cart.items[itemIndex].quantity = quantity;
  
  // Recalcular totais
  cart.totals = calculateTotals(cart.items);
  cart.itemCount = cart.items.reduce((count, item) => count + item.quantity, 0);
  
  // Salvar carrinho
  saveLocalCart(cart);
  
  return cart;
};

/**
 * Limpa o carrinho local
 * @returns {Object} Carrinho vazio
 */
export const clearLocalCart = () => {
  if (!isBrowser) return null;
  
  const emptyCart = createEmptyCart();
  saveLocalCart(emptyCart);
  return emptyCart;
};

/**
 * Tenta sincronizar o carrinho local com o WooCommerce
 * Esta função deve ser chamada apenas na finalização
 * 
 * @returns {Promise<Object>} Resposta da API ou null em caso de erro
 */
export const syncCartWithWooCommerce = async () => {
  if (!isBrowser) return null;
  
  try {
    const localCart = getLocalCart();
    if (!localCart || localCart.items.length === 0) {
      return null;
    }
    
    // Criar uma lista de itens para enviar ao WooCommerce
    const cartItems = localCart.items.map(item => ({
      id: item.id,
      quantity: item.quantity,
      variation_id: item.variationId || undefined
    }));
    
    // Enviar cada item para o carrinho do WooCommerce
    const results = await Promise.all(cartItems.map(async (item) => {
      try {
        const response = await axios.post(CART_CONFIG.api.addToCart, item);
        return { success: true, item, response: response.data };
      } catch (error) {
        return { success: false, item, error };
      }
    }));
    
    // Se pelo menos um item foi sincronizado com sucesso, retornar o resultado
    const successResults = results.filter(r => r.success);
    if (successResults.length > 0) {
      return successResults[0].response;
    }
    
    // Se nenhum item foi sincronizado, retornar o primeiro erro
    console.error('Falha ao sincronizar carrinho:', results[0].error);
    return null;
  } catch (error) {
    console.error('Erro ao sincronizar carrinho com WooCommerce:', error);
    return null;
  }
};

/**
 * Redireciona para a página de finalização no WooCommerce
 * 
 * @returns {Promise<void>}
 */
export const redirectToCheckout = async () => {
  if (!isBrowser) return;

  try {
    // Se temos configurado para sincronizar apenas no checkout, fazer isso agora
    if (CART_CONFIG.syncOnCheckoutOnly && shouldUseLocalCart()) {
      await syncCartWithWooCommerce();
    }
    
    // Redirecionar para a página de checkout do WooCommerce
    const checkoutUrl = getWooPageUrl('checkout');
    window.location.href = checkoutUrl;
  } catch (error) {
    console.error('Erro ao redirecionar para checkout:', error);
  }
};

/**
 * Redireciona para a página de carrinho no WooCommerce
 */
export const redirectToCart = () => {
  if (!isBrowser) return;
  
  const cartUrl = getWooPageUrl('cart');
  window.location.href = cartUrl;
};

/**
 * Serviço de carrinho completo
 */
export const CartService = {
  getCart: getLocalCart,
  addToCart: addToLocalCart,
  removeItem: removeFromLocalCart,
  updateItemQuantity: updateCartItemQuantity,
  clearCart: clearLocalCart,
  syncWithWooCommerce: syncCartWithWooCommerce,
  redirectToCheckout,
  redirectToCart
};