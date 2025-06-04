/**
 * Utilitários para manipulação segura do cookie do carrinho
 */

/**
 * Parse seguro do cookie do carrinho
 * @param {string|undefined} cookieValue - Valor do cookie simple_cart
 * @returns {object} Objeto do carrinho ou carrinho vazio se inválido
 */
export function safeParseCartCookie(cookieValue) {
  if (!cookieValue) {
    return { items: [] };
  }

  try {
    const parsed = JSON.parse(cookieValue);
    // Validar estrutura básica
    if (!parsed || typeof parsed !== 'object') {
      throw new Error('Cookie não é um objeto válido');
    }
    
    // Garantir que tem array de items
    if (!Array.isArray(parsed.items)) {
      parsed.items = [];
    }
    
    return parsed;
  } catch (error) {
    console.log('[Cart Cookie Utils] ⚠️ Cookie corrompido:', error.message);
    return { items: [] };
  }
}

/**
 * Limpa cookie corrompido do carrinho
 * @param {object} res - Response object do Next.js
 */
export function clearCorruptedCartCookie(res) {
  res.setHeader('Set-Cookie', [
    'simple_cart=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT'
  ]);
}

/**
 * Cria cookie do carrinho com validação
 * @param {object} cartData - Dados do carrinho
 * @returns {string} String do cookie formatada
 */
export function createCartCookie(cartData) {
  try {
    // Validar dados antes de criar cookie
    if (!cartData || typeof cartData !== 'object') {
      throw new Error('Dados do carrinho inválidos');
    }
    
    // Garantir estrutura mínima
    const safeCart = {
      items: Array.isArray(cartData.items) ? cartData.items : [],
      ...cartData
    };
    
    return `simple_cart=${JSON.stringify(safeCart)}; Path=/; Max-Age=86400; SameSite=Lax`;
  } catch (error) {
    console.error('[Cart Cookie Utils] ❌ Erro ao criar cookie:', error);
    // Retornar cookie vazio em caso de erro
    return `simple_cart=${JSON.stringify({ items: [] })}; Path=/; Max-Age=86400; SameSite=Lax`;
  }
}
