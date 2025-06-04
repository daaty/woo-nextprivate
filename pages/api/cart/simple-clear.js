export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    console.log('[API Simple Cart Clear] 🧹 Limpando carrinho completo');
    
    const startTime = Date.now();
    
    // Criar carrinho vazio
    const emptyCart = {
      items: [],
      items_count: 0,
      total: 'R$ 0,00',
      total_numeric: 0,
      subtotal: 'R$ 0,00',
      shipping: 'R$ 0,00',
      taxes: 'R$ 0,00'
    };
    
    // Limpar cookie do carrinho
    const cartCookie = `simple_cart=${JSON.stringify(emptyCart)}; Path=/; Max-Age=86400; SameSite=Lax`;
    res.setHeader('Set-Cookie', cartCookie);
    
    const responseTime = Date.now() - startTime;
    
    console.log(`[API Simple Cart Clear] ✅ Carrinho limpo em ${responseTime}ms`);

    return res.status(200).json({
      success: true,
      message: 'Carrinho limpo com sucesso!',
      data: emptyCart,
      responseTime
    });

  } catch (error) {
    console.error('[API Simple Cart Clear] ❌ Erro:', error);
    
    return res.status(500).json({
      success: false,
      message: error.message || 'Erro ao limpar carrinho',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
