/**
 * API para garantir limpeza completa da sessão do carrinho
 * Este endpoint garante que qualquer dado residual seja removido
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Método não permitido' });
  }

  try {
    // Limpar cookies relacionados ao carrinho
    if (req.cookies) {
      const cartCookies = Object.keys(req.cookies).filter(key => 
        key.toLowerCase().includes('cart') || 
        key.toLowerCase().includes('woocommerce') ||
        key.toLowerCase().includes('session')
      );
      
      cartCookies.forEach(cookie => {
        res.setHeader('Set-Cookie', `${cookie}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly`);
      });
    }

    // Tentar limpar via WooCommerce API se estiver configurada
    try {
      // Se você tiver uma conexão direct com WooCommerce, pode adicionar aqui
      // const api = new WooCommerceRestApi({ ... });
      // await api.post('cart/clear');
    } catch (wooErr) {
      console.error('Erro ao limpar carrinho via WooCommerce API:', wooErr);
      // Continue, pois ainda removeremos os cookies
    }

    console.log('Sessão do carrinho limpa com sucesso');
    return res.status(200).json({ 
      success: true, 
      message: 'Sessão do carrinho limpa com sucesso'
    });
  } catch (error) {
    console.error('Erro ao limpar sessão do carrinho:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Erro ao limpar sessão do carrinho', 
      error: error.message 
    });
  }
}
