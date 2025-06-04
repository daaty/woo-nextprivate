/**
 * Cart Utilities - Funções compartilhadas para manipulação do carrinho
 * Ajuda a manter consistência entre cart.js e checkout.js
 */

import { formatPrice as formatPriceOriginal, priceToNumber } from './format-price';

/**
 * Formata um preço com tratamento robusto de fallbacks
 * @param {*} value - Valor a ser formatado (string, número ou null)
 * @returns {string} Preço formatado no padrão brasileiro
 */
export const formatPrice = (value) => {
  if (value === undefined || value === null) {
    return 'R$ 0,00';
  }
  
  // Se for string, extrair valor numérico
  if (typeof value === 'string') {
    const numericValue = priceToNumber(value);
    return formatPriceOriginal(isNaN(numericValue) ? 0 : numericValue);
  }
  
  // Se for número, usar diretamente
  if (typeof value === 'number') {
    return formatPriceOriginal(isNaN(value) ? 0 : value);
  }
  
  return formatPriceOriginal(0);
};

/**
 * Calcula o subtotal do carrinho com validação robusta
 * @param {Array} items - Itens do carrinho
 * @returns {number} Subtotal calculado
 */
export const calculateCartSubtotal = (items) => {
  if (!Array.isArray(items) || items.length === 0) {
    return 0;
  }

  return items.reduce((total, item) => {
    let price = 0;
    let quantity = 1;
    
    // Extrair preço com fallbacks robustos
    if (typeof item.price === 'number') {
      price = item.price;
    } else if (item.price_raw && !isNaN(parseFloat(item.price_raw))) {
      price = parseFloat(item.price_raw);
    } else if (typeof item.price === 'string') {
      // Limpar a string e converter para número
      const cleanedPrice = item.price.replace(/[^\d.,\-]/g, '').replace(',', '.');
      if (!isNaN(parseFloat(cleanedPrice))) {
        price = parseFloat(cleanedPrice);
      }
    } else if (item.totals?.total && !isNaN(parseFloat(item.totals.total))) {
      price = parseFloat(item.totals.total);
    }
    
    // Extrair quantidade com fallbacks robustos
    if (item.quantity && !isNaN(parseInt(item.quantity))) {
      quantity = parseInt(item.quantity);
    } else if (item.qty && !isNaN(parseInt(item.qty))) {
      quantity = parseInt(item.qty);
    }
    
    const itemTotal = price * quantity;
    
    if (!isNaN(itemTotal) && itemTotal > 0) {
      return total + itemTotal;
    }
    
    return total;
  }, 0);
};

/**
 * Encontra o melhor valor disponível para o subtotal do carrinho
 * @param {Object} options - Opções disponíveis (subtotal, manualSubtotal, cartTotal)
 * @returns {number} O melhor valor disponível
 */
export const getBestSubtotalValue = ({ subtotal, manualSubtotal, cartTotal }) => {
  // Ordem de prioridade:
  // 1. manualSubtotal (calculado diretamente dos itens)
  // 2. subtotal do contexto
  // 3. cartTotal

  if (manualSubtotal && !isNaN(manualSubtotal) && manualSubtotal > 0) {
    return manualSubtotal;
  }
  
  if (subtotal && typeof subtotal === 'number' && !isNaN(subtotal) && subtotal > 0) {
    return subtotal;
  }
  
  if (typeof cartTotal === 'number' && !isNaN(cartTotal) && cartTotal > 0) {
    return cartTotal;
  }
  
  if (typeof cartTotal === 'string') {
    const parsed = priceToNumber(cartTotal);
    if (!isNaN(parsed) && parsed > 0) {
      return parsed;
    }
  }
  
  return 0;
};

/**
 * Salva o estado atual do carrinho para recuperação de emergência
 * @param {Object} cartState - Estado atual do carrinho
 */
