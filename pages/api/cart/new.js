/**
 * NOVO ENDPOINT UNIFICADO DO CARRINHO
 * API REST Pura - Substitui os 23 endpoints antigos
 */
import WooCommerceRestApi from "@woocommerce/woocommerce-rest-api"

// ========================
// CONFIGURAÇÃO WOOCOMMERCE
// ========================

const api = new WooCommerceRestApi({
  url: process.env.NEXT_PUBLIC_WORDPRESS_SITE_URL,
  consumerKey: process.env.WC_CONSUMER_KEY,
  consumerSecret: process.env.WC_CONSUMER_SECRET,
  version: "wc/v3"
})

// ========================
// HELPERS
// ========================

/**
 * Resposta padronizada de sucesso
 */
const successResponse = (data, message = 'Operação realizada com sucesso') => ({
  success: true,
  data,
  message
})

/**
 * Resposta padronizada de erro
 */
const errorResponse = (code, message, details = null) => ({
  success: false,
  error: {
    code,
    message,
    details
  }
})

/**
 * Transformar produto WooCommerce em CartItem
 */
const transformToCartItem = (wooProduct, quantity = 1) => ({
  id: `${wooProduct.id}_${Date.now()}`, // ID único para o carrinho
  productId: wooProduct.id,
  name: wooProduct.name,
  price: parseFloat(wooProduct.price),
  quantity: parseInt(quantity),
  image: wooProduct.images?.[0]?.src || null,
  variation: wooProduct.attributes || null
})

/**
 * Calcular totais do carrinho
 */
const calculateTotals = (items) => {
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  
  return {
    itemCount,
    subtotal,
    total: subtotal // Por enquanto, sem frete e impostos
  }
}

// ========================
// GERENCIAMENTO DE SESSÃO
// ========================

/**
 * Obter ID da sessão do carrinho
 */
