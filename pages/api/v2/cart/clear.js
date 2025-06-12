/**
 * Clear Cart API Endpoint - v2 (Simplified Version)
 * Clears all items from cart
 */

export default async function handler(req, res) {
  // Aceitar apenas requisições POST
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ 
      success: false,
      error: `Método ${req.method} não permitido. Use POST para limpar o carrinho.`
    });
  }

  try {
    // Obter o ID da sessão do cabeçalho
    const sessionId = req.headers['x-cart-session-id'];    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: 'ID de sessão não fornecido'
      });
    }

    console.log(`[CartAPI v2] Limpando carrinho para a sessão: ${sessionId}`);

    // Verificar se o armazenamento do carrinho existe
    if (!global.cartStorageV2) {
      global.cartStorageV2 = {};
    }

    // Limpar o carrinho para esta sessão
    global.cartStorageV2[sessionId] = [];

    console.log(`[CartAPI v2] Carrinho limpo com sucesso para a sessão: ${sessionId}`);

    // Retornar resposta bem-sucedida
    return res.status(200).json({
      success: true,
      data: [],
      meta: {
        total: 0,
        itemCount: 0,
        sessionId
      }
    });
  } catch (error) {
    console.error(`[CartAPI v2] Erro ao limpar o carrinho:`, error);
    
    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor ao limpar o carrinho'
    });
  }
}
