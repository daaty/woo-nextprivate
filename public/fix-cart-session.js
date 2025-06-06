/**
 * Cart v2 Session Fix Script
 * 
 * Este script garante consistência entre as sessões do carrinho adicionadas na API
 * e as sessões usadas para visualizar o carrinho. Ele deve resolver o problema de
 * produtos que são adicionados com sucesso mas não aparecem na página do carrinho.
 */
(function() {
  console.log('🔄 Iniciando correção de sessão do carrinho v2...');
  
  // 1. Verificar e garantir ID de sessão consistente
  function ensureConsistentSessionId() {
    const currentSessionId = localStorage.getItem('cart_v2_session_id');
    
    if (!currentSessionId) {
      console.log('⚠️ Nenhum ID de sessão encontrado! Criando novo...');
      const newSessionId = `cart_v2_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('cart_v2_session_id', newSessionId);
      console.log('✅ Novo ID de sessão criado:', newSessionId);
      return newSessionId;
    }
    
    console.log('✓ ID de sessão existente:', currentSessionId);
    return currentSessionId;
  }
  
  // 2. Realizar um teste básico de carrinho
  async function testCartConnection(sessionId) {
    try {
      console.log('🔍 Testando conexão com API do carrinho...');
      
      const response = await fetch('/api/v2/cart', {
        headers: {
          'Content-Type': 'application/json',
          'X-Cart-Session-Id': sessionId
        }
      });
      
      if (!response.ok) {
        throw new Error(`Erro na API: ${response.status}`);
      }
      
      const cartData = await response.json();
      console.log('✅ Conexão com API do carrinho estabelecida!');
      console.log(`📊 Itens encontrados no carrinho: ${cartData.items?.length || 0}`);
      
      return {
        success: true,
        itemCount: cartData.items?.length || 0,
        items: cartData.items || []
      };
    } catch (error) {
      console.error('❌ Erro ao conectar com API do carrinho:', error);
      return { success: false, error: error.message };
    }
  }
  
  // 3. Adicionar um item de teste ao carrinho
  async function addTestItemIfEmpty(sessionId, currentItems) {
    // Se já existem itens, não adiciona item de teste
    if (currentItems && currentItems.length > 0) {
      console.log('✅ Carrinho já contém itens. Não é necessário adicionar item de teste.');
      return { success: true, skipAdding: true };
    }
    
    try {
      console.log('🛒 Adicionando item de teste ao carrinho...');
      
      const testProduct = {
        id: 'test-fix-' + Date.now(),
        name: 'Produto Teste (Correção)',
        price: 'R$ 1,00',
        image: null
      };
      
      const response = await fetch('/api/v2/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Cart-Session-Id': sessionId
        },
        body: JSON.stringify({
          product: testProduct,
          quantity: 1
        })
      });
      
      if (!response.ok) {
        throw new Error(`Erro ao adicionar produto: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('✅ Item de teste adicionado com sucesso!');
      console.log(`📊 Itens no carrinho após adição: ${result.items?.length || 0}`);
      
      return { success: true, addedItem: true, itemCount: result.items?.length || 0 };
    } catch (error) {
      console.error('❌ Erro ao adicionar item de teste:', error);
      return { success: false, error: error.message };
    }
  }

  // 4. Notificar o usuário
  function notifyUser(message, isError = false) {
    // Criar elemento de notificação
    const notification = document.createElement('div');
    notification.style.position = 'fixed';
    notification.style.bottom = '20px';
    notification.style.right = '20px';
    notification.style.padding = '15px 20px';
    notification.style.borderRadius = '8px';
    notification.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
    notification.style.zIndex = '9999';
    notification.style.fontFamily = 'Arial, sans-serif';
    notification.style.fontSize = '14px';
    notification.style.transition = 'all 0.3s ease';
    
    // Aplicar cores com base no tipo
    if (isError) {
      notification.style.backgroundColor = '#FEE2E2';
      notification.style.color = '#B91C1C';
      notification.style.border = '1px solid #F87171';
      message = '❌ ' + message;
    } else {
      notification.style.backgroundColor = '#D1FAE5';
      notification.style.color = '#047857';
      notification.style.border = '1px solid #6EE7B7';
      message = '✅ ' + message;
    }
    
    notification.textContent = message;
    
    // Adicionar ao body
    document.body.appendChild(notification);
    
    // Remover após alguns segundos
    setTimeout(() => {
      notification.style.opacity = '0';
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    }, 5000);
  }
  
  // Função principal
  async function main() {
    // 1. Garantir consistência de sessão
    const sessionId = ensureConsistentSessionId();
    
    // 2. Testar conexão com a API
    const connectionTest = await testCartConnection(sessionId);
    
    if (!connectionTest.success) {
      notifyUser('Não foi possível conectar ao carrinho. Atualize a página.', true);
      return;
    }
    
    // 3. Adicionar item de teste se necessário
    if (connectionTest.itemCount === 0) {
      const addItemResult = await addTestItemIfEmpty(sessionId, connectionTest.items);
      
      if (!addItemResult.success) {
        notifyUser('Erro ao testar adição de produtos ao carrinho.', true);
        return;
      }
      
      if (addItemResult.addedItem) {
        notifyUser('Correção aplicada! Um item teste foi adicionado ao carrinho para verificação.');
      }
    } else {
      notifyUser(`Conexão com carrinho estabelecida. ${connectionTest.itemCount} produtos encontrados.`);
    }
    
    // 4. Informar que é necessário recarregar as páginas para aplicar as correções
    console.log('⚠️ IMPORTANTE: Pode ser necessário recarregar a página para ver os itens do carrinho.');
    console.log('🔄 Correção de sessão do carrinho v2 concluída!');
  }
  
  // Executar script principal quando o documento estiver pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', main);
  } else {
    main();
  }
})();
