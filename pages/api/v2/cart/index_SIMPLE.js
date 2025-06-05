/**
 * Simple Cart API Endpoint - v2 (Restored Clean Version)
 * Handles all cart operations through REST API only
 * RESTORED FROM WORKING VERSION - SIMPLE SESSION MANAGEMENT
 */

import { getProductData } from '../../../../src/v2/cart/services/wooCommerceIntegration.js';

// Simple in-memory cart storage for development
if (!global.cartStorageV2) {
  global.cartStorageV2 = {};
}

// Simple logging
const log = (message, data = null) => {
  console.log(`[CartAPI v2] ${message}`);
  if (data) console.log(data);
};

/**
 * Get session ID from request - SIMPLE VERSION
 */
const getSessionIdFromRequest = (req) => {
  // Check header first
  let sessionId = req.headers['x-cart-session-id'];
  
  if (!sessionId) {
    // Generate new session if none provided
    sessionId = `cart_v2_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    log(`Generated new session: ${sessionId}`);
  }
  
  return sessionId;
};

/**
 * Parse Brazilian price format to number
 */
const parseBrazilianPrice = (priceString) => {
  if (typeof priceString === 'number') return priceString;
  if (!priceString) return 0;
  
  // Remove currency symbol and convert format
  return parseFloat(
    priceString
      .toString()
      .replace('R$', '')
      .replace(/\./g, '') // Remove thousands separator
      .replace(',', '.') // Convert decimal separator
      .trim()
  ) || 0;
};

/**
 * Calculate cart totals
 */
const calculateCartTotals = (items) => {
  let subtotal = 0;
  let totalItems = 0;
  
  items.forEach(item => {
    const price = parseBrazilianPrice(item.price);
    subtotal += price * item.quantity;
    totalItems += item.quantity;
  });
  
  return {
    subtotal: subtotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
    totalItems,
    itemCount: items.length
  };
};

/**
 * Create cart item with consistent format
 */
const createCartItem = (product, quantity = 1) => {
  const price = parseBrazilianPrice(product.price);
  
  return {
    id: product.id || `item_${Date.now()}`,
    productId: product.id,
    name: product.name || 'Produto',
    price: price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
    quantity: parseInt(quantity) || 1,
    image: product.image || null,
    slug: product.slug || null,
    addedAt: new Date().toISOString(),
  };
};

/**
 * Main API handler
 */
export default async function handler(req, res) {
  const sessionId = getSessionIdFromRequest(req);
  
  // Ensure cart exists for session
  if (!global.cartStorageV2[sessionId]) {
    global.cartStorageV2[sessionId] = [];
  }

  try {
    switch (req.method) {
      case 'GET':
        // Get cart contents
        const cartItems = global.cartStorageV2[sessionId] || [];
        const totals = calculateCartTotals(cartItems);
        
        log(`GET cart for session ${sessionId}: ${cartItems.length} items`);
        
        return res.status(200).json({
          success: true,
          items: cartItems,
          count: totals.totalItems,
          total: totals.subtotal,
          session: sessionId,
        });

      case 'POST':
        // Add item to cart
        const { product, quantity = 1 } = req.body;
        
        if (!product || !product.id) {
          return res.status(400).json({
            success: false,
            error: 'Product data is required',
          });
        }

        // Check if item already exists in cart
        const existingItemIndex = global.cartStorageV2[sessionId].findIndex(
          item => item.productId === product.id
        );

        if (existingItemIndex >= 0) {
          // Update quantity if item exists
          global.cartStorageV2[sessionId][existingItemIndex].quantity += parseInt(quantity);
          log(`Updated existing item ${product.id} in cart ${sessionId}`);
        } else {
          // Add new item
          const cartItem = createCartItem(product, quantity);
          global.cartStorageV2[sessionId].push(cartItem);
          log(`Added new item ${product.id} to cart ${sessionId}`);
        }

        const postTotals = calculateCartTotals(global.cartStorageV2[sessionId]);
        
        return res.status(200).json({
          success: true,
          items: global.cartStorageV2[sessionId],
          count: postTotals.totalItems,
          total: postTotals.subtotal,
          message: 'Product added to cart',
        });

      case 'PUT':
        // Update item quantity
        const { itemId, quantity: newQuantity } = req.body;
        
        if (!itemId || newQuantity === undefined) {
          return res.status(400).json({
            success: false,
            error: 'Item ID and quantity are required',
          });
        }

        const updateIndex = global.cartStorageV2[sessionId].findIndex(
          item => item.id === itemId || item.productId === itemId
        );

        if (updateIndex >= 0) {
          if (parseInt(newQuantity) <= 0) {
            // Remove item if quantity is 0 or negative
            global.cartStorageV2[sessionId].splice(updateIndex, 1);
            log(`Removed item ${itemId} from cart ${sessionId}`);
          } else {
            // Update quantity
            global.cartStorageV2[sessionId][updateIndex].quantity = parseInt(newQuantity);
            log(`Updated item ${itemId} quantity to ${newQuantity} in cart ${sessionId}`);
          }
        } else {
          return res.status(404).json({
            success: false,
            error: 'Item not found in cart',
          });
        }

        const putTotals = calculateCartTotals(global.cartStorageV2[sessionId]);
        
        return res.status(200).json({
          success: true,
          items: global.cartStorageV2[sessionId],
          count: putTotals.totalItems,
          total: putTotals.subtotal,
        });

      case 'DELETE':
        // Remove item from cart
        const { itemId: deleteItemId } = req.body;
        
        if (!deleteItemId) {
          return res.status(400).json({
            success: false,
            error: 'Item ID is required',
          });
        }

        const deleteIndex = global.cartStorageV2[sessionId].findIndex(
          item => item.id === deleteItemId || item.productId === deleteItemId
        );

        if (deleteIndex >= 0) {
          global.cartStorageV2[sessionId].splice(deleteIndex, 1);
          log(`Removed item ${deleteItemId} from cart ${sessionId}`);
        } else {
          return res.status(404).json({
            success: false,
            error: 'Item not found in cart',
          });
        }

        const deleteTotals = calculateCartTotals(global.cartStorageV2[sessionId]);
        
        return res.status(200).json({
          success: true,
          items: global.cartStorageV2[sessionId],
          count: deleteTotals.totalItems,
          total: deleteTotals.subtotal,
        });

      default:
        return res.status(405).json({
          success: false,
          error: 'Method not allowed',
        });
    }
  } catch (error) {
    console.error('[CartAPI v2] Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
}
