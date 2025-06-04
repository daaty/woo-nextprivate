export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { cart_key } = req.body;
    
    if (!cart_key) {
      return res.status(400).json({ success: false, message: 'Cart key é obrigatório' });
    }

    console.log('[API Simple Cart Remove] 🗑️ Removendo item:', cart_key);
    
    const startTime = Date.now();
      // Buscar carrinho do cookie com tratamento de erro
    let sessionCart = { items: [] };
    try {
      if (req.cookies['simple_cart']) {
        sessionCart = JSON.parse(req.cookies['simple_cart']);
      }
    } catch (parseError) {
      console.log('[API Simple Cart Remove] ⚠️ Cookie corrompido, criando carrinho vazio:', parseError.message);
      sessionCart = { items: [] };
    }
    
    // Encontrar e remover o item
    const itemIndex = sessionCart.items.findIndex(item => item.cartKey === cart_key);
    
    if (itemIndex === -1) {
      return res.status(404).json({ success: false, message: 'Item não encontrado no carrinho' });
    }
    
    // Remover item
    const [removedItem] = sessionCart.items.splice(itemIndex, 1);
    
    // Recalcular totais
    const totalItems = sessionCart.items.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = sessionCart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    sessionCart.items_count = totalItems;
    sessionCart.total = `R$ ${totalPrice.toFixed(2).replace('.', ',')}`;
    sessionCart.total_numeric = totalPrice;
    
    // Salvar carrinho atualizado no cookie
    const cartCookie = `simple_cart=${JSON.stringify(sessionCart)}; Path=/; Max-Age=86400; SameSite=Lax`;
    res.setHeader('Set-Cookie', cartCookie);
    
    const responseTime = Date.now() - startTime;
    
    console.log(`[API Simple Cart Remove] ✅ Item removido em ${responseTime}ms`);
    
    // NOVO: Disparar evento de atualização do carrinho no servidor-side (se necessário)
    const responseData = {
      success: true,
      message: 'Item removido do carrinho com sucesso!',
      removedItem: {
        productId: removedItem.product_id,
        cartKey: cart_key,
        productName: removedItem?.name || 'Item'
      },
      cart: {
        items: sessionCart.items,
        itemsCount: sessionCart.items_count,
        total: sessionCart.total,
        totalNumeric: sessionCart.total_numeric
      },
      responseTime
    };

    return res.status(200).json(responseData);

  } catch (error) {
    console.error('[API Simple Cart Remove] ❌ Erro:', error);
    
    return res.status(500).json({
      success: false,
      message: error.message || 'Erro ao remover item do carrinho',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
