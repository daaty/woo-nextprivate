/**
 * Unified Cart API Endpoint - v2 (JavaScript Clean Version)
 * Handles all cart operations through REST API only
 * Part of Phase 2: Implementation Core - FINAL
 */

// Simple in-memory cart storage for development
let cartStorage = {};

// Simple logging
const log = (message, data = null) => {
  console.log(`[CartAPI v2] ${message}`);
  if (data) console.log(data);
};

// Generate session ID
const generateSessionId = () => {
  return 'cart_v2_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
};

// Get session ID from request
const getSessionId = (req) => {
  return req.headers['x-cart-session-id'] || req.body?.sessionId || generateSessionId();
};

// Calculate cart totals
const calculateCartTotals = (items) => {
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  return {
    subtotal: subtotal.toFixed(2),
    total: subtotal.toFixed(2),
    tax_total: '0.00',
    shipping_total: '0.00',
    currency: 'BRL'
  };
};

export default async function handler(req, res) {
  const startTime = Date.now();
  
  try {
    const sessionId = getSessionId(req);
    const method = req.method;
    
    log(`${method} request from session: ${sessionId}`);
    
    // Initialize cart if not exists
    if (!cartStorage[sessionId]) {
      cartStorage[sessionId] = {
        items: [],
        total: 0,
        itemCount: 0,
        createdAt: new Date().toISOString()
      };
    }
    
    const cart = cartStorage[sessionId];
    
    switch (method) {
      case 'GET':
        // Get cart items
        log(`Returning cart with ${cart.items.length} items`);
        return res.status(200).json({
          success: true,
          data: cart.items,
          meta: {
            total: cart.total,
            itemCount: cart.itemCount,
            sessionId
          }
        });
        
      case 'POST':
        // Add item to cart
        const { productId, quantity = 1 } = req.body;
        
        if (!productId) {
          return res.status(400).json({
            success: false,
            error: 'Product ID é obrigatório'
          });
        }
        
        // Create mock item
        const newItem = {
          productId: parseInt(productId),
          name: `Produto ${productId}`,
          price: 99.90,
          quantity: parseInt(quantity),
          total: 99.90 * parseInt(quantity),
          image: 'https://via.placeholder.com/150',
          addedAt: new Date().toISOString()
        };
        
        // Check if item already exists
        const existingIndex = cart.items.findIndex(item => item.productId === newItem.productId);
        
        if (existingIndex >= 0) {
          // Update existing item
          cart.items[existingIndex].quantity += newItem.quantity;
          cart.items[existingIndex].total = cart.items[existingIndex].price * cart.items[existingIndex].quantity;
        } else {
          // Add new item
          cart.items.push(newItem);
        }
        
        // Update cart totals
        cart.total = cart.items.reduce((sum, item) => sum + item.total, 0);
        cart.itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);
        
        log(`Added product ${productId} to cart. Cart now has ${cart.items.length} different items`);
        
        return res.status(200).json({
          success: true,
          data: cart.items,
          meta: {
            total: cart.total,
            itemCount: cart.itemCount,
            sessionId
          }
        });
        
      case 'PUT':
        // Update item quantity
        const { productId: updateProductId, quantity: updateQuantity } = req.body;
        
        if (!updateProductId) {
          return res.status(400).json({
            success: false,
            error: 'Product ID é obrigatório'
          });
        }
        
        const itemIndex = cart.items.findIndex(item => item.productId === parseInt(updateProductId));
        
        if (itemIndex === -1) {
          return res.status(404).json({
            success: false,
            error: 'Item não encontrado no carrinho'
          });
        }
        
        if (updateQuantity <= 0) {
          // Remove item if quantity is 0 or less
          cart.items.splice(itemIndex, 1);
        } else {
          // Update quantity
          cart.items[itemIndex].quantity = parseInt(updateQuantity);
          cart.items[itemIndex].total = cart.items[itemIndex].price * parseInt(updateQuantity);
        }
        
        // Update cart totals
        cart.total = cart.items.reduce((sum, item) => sum + item.total, 0);
        cart.itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);
        
        log(`Updated product ${updateProductId} quantity to ${updateQuantity}`);
        
        return res.status(200).json({
          success: true,
          data: cart.items,
          meta: {
            total: cart.total,
            itemCount: cart.itemCount,
            sessionId
          }
        });
        
      case 'DELETE':
        // Remove item from cart
        const { productId: deleteProductId } = req.body;
        
        if (!deleteProductId) {
          return res.status(400).json({
            success: false,
            error: 'Product ID é obrigatório'
          });
        }
        
        const deleteIndex = cart.items.findIndex(item => item.productId === parseInt(deleteProductId));
        
        if (deleteIndex === -1) {
          return res.status(404).json({
            success: false,
            error: 'Item não encontrado no carrinho'
          });
        }
        
        cart.items.splice(deleteIndex, 1);
        
        // Update cart totals
        cart.total = cart.items.reduce((sum, item) => sum + item.total, 0);
        cart.itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);
        
        log(`Removed product ${deleteProductId} from cart`);
        
        return res.status(200).json({
          success: true,
          data: cart.items,
          meta: {
            total: cart.total,
            itemCount: cart.itemCount,
            sessionId
          }
        });
        
      default:
        return res.status(405).json({
          success: false,
          error: `Método ${method} não permitido`
        });
    }
    
  } catch (error) {
    log('Error in cart API:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  } finally {
    const duration = Date.now() - startTime;
    log(`Request completed in ${duration}ms`);
  }
}
