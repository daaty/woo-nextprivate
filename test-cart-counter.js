/**
 * Script para testar o contador do carrinho
 * Execute no console do navegador para verificar se está funcionando
 */

console.log('🧪 [TESTE] Testando contador do carrinho...');

// 1. Verificar se os eventos estão sendo disparados
let eventCount = 0;
const eventListener = (e) => {
  eventCount++;
  console.log(`📡 [TESTE] Evento ${eventCount} recebido:`, e.type, e.detail);
};

window.addEventListener('productAddedToCart', eventListener);
window.addEventListener('cartUpdated', eventListener);

// 2. Simular adição de produto
console.log('🛒 [TESTE] Simulando adição de produto...');

fetch('/api/cart/simple-add', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    product_id: 137,
    quantity: 1,
    product_name: 'Produto Teste',
    product_price: 100.00
  })
})
.then(response => response.json())
.then(data => {
  console.log('✅ [TESTE] Produto adicionado:', data);
  
  // Disparar evento manualmente para testar
  window.dispatchEvent(new CustomEvent('productAddedToCart', {
    detail: {
      productId: 137,
      productName: 'Produto Teste',
      quantity: 1,
      timestamp: Date.now()
    }
  }));
  
  // 3. Verificar contador atual
  setTimeout(() => {
    fetch('/api/cart/simple-get')
      .then(response => response.json())
      .then(cartData => {
        console.log('📊 [TESTE] Dados atuais do carrinho:', cartData);
        console.log('🔢 [TESTE] Contador no DOM:', document.querySelector('.Layout_cartCount__PzqLI')?.textContent);
        
        // Cleanup
        window.removeEventListener('productAddedToCart', eventListener);
        window.removeEventListener('cartUpdated', eventListener);
        
        console.log('✅ [TESTE] Teste concluído!');
      });
  }, 1000);
})
.catch(error => {
  console.error('❌ [TESTE] Erro:', error);
});