const getCartSessionId = (req) => {
  // Primeira tentativa: cookie de sessão
  const sessionId = req.cookies?.cart_session_id
  
  if (sessionId) {
    return sessionId
  }
  
  // Segunda tentativa: header personalizado
  const headerSessionId = req.headers['x-cart-session']
  
  if (headerSessionId) {
    return headerSessionId
  }
  
  // Gerar nova sessão
  return `cart_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Salvar carrinho na sessão (simulado com variável global por enquanto)
 */
const cartSessions = new Map()

const saveCartSession = (sessionId, items) => {
  cartSessions.set(sessionId, {
    items,
    lastUpdated: Date.now()
  })
}

const getCartSession = (sessionId) => {
  return cartSessions.get(sessionId) || { items: [], lastUpdated: Date.now() }
}

// ========================
// OPERAÇÕES DO CARRINHO
// ========================

/**
 * Obter carrinho atual
 */
const getCart = async (req, res) => {
  try {
    const sessionId = getCartSessionId(req)
    const cart = getCartSession(sessionId)
    const totals = calculateTotals(cart.items)
    
    // Definir cookie de sessão se necessário
    if (!req.cookies?.cart_session_id) {
      res.setHeader('Set-Cookie', [
        `cart_session_id=${sessionId}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${60 * 60 * 24 * 7}` // 7 dias
      ])
    }
    
    return res.status(200).json(successResponse({
      items: cart.items,
      ...totals,
      sessionId
    }))
    
  } catch (error) {
    console.error('Erro ao obter carrinho:', error)
    return res.status(500).json(errorResponse(
      'GET_CART_ERROR',
      'Erro interno ao obter carrinho',
      error.message
    ))
  }
}

/**
 * Adicionar item ao carrinho
 */
const addToCart = async (req, res) => {
  try {
    const { product } = req.body
    
    if (!product || !product.id) {
      return res.status(400).json(errorResponse(
        'INVALID_PRODUCT',
        'Produto inválido'
      ))
    }
    
    // Buscar dados do produto no WooCommerce
    const wooProductResponse = await api.get(`products/${product.id}`)
    const wooProduct = wooProductResponse.data
    
    if (!wooProduct) {
      return res.status(404).json(errorResponse(
        'PRODUCT_NOT_FOUND',
        'Produto não encontrado'
      ))
    }
    
    // Verificar se produto está em estoque
    if (!wooProduct.in_stock && wooProduct.manage_stock) {
      return res.status(400).json(errorResponse(
        'OUT_OF_STOCK',
        'Produto fora de estoque'
      ))
    }
    
    const sessionId = getCartSessionId(req)
    const cart = getCartSession(sessionId)
    
    // Verificar se item já existe no carrinho
    const existingItemIndex = cart.items.findIndex(
      item => item.productId === product.id
    )
    
    if (existingItemIndex >= 0) {
      // Atualizar quantidade
      cart.items[existingItemIndex].quantity += product.quantity || 1
    } else {
      // Adicionar novo item
      const cartItem = transformToCartItem(wooProduct, product.quantity || 1)
      cart.items.push(cartItem)
    }
    
    saveCartSession(sessionId, cart.items)
    
    const totals = calculateTotals(cart.items)
    
    return res.status(200).json(successResponse({
      items: cart.items,
      ...totals
    }, 'Item adicionado ao carrinho'))
    
  } catch (error) {
    console.error('Erro ao adicionar ao carrinho:', error)
    return res.status(500).json(errorResponse(
      'ADD_TO_CART_ERROR',
      'Erro interno ao adicionar ao carrinho',
      error.message
    ))
  }
}

/**
 * Atualizar item do carrinho
 */
const updateCart = async (req, res) => {
  try {
    const { itemId, quantity } = req.body
    
    if (!itemId || quantity < 0) {
      return res.status(400).json(errorResponse(
        'INVALID_UPDATE_DATA',
        'Dados de atualização inválidos'
      ))
    }
    
    const sessionId = getCartSessionId(req)
    const cart = getCartSession(sessionId)
    
    const itemIndex = cart.items.findIndex(item => item.id === itemId)
    
    if (itemIndex === -1) {
      return res.status(404).json(errorResponse(
        'ITEM_NOT_FOUND',
        'Item não encontrado no carrinho'
      ))
    }
    
    if (quantity === 0) {
      // Remover item
      cart.items.splice(itemIndex, 1)
    } else {
      // Atualizar quantidade
      cart.items[itemIndex].quantity = parseInt(quantity)
    }
    
    saveCartSession(sessionId, cart.items)
    
    const totals = calculateTotals(cart.items)
    
    return res.status(200).json(successResponse({
      items: cart.items,
      ...totals
    }, 'Carrinho atualizado'))
    
  } catch (error) {
    console.error('Erro ao atualizar carrinho:', error)
    return res.status(500).json(errorResponse(
      'UPDATE_CART_ERROR',
      'Erro interno ao atualizar carrinho',
      error.message
    ))
  }
}

/**
 * Remover item do carrinho
 */
const removeFromCart = async (req, res) => {
  try {
    const { action, itemId } = req.body
    
    const sessionId = getCartSessionId(req)
    const cart = getCartSession(sessionId)
    
    if (action === 'clear') {
      // Limpar carrinho completo
      cart.items = []
    } else if (action === 'remove' && itemId) {
      // Remover item específico
      const itemIndex = cart.items.findIndex(item => item.id === itemId)
      
      if (itemIndex === -1) {
        return res.status(404).json(errorResponse(
          'ITEM_NOT_FOUND',
          'Item não encontrado no carrinho'
        ))
      }
      
      cart.items.splice(itemIndex, 1)
    } else {
      return res.status(400).json(errorResponse(
        'INVALID_REMOVE_ACTION',
        'Ação de remoção inválida'
      ))
    }
    
    saveCartSession(sessionId, cart.items)
    
    const totals = calculateTotals(cart.items)
    
    return res.status(200).json(successResponse({
      items: cart.items,
      ...totals
    }, 'Item removido do carrinho'))
    
  } catch (error) {
    console.error('Erro ao remover do carrinho:', error)
    return res.status(500).json(errorResponse(
      'REMOVE_FROM_CART_ERROR',
      'Erro interno ao remover do carrinho',
      error.message
    ))
  }
}

// ========================
// HANDLER PRINCIPAL
// ========================

export default async function handler(req, res) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Cart-Session')
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }
  
  try {
    switch (req.method) {
      case 'GET':
        return await getCart(req, res)
      
      case 'POST':
        return await addToCart(req, res)
      
      case 'PUT':
        return await updateCart(req, res)
      
      case 'DELETE':
        return await removeFromCart(req, res)
      
      default:
        return res.status(405).json(errorResponse(
          'METHOD_NOT_ALLOWED',
          `Método ${req.method} não permitido`
        ))
    }
  } catch (error) {
    console.error('Erro no handler do carrinho:', error)
    return res.status(500).json(errorResponse(
      'INTERNAL_SERVER_ERROR',
      'Erro interno do servidor',
      error.message
    ))
  }
}
