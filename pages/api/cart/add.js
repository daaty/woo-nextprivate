export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { product_id, quantity = 1, variation_id } = req.body;
    
    if (!product_id) {
      return res.status(400).json({ success: false, message: 'Product ID é obrigatório' });
    }

    console.log('[API Cart Add] 🛒 Adicionando produto:', { product_id, quantity, variation_id });
    
    const startTime = Date.now();
    
    // Usar uma abordagem diferente - via POST direto ao WooCommerce
    const wpUrl = process.env.NEXT_PUBLIC_WORDPRESS_URL;
    
    // Criar dados de formulário para enviar ao WooCommerce
    const formData = new URLSearchParams();
    formData.append('add-to-cart', product_id);
    formData.append('quantity', quantity);
    
    if (variation_id) {
      formData.append('variation_id', variation_id);
    }
    
    // Headers para simular um browser
    const headers = {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
      'Origin': wpUrl,
      'Referer': `${wpUrl}/loja/`
    };

    // Adicionar cookies de sessão se disponíveis
    const sessionCookies = [];
    if (req.cookies['woocommerce_session']) {
      sessionCookies.push(`woocommerce_session=${req.cookies['woocommerce_session']}`);
    }
    if (req.cookies['woocommerce_cart_hash']) {
      sessionCookies.push(`woocommerce_cart_hash=${req.cookies['woocommerce_cart_hash']}`);
    }
    if (sessionCookies.length > 0) {
      headers['Cookie'] = sessionCookies.join('; ');
    }

    console.log('[API Cart Add] Enviando para:', `${wpUrl}/`);
    console.log('[API Cart Add] Dados:', formData.toString());

    const response = await fetch(`${wpUrl}/`, {
      method: 'POST',
      headers,
      body: formData.toString(),
      redirect: 'manual' // Não seguir redirects automaticamente
    });

    console.log('[API Cart Add] Status resposta:', response.status);

    // WooCommerce retorna 302 redirect quando adiciona com sucesso
    if (response.status === 302 || response.status === 200) {
      // Extrair cookies de sessão da resposta
      const setCookieHeaders = response.headers.get('set-cookie');
      if (setCookieHeaders) {
        console.log('[API Cart Add] Cookies recebidos:', setCookieHeaders);
        
        // Processar cookies e enviá-los de volta para o cliente
        const cookies = setCookieHeaders.split(',').map(cookie => cookie.trim());
        cookies.forEach(cookie => {
          if (cookie.includes('woocommerce_session') || cookie.includes('woocommerce_cart_hash')) {
            res.setHeader('Set-Cookie', cookie);
          }
        });
      }

      const responseTime = Date.now() - startTime;
      
      console.log(`[API Cart Add] ✅ Produto adicionado em ${responseTime}ms`);

      return res.status(200).json({
        success: true,
        message: 'Produto adicionado ao carrinho com sucesso!',
        data: {
          product_id: parseInt(product_id),
          quantity: parseInt(quantity),
          variation_id: variation_id ? parseInt(variation_id) : null
        },
        responseTime
      });
    }

    // Se não foi sucesso, tentar ler a resposta
    const responseText = await response.text();
    console.log('[API Cart Add] Resposta completa:', responseText.substring(0, 500));

    // Verificar se há mensagens de erro específicas do WooCommerce
    if (responseText.includes('error') || responseText.includes('erro')) {
      throw new Error('Produto não encontrado ou fora de estoque');
    }

    throw new Error(`Erro inesperado: ${response.status}`);

  } catch (error) {
    console.error('[API Cart Add] ❌ Erro:', error);
    
    return res.status(500).json({
      success: false,
      message: error.message || 'Erro ao adicionar produto ao carrinho',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
