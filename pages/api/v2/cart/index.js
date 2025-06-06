/**
 * Simple Cart API Endpoint - v2 (Restored Clean Version)
 * Handles all cart operations through REST API only
 * RESTORED FROM WORKING VERSION - SIMPLE SESSION MANAGEMENT
 */

import { getProductData } from '../../../../src/v2/cart/services/wooCommerceIntegration.js';
const cartStorage = require('../../../../lib/cart-storage.cjs');
const { setupSQLitePermissions } = require('../../../../src/middleware/sqlitePermissions');
const { parse: parseCookie } = require('cookie');

// Simple logging
const log = (message, data = null) => {
  console.log(`[CartAPI v2] ${message}`);
  if (data) console.log(data);
};

/**
 * Get session ID from request - ENHANCED VERSION
 * Prioridade: Cookie > Header > Query Param > Novo ID
 */
const getSessionIdFromRequest = (req, res) => {
  // 1. Tentar obter do cookie
  const cookies = parseCookie(req.headers.cookie || '');
  let sessionId = cookies.cart_session_id;
  
  // 2. Tentar obter do header
  if (!sessionId) {
    sessionId = req.headers['x-cart-session-id'];
  }
  
  // 3. Tentar obter da query string
  if (!sessionId) {
    sessionId = req.query.sessionId;
  }

  // 4. Gerar novo ID se nenhum encontrado
  if (!sessionId) {
    sessionId = `cart_v2_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    log(`Generated new session: ${sessionId}`);
  }

  // Sempre definir/atualizar o cookie
  const cookie = `cart_session_id=${sessionId}; Path=/; Max-Age=2592000; SameSite=Strict; HttpOnly`;
  res.setHeader('Set-Cookie', cookie);
  
  return sessionId;
};

/**
 * Parse Brazilian price format to number
 */
const parseBrazilianPrice = (priceString) => {
  if (typeof priceString === 'number') return priceString;
  if (!priceString) return 0;
  
  console.log(`[CartAPI v2] Parsing price: "${priceString}" (${typeof priceString})`);
  
  // Clean the price string
  let cleanPrice = priceString
    .toString()
    .replace(/R\$\s*/g, '') // Remove R$ with optional space
    .replace(/&nbsp;/g, '') // Remove HTML non-breaking space
    .replace(/[^\d,.]/g, '') // Remove any non-digit, non-comma, non-dot characters
    .trim();
  
  console.log(`[CartAPI v2] Cleaned price: "${cleanPrice}"`);
  
  // Handle Brazilian format (e.g., "2.199,00" or "2199,00")
  let numericValue;
  if (cleanPrice.includes(',')) {
    // Has comma as decimal separator
    const parts = cleanPrice.split(',');
    if (parts.length === 2) {
      // Remove dots from integer part (thousands separator)
      const integerPart = parts[0].replace(/\./g, '');
      const decimalPart = parts[1];
      numericValue = parseFloat(`${integerPart}.${decimalPart}`);
    } else {
      numericValue = parseFloat(cleanPrice.replace(/\./g, '').replace(',', '.'));
    }
  } else if (cleanPrice.includes('.')) {
    // Check if it's thousands separator or decimal
    const dotIndex = cleanPrice.lastIndexOf('.');
    const afterDot = cleanPrice.substring(dotIndex + 1);
    
    if (afterDot.length === 2) {
      // Likely decimal separator (e.g., "2199.00")
      numericValue = parseFloat(cleanPrice);
    } else {
      // Likely thousands separator (e.g., "2.199")
      numericValue = parseFloat(cleanPrice.replace(/\./g, ''));
    }
  } else {
    // No separators, just digits
    numericValue = parseFloat(cleanPrice);
  }
  
  // Handle special case where price might be in cents (e.g., "2" should be "2.00")
  if (numericValue < 10 && !cleanPrice.includes(',') && !cleanPrice.includes('.')) {
    numericValue = numericValue; // Keep as is for now, might need adjustment
  }
  
  console.log(`[CartAPI v2] Final numeric value: ${numericValue}`);
  
  return numericValue || 0;
};

/**
 * Calculate cart totals
 */
const calculateCartTotals = (items) => {
  let subtotal = 0;
  let totalItems = 0;
  
  items.forEach(item => {
    // Use rawPrice if available, otherwise parse the formatted price
    const price = item.rawPrice || parseBrazilianPrice(item.price);
    subtotal += price * item.quantity;
    totalItems += item.quantity;
  });
  
  console.log(`[CartAPI v2] Cart totals - Subtotal: ${subtotal}, Total items: ${totalItems}`);
  
  return {
    subtotal: subtotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
    subtotalRaw: subtotal, // Raw number for calculations
    totalItems,
    itemCount: items.length
  };
};

/**
 * Create cart item with consistent format
 */
const createCartItem = (product, quantity = 1) => {
  const price = parseBrazilianPrice(product.price);
  
  console.log(`[CartAPI v2] Creating cart item for product: ${product.name}`);
  console.log(`[CartAPI v2] Raw price: "${product.price}", Parsed: ${price}`);
    // Debug o objeto product para ver sua estrutura
  console.log(`[CartAPI v2] Product object structure:`, JSON.stringify(product, null, 2));
  
  // Tratamento especial para a imagem - logging detalhado
  let imageUrl = null;
  if (typeof product.image === 'string') {
    // A imagem é uma string de URL direta
    imageUrl = product.image;
    console.log(`[CartAPI v2] Image found as direct string URL: ${imageUrl}`);
  } else if (product.image?.sourceUrl) {
    // A imagem é um objeto com sourceUrl
    imageUrl = product.image.sourceUrl;
    console.log(`[CartAPI v2] Image found in object.sourceUrl: ${imageUrl}`);
  } else {
    console.log(`[CartAPI v2] No valid image found, using null`);
  }
  
  return {
    id: product.id || `item_${Date.now()}`,
    productId: product.id,
    name: product.name || 'Produto',
    price: price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
    rawPrice: price, // Store raw numeric value for calculations
    quantity: parseInt(quantity) || 1,
    image: imageUrl,
    slug: product.slug || null,
    addedAt: new Date().toISOString(),
  };
};

/**
 * Main API handler
 */
export default async function handler(req, res) {
  // Garantir que as permissões do SQLite estejam corretas
  setupSQLitePermissions();
  
  const sessionId = getSessionIdFromRequest(req, res);

  try {
    switch (req.method) {
      case 'GET': {
        // Buscar carrinho no SQLite
        const cartItems = cartStorage.getCart(sessionId) || [];
        const totals = calculateCartTotals(cartItems);
        log(`GET cart for session ${sessionId}: ${cartItems.length} items`);
        return res.status(200).json({
          success: true,
          items: cartItems,
          count: totals.totalItems,
          total: totals.subtotal,
          session: sessionId,
        });
      }
      case 'POST': {
        const { product, quantity = 1 } = req.body;
        if (!product || !product.id) {
          return res.status(400).json({ success: false, error: 'Product data is required' });
        }        // Buscar carrinho atual
        let cartItems = cartStorage.getCart(sessionId) || [];
        // Verificar se item já existe
        const existingItemIndex = cartItems.findIndex(item => item.productId === product.id);
        if (existingItemIndex >= 0) {
          cartItems[existingItemIndex].quantity += parseInt(quantity);
          log(`Updated existing item ${product.id} in cart ${sessionId}`);        } else {
          const cartItem = createCartItem(product, quantity);
          cartItems.push(cartItem);
          log(`Added new item ${product.id} to cart ${sessionId}`);
        }
        cartStorage.saveCart(sessionId, cartItems);
        const postTotals = calculateCartTotals(cartItems);
        return res.status(200).json({
          success: true,
          items: cartItems,
          count: postTotals.totalItems,
          total: postTotals.subtotal,
          message: 'Product added to cart',
        });
      }
      case 'PUT': {
        const { itemId, quantity: newQuantity } = req.body;        if (!itemId || newQuantity === undefined) {
          return res.status(400).json({ success: false, error: 'Item ID and quantity are required' });
        }
        let cartItems = cartStorage.getCart(sessionId) || [];
        const updateIndex = cartItems.findIndex(item => item.id === itemId || item.productId === itemId);
        if (updateIndex >= 0) {
          if (parseInt(newQuantity) <= 0) {
            cartItems.splice(updateIndex, 1);
            log(`Removed item ${itemId} from cart ${sessionId}`);
          } else {            cartItems[updateIndex].quantity = parseInt(newQuantity);
            log(`Updated item ${itemId} quantity to ${newQuantity} in cart ${sessionId}`);
          }
          cartStorage.saveCart(sessionId, cartItems);
        } else {
          return res.status(404).json({ success: false, error: 'Item not found in cart' });
        }
        const putTotals = calculateCartTotals(cartItems);
        return res.status(200).json({
          success: true,
          items: cartItems,
          count: putTotals.totalItems,
          total: putTotals.subtotal,
        });
      }
      case 'DELETE': {
        const { itemId: deleteItemId } = req.body;        if (!deleteItemId) {
          return res.status(400).json({ success: false, error: 'Item ID is required' });
        }
        let cartItems = cartStorage.getCart(sessionId) || [];
        const deleteIndex = cartItems.findIndex(item => item.id === deleteItemId || item.productId === deleteItemId);
        if (deleteIndex >= 0) {          cartItems.splice(deleteIndex, 1);
          log(`Removed item ${deleteItemId} from cart ${sessionId}`);
          cartStorage.saveCart(sessionId, cartItems);
        } else {
          return res.status(404).json({ success: false, error: 'Item not found in cart' });
        }
        const deleteTotals = calculateCartTotals(cartItems);
        return res.status(200).json({
          success: true,
          items: cartItems,
          count: deleteTotals.totalItems,
          total: deleteTotals.subtotal,
        });
      }
      default:
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('[CartAPI v2] Error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error', message: error.message });
  }
}
