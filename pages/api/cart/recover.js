/**
 * API para recuperação de estado do carrinho em caso de erros
 */

import { withSessionRoute } from '../../../src/lib/withSession';

export default withSessionRoute(async function cartRecoverHandler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    // Verificar se há itens no corpo da requisição
    const { items } = req.body;
    
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'No valid items provided for recovery' 
      });
    }
    
    // Processar dados de itens para garantir formato correto
    const sanitizedItems = items.map(item => ({
      id: item.id || item.productId,
      quantity: parseInt(item.quantity || item.qty || 1),
      name: item.name || `Product ${item.id || item.productId}`,
      price: parseFloat(item.price) || 0,
      image: item.image?.sourceUrl || item.image || null
    }));
    
    // Criar ou atualizar carrinho na sessão
    req.session.cart = req.session.cart || {};
    req.session.cart.items = sanitizedItems;
    req.session.cart.items_count = sanitizedItems.reduce((sum, item) => sum + item.quantity, 0);
    req.session.cart.last_updated = new Date().toISOString();
    req.session.cart.recovered = true;
    
    await req.session.save();
    
    // Responder com sucesso e dados do carrinho
    return res.status(200).json({
      success: true,
      message: 'Cart recovered successfully',
      items: sanitizedItems,
      items_count: req.session.cart.items_count,
      cart: req.session.cart
    });
  } catch (error) {
    console.error('Error in cart recovery API:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Internal server error during recovery' 
    });
  }
});
