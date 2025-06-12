/**
 * Cart v2 CartProvider Patch
 * 
 * Este script modifica o CartProvider para garantir consistência no ID de sessão
 * entre as operações de adicionar produtos e visualizar o carrinho.
 * 
 * Como aplicar: Importe este script na sua aplicação Next.js:
 * 1. Adicione ao _app.js: import '../public/fix-cart-provider.js';
 * 2. Ou inclua via tag script no documento HTML
 */

(function() {
  // Esperar o DOM estar pronto
  if (typeof window === 'undefined') return;
  
  console.log('[CartProvider Patch] Inicializando patch para CartProvider...');
  
  // Função para garantir sessão consistente
  function ensureConsistentSession() {
    let sessionId = localStorage.getItem('cart_v2_session_id');
    
    if (!sessionId) {
      // Gerar novo ID de sessão
      sessionId = `cart_v2_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('cart_v2_session_id', sessionId);
      console.log('[CartProvider Patch] Criado novo ID de sessão:', sessionId);
    } else {
      console.log('[CartProvider Patch] Usando ID de sessão existente:', sessionId);
    }
    
    // Garantir que as flags de feature estão ativas
    localStorage.setItem('NEXT_PUBLIC_CART_V2_ENABLED', 'true');
    localStorage.setItem('NEXT_PUBLIC_CART_V2_API', 'true');
    localStorage.setItem('NEXT_PUBLIC_CART_V2_PERCENTAGE', '100');
    
    return sessionId;
  }
  
  // Interceptar requisições fetch para adicionar o sessionId
  const originalFetch = window.fetch;
  
  window.fetch = function(...args) {
    // Se for uma requisição para a API do carrinho
    if (args[0] && typeof args[0] === 'string' && args[0].includes('/api/v2/cart')) {
      const sessionId = ensureConsistentSession();
      
      // Adicionar cabeçalho com sessionId
      if (args[1] && typeof args[1] === 'object') {
        args[1].headers = args[1].headers || {};
        args[1].headers['X-Cart-Session-Id'] = sessionId;
      }
    }
    
    // Chamar o fetch original
    return originalFetch.apply(this, args);
  };
  
  console.log('[CartProvider Patch] Patch aplicado com sucesso!');
  
  // Executar imediatamente para garantir sessão
  ensureConsistentSession();
})();
