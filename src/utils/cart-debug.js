/**
 * Utilitários para depuração do sistema de carrinho
 */

/**
 * Imprime informações detalhadas sobre o estado atual do carrinho no servidor
 * @param {string} sourceContext Nome do contexto que está fazendo o log
 */
export const logServerCartState = (sourceContext = 'CartDebug') => {
  try {
    // Verificar se estamos no servidor
    if (typeof window !== 'undefined') return;
    
    if (!global.serverCartStorage) {
      console.log(`[${sourceContext}] 📂 serverCartStorage não inicializado`);
      return;
    }

    const sessionIds = Object.keys(global.serverCartStorage);
    
    if (sessionIds.length === 0) {
      console.log(`[${sourceContext}] 📂 Nenhum carrinho encontrado no armazenamento do servidor`);
      return;
    }
    
    console.log(`[${sourceContext}] 📂 Estado do armazenamento do servidor:`);
    console.log(`[${sourceContext}] 📋 Sessões ativas: ${sessionIds.length}`);
    
    sessionIds.forEach(sessionId => {
      const cart = global.serverCartStorage[sessionId];
      if (!cart || !cart.items || !Array.isArray(cart.items)) {
        console.log(`[${sourceContext}] ⚠️ Sessão ${sessionId}: estrutura inválida`);
        return;
      }
      
      const totalQty = cart.items.reduce((sum, item) => sum + (parseInt(item.quantity) || 1), 0);
      const timestamp = new Date(cart.timestamp).toISOString();
      const productIds = cart.items.map(item => item.productId).join(', ');
      
      console.log(`[${sourceContext}] ✅ Sessão ${sessionId}: ${cart.items.length} tipos de produtos, ${totalQty} unidades, última atualização: ${timestamp}`);
      console.log(`[${sourceContext}] 🛒 Produtos: ${productIds}`);
    });
  } catch (error) {
    console.error(`[${sourceContext}] ❌ Erro ao verificar estado do carrinho:`, error);
  }
};

/**
 * Valida a estrutura do carrinho e retorna informações sobre sua integridade
 * @param {Object} cart Objeto do carrinho a ser validado
 * @param {string} sourceContext Nome do contexto que está fazendo a validação
 * @returns {Object} Resultado da validação
 */
export const validateCartStructure = (cart, sourceContext = 'CartDebug') => {
  const result = {
    isValid: false,
    hasItems: false,
    itemCount: 0,
    totalQty: 0,
    problems: []
  };
  
  try {
    if (!cart) {
      result.problems.push('Carrinho indefinido');
      return result;
    }
    
    if (!cart.items) {
      result.problems.push('Propriedade items não encontrada');
      return result;
    }
    
    if (!Array.isArray(cart.items)) {
      result.problems.push('items não é um array');
      return result;
    }
    
    result.hasItems = cart.items.length > 0;
    result.itemCount = cart.items.length;
    
    // Verificar problemas em cada item
    cart.items.forEach((item, index) => {
      if (!item.productId) {
        result.problems.push(`Item ${index} não tem productId`);
      }
      
      if (item.quantity !== undefined) {
        const qty = parseInt(item.quantity);
        if (isNaN(qty) || qty <= 0) {
          result.problems.push(`Item ${index} (${item.productId}) tem quantidade inválida: ${item.quantity}`);
        } else {
          result.totalQty += qty;
        }
      } else {
        result.totalQty += 1; // Assumir quantidade 1 se não especificado
        result.problems.push(`Item ${index} (${item.productId}) não tem quantidade definida`);
      }
    });
    
    result.isValid = result.problems.length === 0;
    
    // Log se houver problemas
    if (!result.isValid) {
      console.log(`[${sourceContext}] ⚠️ Problemas encontrados no carrinho:`, result.problems);
    }
    
    return result;
  } catch (error) {
    result.problems.push(`Erro na validação: ${error.message}`);
    console.error(`[${sourceContext}] ❌ Erro ao validar carrinho:`, error);
    return result;
  }
};

// Exportar funções adicionais conforme necessário
export default {
  logServerCartState,
  validateCartStructure
};
