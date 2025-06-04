/**
 * API Endpoint para deletar pedidos
 * Conecta diretamente com WooCommerce na VPS
 */
import WooCommerceRestApi from "@woocommerce/woocommerce-rest-api";

// Configuração da API WooCommerce
const api = new WooCommerceRestApi({
  url: process.env.WOO_SITE_URL || process.env.NEXT_PUBLIC_WORDPRESS_URL,
  consumerKey: process.env.WOO_CONSUMER_KEY,
  consumerSecret: process.env.WOO_CONSUMER_SECRET,
  version: "wc/v3",
  queryStringAuth: true
});

export default async function handler(req, res) {
  console.log('[Delete Order API] Iniciando requisição:', req.method);
  
  if (req.method !== 'DELETE') {
    console.log('[Delete Order API] Método não permitido:', req.method);
    return res.status(405).json({ 
      success: false, 
      message: 'Método não permitido' 
    });
  }
  try {
    // Check both query parameters and request body for orderId
    let { orderId } = req.query;
    
    // If not found in query, check the request body
    if (!orderId && req.body) {
      orderId = req.body.orderId;
    }
    
    if (!orderId) {
      console.log('[Delete Order API] ID do pedido não fornecido');
      return res.status(400).json({ 
        success: false, 
        message: 'ID do pedido é obrigatório' 
      });
    }

    console.log(`[Delete Order API] Tentando deletar pedido: ${orderId}`);

    // Verificar se o pedido existe antes de tentar deletar
    try {
      const orderCheck = await api.get(`orders/${orderId}`);
      console.log(`[Delete Order API] Pedido encontrado: ${orderCheck.data.id}, Status: ${orderCheck.data.status}`);
    } catch (checkError) {
      console.log(`[Delete Order API] Pedido não encontrado: ${orderId}`);
      return res.status(404).json({ 
        success: false, 
        message: 'Pedido não encontrado' 
      });
    }

    // Tentar deletar o pedido
    const deleteResponse = await api.delete(`orders/${orderId}`, {
      force: true // Force delete para remover permanentemente
    });

    console.log(`[Delete Order API] Pedido deletado com sucesso: ${orderId}`);
    console.log(`[Delete Order API] Resposta da API:`, {
      id: deleteResponse.data.id,
      status: deleteResponse.data.status,
      deleted: true
    });

    return res.status(200).json({
      success: true,
      message: 'Pedido deletado com sucesso',
      orderId: orderId,
      data: deleteResponse.data
    });

  } catch (error) {
    console.error('[Delete Order API] Erro ao deletar pedido:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data
    });

    // Verificar diferentes tipos de erro
    if (error.response?.status === 404) {
      return res.status(404).json({
        success: false,
        message: 'Pedido não encontrado'
      });
    }

    if (error.response?.status === 401) {
      return res.status(401).json({
        success: false,
        message: 'Não autorizado para deletar pedidos'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
}