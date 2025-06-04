import WooCommerceRestApi from '@woocommerce/woocommerce-rest-api';

const api = new WooCommerceRestApi({
  url: process.env.NEXT_PUBLIC_WORDPRESS_SITE_URL,
  consumerKey: process.env.WOO_CONSUMER_KEY,
  consumerSecret: process.env.WOO_CONSUMER_SECRET,
  version: 'wc/v3'
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { customerId, addresses } = req.body;
    
    console.log('[API Update Address] Atualizando endereços para customer:', customerId);
    console.log('[API Update Address] Dados dos endereços:', addresses);
    
    if (!customerId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Customer ID é obrigatório' 
      });
    }

    if (!addresses || (!addresses.billing && !addresses.shipping)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Dados de endereço são obrigatórios' 
      });
    }

    // Preparar dados para atualização
    const updateData = {};

    if (addresses.billing) {
      updateData.billing = {
        first_name: addresses.billing.firstName || '',
        last_name: addresses.billing.lastName || '',
        company: addresses.billing.company || '',
        address_1: addresses.billing.address1 || '',
        address_2: addresses.billing.address2 || '',
        city: addresses.billing.city || '',
        state: addresses.billing.state || '',
        postcode: addresses.billing.postcode || '',
        country: addresses.billing.country || 'BR',
        email: addresses.billing.email || '',
        phone: addresses.billing.phone || ''
      };
    }

    if (addresses.shipping) {
      updateData.shipping = {
        first_name: addresses.shipping.firstName || '',
        last_name: addresses.shipping.lastName || '',
        company: addresses.shipping.company || '',
        address_1: addresses.shipping.address1 || '',
        address_2: addresses.shipping.address2 || '',
        city: addresses.shipping.city || '',
        state: addresses.shipping.state || '',
        postcode: addresses.shipping.postcode || '',
        country: addresses.shipping.country || 'BR'
      };
    }

    console.log('[API Update Address] Dados formatados para WooCommerce:', updateData);

    // Atualizar customer na API do WooCommerce
    const response = await api.put(`customers/${customerId}`, updateData);

    console.log('[API Update Address] Resposta do WooCommerce:', response.status);

    return res.status(200).json({
      success: true,
      message: 'Endereços atualizados com sucesso',
      data: response.data
    });

  } catch (error) {
    console.error('[API Update Address] Erro ao atualizar endereços:', error);
    
    if (error.response) {
      console.error('[API Update Address] Resposta de erro:', error.response.data);
      return res.status(error.response.status || 500).json({
        success: false,
        error: error.response.data?.message || 'Erro na API do WooCommerce'
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor ao atualizar endereços'
    });
  }
}
