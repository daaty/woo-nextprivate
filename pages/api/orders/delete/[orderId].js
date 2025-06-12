import WooCommerceRestApi from '@woocommerce/woocommerce-rest-api';

const api = new WooCommerceRestApi({
  url: process.env.NEXT_PUBLIC_WORDPRESS_SITE_URL,
  consumerKey: process.env.WOO_CONSUMER_KEY,
  consumerSecret: process.env.WOO_CONSUMER_SECRET,
  version: 'wc/v3'
});

export default async function handler(req, res) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { orderId } = req.query;
    
    console.log('[API Delete Order] Excluindo pedido:', orderId);
    
    if (!orderId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Order ID é obrigatório' 
      });
    }

    // Excluir pedido na API do WooCommerce
    const response = await api.delete(`orders/${orderId}`, {
      force: true // Excluir permanentemente
    });

    console.log('[API Delete Order] Pedido excluído com sucesso:', orderId);

    return res.status(200).json({
      success: true,
      message: 'Pedido excluído com sucesso',
      orderId: orderId
    });

  } catch (error) {
    console.error('[API Delete Order] Erro ao excluir pedido:', error);
    
    if (error.response) {
      console.error('[API Delete Order] Resposta de erro:', error.response.data);
      return res.status(error.response.status || 500).json({
        success: false,
        error: error.response.data?.message || 'Erro na API do WooCommerce'
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor ao excluir pedido'
    });
  }
}
