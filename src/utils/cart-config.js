/**
 * Configurações do carrinho de compras
 * 
 * Este arquivo define as configurações de comportamento do carrinho
 * e pode ser ajustado conforme necessário.
 */

// Verificar se estamos no navegador ou no servidor
export const isBrowser = typeof window !== 'undefined';

// URL base do WordPress
export const WORDPRESS_URL = process.env.NEXT_PUBLIC_WORDPRESS_URL || 'https://rota.rotadoscelulares.com';

// ID das páginas do WooCommerce
export const WOO_PAGES = {
  cart: 8,         // ID da página do carrinho 
  checkout: 9,     // ID da página de checkout
  myAccount: 10    // ID da página minha conta
};

// Configurações do carrinho
export const CART_CONFIG = {
  // Chave usada para armazenar o carrinho no localStorage
  localStorageKey: 'wc_next_cart',
  
  // Definir se deve usar o carrinho local ou sempre tentar o WooCommerce
  useLocalCartFirst: true,  // true = primeiro tenta usar localStorage, false = sempre tenta WooCommerce
  
  // Definir se deve sincronizar com WooCommerce apenas no checkout
  syncOnCheckoutOnly: true,
  
  // Endpoints da API
  api: {
    addToCart: '/api/cart/add-to-cart',
    getCart: '/api/cart/get-cart',
    updateItem: '/api/cart/update-item',
    removeItem: '/api/cart/remove-item',
    applyCoupon: '/api/cart/apply-coupon',
    removeCoupon: '/api/cart/remove-coupon'
  }
};

/**
 * Verifica se deve usar o carrinho local primeiro
 * @returns {boolean}
 */
export function shouldUseLocalCart() {
  return CART_CONFIG.useLocalCartFirst;
}

/**
 * Verifica se deve sincronizar com o WooCommerce apenas no checkout
 * @returns {boolean}
 */
export function shouldSyncWithApi() {
  return !CART_CONFIG.syncOnCheckoutOnly;
}

/**
 * Obtém a URL de uma página do WooCommerce específica
 * 
 * @param {string} page - Nome da página (cart, checkout, myAccount)
 * @returns {string} URL completa da página
 */
export function getWooPageUrl(page) {
  const pageId = WOO_PAGES[page];
  if (!pageId) {
    console.warn(`ID da página "${page}" não configurado`);
    return WORDPRESS_URL;
  }
  
  return `${WORDPRESS_URL}/?page_id=${pageId}`;
}