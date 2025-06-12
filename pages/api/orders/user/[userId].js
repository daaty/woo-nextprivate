import WooCommerceRestApi from '@woocommerce/woocommerce-rest-api';

const api = new WooCommerceRestApi({
  url: process.env.NEXT_PUBLIC_WORDPRESS_SITE_URL,
  consumerKey: process.env.WOO_CONSUMER_KEY,
  consumerSecret: process.env.WOO_CONSUMER_SECRET,
  version: 'wc/v3'
});

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId } = req.query;
    
    console.log('[API Orders] Buscando pedidos para usuário:', userId);
    
    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        error: 'User ID é obrigatório' 
      });
    }

    // Buscar pedidos do usuário na API do WooCommerce
    const response = await api.get('orders', {
      customer: parseInt(userId),
      per_page: 100, // Máximo de pedidos a buscar
      orderby: 'date',
      order: 'desc'
    });

    console.log('[API Orders] Pedidos encontrados:', response.data?.length || 0);

    // Processar e formatar os dados dos pedidos
    const orders = response.data.map(order => ({
      id: order.id,
      number: order.number,
      status: order.status,
      date: order.date_created,
      total: order.total,
      currency: order.currency,
      paymentMethod: order.payment_method,
      paymentMethodTitle: order.payment_method_title,
      billing: order.billing,
      shipping: order.shipping,
      line_items: order.line_items.map(item => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        total: item.total,
        image: item.image
      })),
      shipping_lines: order.shipping_lines
    }));

    return res.status(200).json({
      success: true,
      orders: orders,
      total: orders.length
    });

  } catch (error) {
    console.error('[API Orders] Erro ao buscar pedidos:', error);
    
    if (error.response) {
      console.error('[API Orders] Resposta de erro:', error.response.data);
      return res.status(error.response.status || 500).json({
        success: false,
        error: error.response.data?.message || 'Erro na API do WooCommerce'
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor ao buscar pedidos'
    });
  }
}
