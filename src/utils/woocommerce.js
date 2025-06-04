/**
 * Utilidade para interagir com a API do WooCommerce
 */

import WooCommerceRestApi from "@woocommerce/woocommerce-rest-api";
import axios from 'axios';

// Instância única do Axios com configuração para preservar cookies
const axiosInstance = axios.create({
  withCredentials: true,
});

// Criar instância do axios para as chamadas da API
const axiosApiInstance = axios.create({
  timeout: 30000, // 30 segundos de timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar logs de debug
axiosApiInstance.interceptors.request.use(
  (config) => {
    console.log(`[WooCommerce API] ${config.method?.toUpperCase()} ${config.url}`, config.data);
    return config;
  },
  (error) => {
    console.error('[WooCommerce API] Request error:', error);
    return Promise.reject(error);
  }
);

axiosApiInstance.interceptors.response.use(
  (response) => {
    console.log(`[WooCommerce API] Response from ${response.config.url}:`, response.status);
    return response;
  },
  (error) => {
    console.error('[WooCommerce API] Response error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

/**
 * Cria e retorna uma instância da API do WooCommerce
 */
export const WooCommerceApi = () => {
  return new WooCommerceRestApi({
    url: process.env.NEXT_PUBLIC_WORDPRESS_URL || "https://seu-site-wordpress.com",
    consumerKey: process.env.WOO_CONSUMER_KEY || "",
    consumerSecret: process.env.WOO_CONSUMER_SECRET || "",
    version: "wc/v3"
  });
};

/**
 * Função para manipular dados do carrinho com o WooCommerce Store API
 * Versão atualizada para usar as APIs locais do Next.js para evitar problemas de CORS
 * e preservar cookies entre requisições
 */
export const WooCommerceStoreApi = {
  /**
   * Adiciona um item ao carrinho
   * 
   * @param {Object} data - Dados do produto
   */
  addToCart: async (data) => {
    try {
      // Usar a API local do Next.js como proxy
      const url = `/api/cart/simple-add`;
      const headers = {
        'Content-Type': 'application/json',
      };
      
      console.log('Adicionando ao carrinho via API local:', data);
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
        credentials: 'same-origin'
      });
      
      const responseData = await response.json();
      console.log('Resposta completa da adição ao carrinho:', responseData);
      
      // Disparar evento para atualizar o minicart e outros componentes
      if (responseData.success && typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('cartUpdated', { 
          detail: { 
            fullCart: responseData.cart,
            timestamp: Date.now(),
          } 
        }));
      }
      
      return responseData;
    } catch (error) {
      console.error('Erro ao adicionar item ao carrinho:', error);
      throw error;
    }
  },
  
  /**
   * Obtém o conteúdo atual do carrinho
   * 
   * @param {number} timestamp - Timestamp para evitar cache (opcional)
   */
  getCart: async (timestamp) => {
    try {
      // Usar a API local do Next.js como proxy
      let url = `/api/cart/simple-get`;
      
      // Adicionar timestamp para evitar cache do navegador
      if (timestamp) {
        url += `?_t=${timestamp}`;
      } else {
        url += `?_t=${Date.now()}`;
      }
      
      console.log(`Obtendo carrinho de ${url}`);
      const response = await fetch(url, { 
        credentials: 'same-origin',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
      });
      
      const responseData = await response.json();
      console.log('Resposta da API do carrinho:', responseData);
      return responseData;
    } catch (error) {
      console.error('Erro ao obter carrinho:', error);
      throw error;
    }
  },
  
  /**
   * Remove um item do carrinho
   * 
   * @param {string} cartItemKey - Chave do item no carrinho
   */
  removeCartItem: async (cartItemKey) => {
    try {
      // Usar a API local do Next.js como proxy
      const url = `/api/cart/remove-item?key=${cartItemKey}`;
      const response = await axiosInstance.delete(url);
      return response.data;
    } catch (error) {
      console.error('Erro ao remover item do carrinho:', error);
      throw error;
    }
  },
  
  /**
   * Atualiza a quantidade de um item no carrinho
   * 
   * @param {string} cartItemKey - Chave do item no carrinho
   * @param {number} quantity - Nova quantidade
   */
  updateCartItem: async (cartItemKey, quantity) => {
    try {
      // Usar a API local do Next.js como proxy
      const url = `/api/cart/update-item`;
      const data = { key: cartItemKey, quantity };
      const response = await axiosInstance.put(url, data);
      return response.data;
    } catch (error) {
      console.error('Erro ao atualizar item do carrinho:', error);
      throw error;
    }
  },
  
  /**
   * Aplica um cupom de desconto ao carrinho
   * 
   * @param {string} couponCode - Código do cupom
   */
  applyCoupon: async (couponCode) => {
    try {
      const url = `/api/cart/apply-coupon`;
      const data = { code: couponCode };
      const response = await axiosInstance.post(url, data);
      return response.data;
    } catch (error) {
      console.error('Erro ao aplicar cupom:', error);
      throw error;
    }
  },
  
  /**
   * Remove um cupom do carrinho
   * 
   * @param {string} couponCode - Código do cupom
   */
  removeCoupon: async (couponCode) => {
    try {
      const url = `/api/cart/remove-coupon`;
      const data = { code: couponCode };
      const response = await axiosInstance.post(url, data);
      return response.data;
    } catch (error) {
      console.error('Erro ao remover cupom:', error);
      throw error;
    }
  }
};

/**
 * Função para formatar preços
 * 
 * @param {string|number} price - Preço a ser formatado
 * @returns {string} - Preço formatado em BRL
 */
export const formatPrice = (price) => {
  if (!price) return 'R$ 0,00';
  
  let numericPrice;
  
  // Converter string para número
  if (typeof price === 'string') {
    // Remover símbolos de moeda e espaços
    const cleanedPrice = price.replace(/[R$\s]/g, '');
    
    // Lidar com formatos diferentes de número
    if (cleanedPrice.includes('.') && cleanedPrice.includes(',')) {
      // Formato R$ 1.234,56
      numericPrice = parseFloat(cleanedPrice.replace(/\./g, '').replace(',', '.'));
    } else if (cleanedPrice.includes(',')) {
      // Formato R$ 1234,56
      numericPrice = parseFloat(cleanedPrice.replace(',', '.'));
    } else {
      // Formato numérico padrão ou R$ 1234.56
      numericPrice = parseFloat(cleanedPrice);
    }
  } else {
    numericPrice = price;
  }
  
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2
  }).format(numericPrice);
};
