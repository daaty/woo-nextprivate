/**
 * Global Cart Counter Bridge
 * 
 * Este script cria uma ponte para atualizar o contador do carrinho 
 * a partir de scripts JS vanilla (como botões dinamicamente gerados).
 * 
 * Deve ser importado em _app.js ou onde o CartProvider estiver sendo usado.
 */

(function() {
  if (typeof window === 'undefined') return;
  
  console.log('[GlobalCartCounter] Inicializando ponte para contador do carrinho...');
  
  // Função para atualizar o contador do carrinho
  window.updateCartCount = async function() {
    try {
      // Tenta obter o contador atual do carrinho via API
      const response = await fetch('/api/v2/cart', {
        headers: {
          'Content-Type': 'application/json',
          'X-Cart-Session-Id': localStorage.getItem('cart_v2_session_id') || ''
        }
      });
      
      if (!response.ok) {
        throw new Error(`Erro na API: ${response.status}`);
      }
      
      const cartData = await response.json();
      const itemCount = cartData.count || 0;
      
      // Atualizar qualquer elemento na página com a classe .cart-count
      const countElements = document.querySelectorAll('.cart-count, .cart-badge');
      countElements.forEach(element => {
        element.textContent = itemCount.toString();
        
        // Se o contador for zero, adicionar classe para esconder
        if (itemCount === 0) {
          element.classList.add('empty');
        } else {
          element.classList.remove('empty');
        }
      });
      
      // Atualizar o atributo data-count em qualquer elemento relacionado ao carrinho
      const cartElements = document.querySelectorAll('[data-cart-counter]');
      cartElements.forEach(element => {
        element.setAttribute('data-count', itemCount.toString());
      });
      
      // Disparar evento para que outros componentes possam reagir
      window.dispatchEvent(new CustomEvent('cartCountUpdated', { 
        detail: { count: itemCount }
      }));
      
      console.log(`[GlobalCartCounter] Contador atualizado: ${itemCount}`);
      
      return { success: true, count: itemCount };
    } catch (error) {
      console.error('[GlobalCartCounter] Erro ao atualizar contador:', error);
      return { success: false, error: error.message };
    }
  };
  
  // Atualizar o contador ao carregar a página
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', window.updateCartCount);
  } else {
    window.updateCartCount();
  }
  
  // Atualizar contador quando o evento cartUpdated for disparado
  window.addEventListener('cartUpdated', function() {
    setTimeout(window.updateCartCount, 500);
  });
  
  // Atualizar contador quando o evento productAddedToCart for disparado
  window.addEventListener('productAddedToCart', function() {
    setTimeout(window.updateCartCount, 500);
  });
  
  console.log('[GlobalCartCounter] Ponte para contador do carrinho inicializada!');
})();
