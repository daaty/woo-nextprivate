/**
 * NOVO SISTEMA DE CARRINHO - VERSÃO RECONSTRUÍDA
 * Context Provider Simplificado com Single Source of Truth
 */
import React, { createContext, useContext, useReducer, useEffect } from 'react'

// ========================
// TIPOS E INTERFACES
// ========================

/**
 * @typedef {Object} CartItem
 * @property {string} id - ID único do item no carrinho
 * @property {number} productId - ID do produto no WooCommerce
 * @property {string} name - Nome do produto
 * @property {number} price - Preço unitário
 * @property {number} quantity - Quantidade
 * @property {string} [image] - URL da imagem do produto
 * @property {Object} [variation] - Variações do produto
 */

/**
 * @typedef {Object} CartState
 * @property {CartItem[]} items - Lista de items no carrinho
 * @property {number} itemCount - Quantidade total de items
 * @property {number} subtotal - Subtotal (sem frete e impostos)
 * @property {number} total - Total final
 * @property {boolean} isLoading - Estado de carregamento
 * @property {string|null} error - Mensagem de erro atual
 * @property {number} lastUpdated - Timestamp da última atualização
 */

// ========================
// ESTADO INICIAL
// ========================

const initialState = {
  items: [],
  itemCount: 0,
  subtotal: 0,
  total: 0,
  isLoading: false,
  error: null,
  lastUpdated: Date.now()
}

// ========================
// REDUCER
// ========================

const cartReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { 
        ...state, 
        isLoading: action.payload,
        error: null 
      }
    
    case 'SET_ITEMS':
      const items = action.payload || []
      const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)
      const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
      
      return {
        ...state,
        items,
        itemCount,
        subtotal,
        total: subtotal, // Por enquanto igual ao subtotal
        isLoading: false,
        error: null,
        lastUpdated: Date.now()
      }
    
    case 'SET_ERROR':
      return { 
        ...state, 
        error: action.payload, 
        isLoading: false 
      }
    
    case 'CLEAR_CART':
      return { 
        ...initialState,
        lastUpdated: Date.now()
      }
    
    case 'UPDATE_TOTALS':
      const currentItems = state.items
      const currentItemCount = currentItems.reduce((sum, item) => sum + item.quantity, 0)
      const currentSubtotal = currentItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
      
      return {
        ...state,
        itemCount: currentItemCount,
        subtotal: currentSubtotal,
        total: currentSubtotal,
        lastUpdated: Date.now()
      }
    
    default:
      return state
  }
}

// ========================
// CONTEXT
// ========================

const NewCartContext = createContext(null)

// ========================
// PROVIDER
// ========================

export const NewCartProvider = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState)
  
  // ========================
  // AÇÕES DO CARRINHO
  // ========================
  
  const actions = {
    // Adicionar item ao carrinho
    addItem: async (product) => {
      dispatch({ type: 'SET_LOADING', payload: true })
      
      try {
        const response = await fetch('/api/cart/new', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'add',
            product
          })
        })
        
        const result = await response.json()
        
        if (result.success) {
          dispatch({ type: 'SET_ITEMS', payload: result.data.items })
        } else {
          dispatch({ type: 'SET_ERROR', payload: result.error.message })
        }
      } catch (error) {
        dispatch({ type: 'SET_ERROR', payload: 'Erro ao adicionar item ao carrinho' })
      }
    },
    
    // Remover item do carrinho
    removeItem: async (itemId) => {
      dispatch({ type: 'SET_LOADING', payload: true })
      
      try {
        const response = await fetch('/api/cart/new', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'remove',
            itemId
          })
        })
        
        const result = await response.json()
        
        if (result.success) {
          dispatch({ type: 'SET_ITEMS', payload: result.data.items })
        } else {
          dispatch({ type: 'SET_ERROR', payload: result.error.message })
        }
      } catch (error) {
        dispatch({ type: 'SET_ERROR', payload: 'Erro ao remover item do carrinho' })
      }
    },
    
    // Atualizar quantidade
    updateQuantity: async (itemId, quantity) => {
      if (quantity <= 0) {
        return actions.removeItem(itemId)
      }
      
      dispatch({ type: 'SET_LOADING', payload: true })
      
      try {
        const response = await fetch('/api/cart/new', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'update',
            itemId,
            quantity
          })
        })
        
        const result = await response.json()
        
        if (result.success) {
          dispatch({ type: 'SET_ITEMS', payload: result.data.items })
        } else {
          dispatch({ type: 'SET_ERROR', payload: result.error.message })
        }
      } catch (error) {
        dispatch({ type: 'SET_ERROR', payload: 'Erro ao atualizar quantidade' })
      }
    },
    
    // Limpar carrinho
    clearCart: async () => {
      dispatch({ type: 'SET_LOADING', payload: true })
      
      try {
        const response = await fetch('/api/cart/new', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'clear'
          })
        })
        
        const result = await response.json()
        
        if (result.success) {
          dispatch({ type: 'CLEAR_CART' })
        } else {
          dispatch({ type: 'SET_ERROR', payload: result.error.message })
        }
      } catch (error) {
        dispatch({ type: 'SET_ERROR', payload: 'Erro ao limpar carrinho' })
      }
    },
    
    // Carregar carrinho do servidor
    loadCart: async () => {
      dispatch({ type: 'SET_LOADING', payload: true })
      
      try {
        const response = await fetch('/api/cart/new')
        const result = await response.json()
        
        if (result.success) {
          dispatch({ type: 'SET_ITEMS', payload: result.data.items })
        } else {
          dispatch({ type: 'SET_ERROR', payload: result.error.message })
        }
      } catch (error) {
        dispatch({ type: 'SET_ERROR', payload: 'Erro ao carregar carrinho' })
      }
    },
    
    // Limpar erro
    clearError: () => {
      dispatch({ type: 'SET_ERROR', payload: null })
    }
  }
  
  // ========================
  // EFEITOS
  // ========================
  
  // Carregar carrinho na inicialização
  useEffect(() => {
    actions.loadCart()
  }, [])
  
  // ========================
  // VALOR DO CONTEXTO
  // ========================
  
  const contextValue = {
    // Estado
    ...state,
    
    // Ações
    ...actions,
    
    // Computed properties
    isEmpty: state.items.length === 0,
    hasItems: state.items.length > 0
  }
  
  return (
    <NewCartContext.Provider value={contextValue}>
      {children}
    </NewCartContext.Provider>
  )
}

// ========================
// HOOK CUSTOMIZADO
// ========================

export const useNewCart = () => {
  const context = useContext(NewCartContext)
  
  if (!context) {
    throw new Error('useNewCart must be used within a NewCartProvider')
  }
  
  return context
}

export default NewCartContext
