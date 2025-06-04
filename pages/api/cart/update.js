export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { cart_key, quantity } = req.body;
    
    if (!cart_key) {
      return res.status(400).json({ success: false, message: 'Cart key é obrigatório' });
    }

    const numericQuantity = parseInt(quantity);
    if (isNaN(numericQuantity) || numericQuantity < 0) {
      return res.status(400).json({ success: false, message: 'Quantidade deve ser um número válido' });
    }

    console.log('[API Cart Update] 🔄 Atualizando item:', { cart_key, quantity: numericQuantity });
    
    const startTime = Date.now();
    
    // Usar WooCommerce Store API
    const auth = Buffer.from(`${process.env.WC_CONSUMER_KEY}:${process.env.WC_CONSUMER_SECRET}`).toString('base64');
    
    const headers = {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json',
      'User-Agent': 'NextJS-Cart/1.0',
      'X-Requested-With': 'XMLHttpRequest'
    };

    // Usar Store API do WooCommerce
    const apiUrl = `${process.env.NEXT_PUBLIC_WORDPRESS_URL}/wp-json/wc/store/cart/update-item`;

    const updateData = {
      key: cart_key,
      quantity: numericQuantity
    };

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(updateData)
    });

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        const errorText = await response.text();
        throw new Error(`WooCommerce API error: ${response.status} - ${errorText}`);
      }
      
      throw new Error(errorData.message || `WooCommerce API error: ${response.status}`);
    }

    const result = await response.json();
    const responseTime = Date.now() - startTime;
    
    console.log(`[API Cart Update] ✅ Item atualizado em ${responseTime}ms`);

    return res.status(200).json({
      success: true,
      message: numericQuantity === 0 ? 'Item removido do carrinho!' : 'Quantidade atualizada com sucesso!',
      data: result,
      responseTime
    });

  } catch (error) {
    console.error('[API Cart Update] ❌ Erro:', error);
    
    return res.status(500).json({
      success: false,
      message: error.message || 'Erro ao atualizar item do carrinho',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
