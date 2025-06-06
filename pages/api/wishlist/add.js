// Wishlist API - Versão simplificada sem next-auth
// import { connectToDatabase } from '../../../src/utils/mongodb'; // Comentado temporariamente

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Por enquanto, retornar sucesso sem persistir dados
    // TODO: Implementar persistência quando necessário
    console.log('[Wishlist] Add endpoint chamado:', req.body);
    
    if (!session) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    const { product } = req.body;
    
    if (!product || !product.id) {
      return res.status(400).json({ message: 'Product data is required' });
    }

    const { db } = await connectToDatabase();
    
    // Check if product already exists in user's wishlist
    const existingItem = await db.collection('wishlist').findOne({
      userId: session.user.id,
      'product.id': product.id
    });

    if (existingItem) {
      return res.status(200).json({ message: 'Product already in wishlist' });
    }

    // Add product to wishlist
    await db.collection('wishlist').insertOne({
      userId: session.user.id,
      product,
      addedAt: new Date()
    });

    return res.status(200).json({ message: 'Product added to wishlist' });
  } catch (error) {
    console.error('Error adding to wishlist:', error);
    res.status(500).json({ message: 'Failed to add product to wishlist' });
  }
}