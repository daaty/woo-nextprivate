import { WooCommerceRestApi } from '@woocommerce/woocommerce-rest-api';

// Configuração da API REST do WooCommerce - USAR VARIÁVEIS CORRETAS DO .ENV
const WooCommerce = new WooCommerceRestApi({
  url: process.env.NEXT_PUBLIC_WORDPRESS_URL || 'https://rota.rotadoscelulares.com',
  consumerKey: process.env.WOO_CONSUMER_KEY || '',
  consumerSecret: process.env.WOO_CONSUMER_SECRET || '',
  version: 'wc/v3'
});

export default async function handler(req, res) {
  // Extrair o endpoint da URL
  const { endpoint } = req.query;
  const fullEndpoint = Array.isArray(endpoint) ? endpoint.join('/') : endpoint;

  console.log(`[WooCommerce API] ${req.method} /${fullEndpoint}`);

  try {
    let response;

    switch (req.method) {
      case 'GET':
        response = await WooCommerce.get(fullEndpoint);
        break;
      case 'POST':
        response = await WooCommerce.post(fullEndpoint, req.body);
        break;
      case 'PUT':
        response = await WooCommerce.put(fullEndpoint, req.body);
        break;
      case 'DELETE':
        response = await WooCommerce.delete(fullEndpoint);
        break;
      default:
        return res.status(405).json({ error: 'Método não permitido' });
    }

    console.log(`[WooCommerce API] Sucesso: ${response.status}`);
    return res.status(200).json(response.data);

  } catch (error) {
    console.error('[WooCommerce API] Erro:', error.response?.data || error.message);
    return res.status(error.response?.status || 500).json({
      error: error.response?.data || error.message
    });
  }
}