export const persistCartState = (cartState) => {
  if (typeof window === 'undefined') return;
  
  try {
    const safeCartState = {
      items: cartState.items || [],
      count: cartState.count || 0,
      subtotal: cartState.subtotal || 0,
      timestamp: Date.now()
    };
    
    // Usar tanto localStorage quanto sessionStorage para redundância
    localStorage.setItem('cart_backup', JSON.stringify(safeCartState));
    sessionStorage.setItem('cart_state', JSON.stringify(safeCartState));
    
    // Salvar em propriedade global para acesso de emergência
    window._cartBackup = safeCartState;
  } catch (error) {
    console.error('[cart-utils] Erro ao persistir estado do carrinho:', error);
  }
};

/**
 * Recupera o estado do carrinho persistido
 * @returns {Object|null} Estado do carrinho ou null se não encontrado
 */
export const getPersistedCartState = () => {
  if (typeof window === 'undefined') return null;
  
  try {
    // Tentar primeiro sessionStorage (mais recente)
    const sessionData = sessionStorage.getItem('cart_state');
    if (sessionData) {
      const parsedSession = JSON.parse(sessionData);
      if (parsedSession && Array.isArray(parsedSession.items)) {
        return parsedSession;
      }
    }
    
    // Tentar localStorage como fallback
    const localData = localStorage.getItem('cart_backup');
    if (localData) {
      const parsedLocal = JSON.parse(localData);
      if (parsedLocal && Array.isArray(parsedLocal.items)) {
        return parsedLocal;
      }
    }
    
    // Último recurso: verificar a variável global
    if (window._cartBackup && Array.isArray(window._cartBackup.items)) {
      return window._cartBackup;
    }
    
    return null;
  } catch (error) {
    console.error('[cart-utils] Erro ao recuperar estado do carrinho:', error);
    return null;
  }
};

/**
 * Compara o estado atual do carrinho com o estado persistido
 * para detectar inconsistências
 */
export const detectCartInconsistencies = (currentItems, storedState) => {
  if (!Array.isArray(currentItems) || !storedState) return false;
  
  // Se o número de itens for diferente, já podemos detectar inconsistência
  if (currentItems.length !== storedState.items.length) {
    return {
      type: 'count_mismatch',
      current: currentItems.length,
      stored: storedState.items.length
    };
  }
  
  // Verificar se algum item está faltando no estado atual
  const currentIds = new Set(currentItems.map(item => item.productId || item.id));
  const missingItems = storedState.items.filter(item => 
    !currentIds.has(item.productId || item.id)
  );
  
  if (missingItems.length > 0) {
    return {
      type: 'missing_items',
      missingItems
    };
  }
  
  return false;
};

/**
 * Sanitiza dados de produto para evitar problemas na serialização
 * e armazenamento em cookies/localStorage
 */
export const sanitizeProductData = (product) => {
  if (!product) return {};
  
  return {
    id: product.id || product.productId || '',
    name: typeof product.name === 'string' 
      ? product.name.replace(/[\u0000-\u001F\u007F-\u009F]/g, '')  // Remove control chars
                 .replace(/\\/g, '\\\\')                           // Escape backslashes
                 .replace(/"/g, '\\"')                             // Escape quotes
                 .substring(0, 100)                                // Limit length
      : `Produto ${product.id || ''}`,
    price: typeof product.price === 'number' 
      ? product.price 
      : priceToNumber(product.price || product.subtotal || '0'),
    quantity: parseInt(product.qty || product.quantity || 1),
    image: typeof product.image?.sourceUrl === 'string'
      ? product.image.sourceUrl.replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
      : null
  };
};

/**
 * Emite evento padronizado de atualização do carrinho
 */
export const emitCartUpdatedEvent = (detail) => {
  if (typeof window === 'undefined') return;
  
  const safeDetail = {
    timestamp: Date.now(),
    ...detail
  };
  
  window.dispatchEvent(new CustomEvent('cartUpdated', { 
    detail: safeDetail
  }));
  
  // Também emitir evento específico para minicart
  window.dispatchEvent(new CustomEvent('minicartUpdate', { 
    detail: safeDetail
  }));
};
