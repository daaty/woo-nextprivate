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

    console.log('[API Simple Cart Update] 🔄 Atualizando item:', { cart_key, quantity: numericQuantity });
    
    const startTime = Date.now();
      // Buscar carrinho do cookie com tratamento de erro
    let sessionCart = { items: [] };
    try {
      if (req.cookies['simple_cart']) {
        sessionCart = JSON.parse(req.cookies['simple_cart']);
      }
    } catch (parseError) {
      console.log('[API Simple Cart Update] ⚠️ Cookie corrompido, criando carrinho vazio:', parseError.message);
      sessionCart = { items: [] };
    }
    
    // Encontrar e atualizar o item
    const itemIndex = sessionCart.items.findIndex(item => item.cartKey === cart_key);
    
    if (itemIndex === -1) {
      return res.status(404).json({ success: false, message: 'Item não encontrado no carrinho' });
    }
    
    if (numericQuantity === 0) {
      // Remover item se quantidade for 0
      sessionCart.items.splice(itemIndex, 1);
    } else {
      // Atualizar quantidade
      sessionCart.items[itemIndex].quantity = numericQuantity;
      sessionCart.items[itemIndex].qty = numericQuantity;
      sessionCart.items[itemIndex].totalPrice = `R$ ${(sessionCart.items[itemIndex].price * numericQuantity).toFixed(2).replace('.', ',')}`;
    }
    
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
    
    console.log(`[API Simple Cart Update] ✅ Item atualizado em ${responseTime}ms`);

    return res.status(200).json({
      success: true,
      message: numericQuantity === 0 ? 'Item removido do carrinho!' : 'Quantidade atualizada com sucesso!',
      data: sessionCart,
      responseTime
    });

  } catch (error) {
    console.error('[API Simple Cart Update] ❌ Erro:', error);
    
    return res.status(500).json({
      success: false,
      message: error.message || 'Erro ao atualizar item do carrinho',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
