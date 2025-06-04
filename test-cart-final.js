// Teste final do carrinho - verificação completa

console.log('🧪 TESTE FINAL DO CARRINHO - CORREÇÃO COMPLETA\n');

const testConfig = {
  baseUrl: 'http://localhost:3000',
  testProducts: [
    { id: 1234, name: 'Xiaomi Mi 11', price: 899.99 },
    { id: 1235, name: 'Xiaomi Mi 12', price: 999.99 },
    { id: 1236, name: 'Xiaomi Mi 13', price: 1099.99 },
    { id: 1237, name: 'Redmi Note 11', price: 699.99 },
    { id: 1238, name: 'Redmi Note 12', price: 799.99 }
  ]
};

async function testCartAPI() {
  console.log('1️⃣ Testando APIs do carrinho...\n');
  
  try {
    // Teste da API simple-add
    console.log('   📝 Testando simple-add.js...');
    const addResponse = await fetch(`${testConfig.baseUrl}/api/cart/simple-add`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        product_id: testConfig.testProducts[0].id,
        quantity: 1,
        product_name: testConfig.testProducts[0].name,
        product_price: testConfig.testProducts[0].price
      })
    });
    
    if (addResponse.ok) {
      const addResult = await addResponse.json();
      console.log('   ✅ API simple-add funcionando');
      console.log('   📊 Resposta:', { 
        success: addResult.success, 
        itemsCount: addResult.cart?.itemsCount || 0 
      });
    } else {
      console.log('   ❌ API simple-add com erro:', addResponse.status);
      const errorText = await addResponse.text();
      console.log('   📝 Detalhes:', errorText.substring(0, 200));
    }
    
    // Teste da API simple-get
    console.log('\n   📝 Testando simple-get.js...');
    const getResponse = await fetch(`${testConfig.baseUrl}/api/cart/simple-get`);
    
    if (getResponse.ok) {
      const getResult = await getResponse.json();
      console.log('   ✅ API simple-get funcionando');
      console.log('   📊 Resposta:', { 
        success: getResult.success, 
        itemsCount: getResult.cart?.itemsCount || 0 
      });
    } else {
      console.log('   ❌ API simple-get com erro:', getResponse.status);
      const errorText = await getResponse.text();
      console.log('   📝 Detalhes:', errorText.substring(0, 200));
    }
    
  } catch (error) {
    console.log('❌ Erro ao testar APIs:', error.message);
    console.log('💡 Certifique-se de que o servidor Next.js está rodando em http://localhost:3000');
  }
}

async function testMultipleProducts() {
  console.log('\n2️⃣ Testando adição de múltiplos produtos...\n');
  
  try {
    console.log('   🛒 Adicionando 5 produtos ao carrinho...');
    
    for (let i = 0; i < testConfig.testProducts.length; i++) {
      const product = testConfig.testProducts[i];
      
      console.log(`   📱 Produto ${i + 1}/5: ${product.name}`);
      
      const response = await fetch(`${testConfig.baseUrl}/api/cart/simple-add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          product_id: product.id,
          quantity: 1,
          product_name: product.name,
          product_price: product.price
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log(`      ✅ Adicionado - Total: ${result.cart?.itemsCount || 0} itens`);
        
        // Verificar se há informações sobre limitação de cookie
        if (result.cart?.hasMoreItems) {
          console.log(`      ⚠️ Cookie limitado - ${result.cart.itemsInCookie} itens no cookie, ${result.cart.totalItemTypes} total`);
        }
      } else {
        console.log(`      ❌ Erro ${response.status} ao adicionar produto ${product.name}`);
      }
      
      // Pequena pausa entre requisições
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Verificar carrinho final
    console.log('\n   📦 Verificando carrinho final...');
    const finalResponse = await fetch(`${testConfig.baseUrl}/api/cart/simple-get`);
    
    if (finalResponse.ok) {
      const finalResult = await finalResponse.json();
      const cart = finalResult.cart;
      
      console.log('   ✅ Carrinho final:');
      console.log(`      📊 Itens na resposta: ${cart.items?.length || 0}`);
      console.log(`      📊 Total de tipos: ${cart.totalItemTypes || 0}`);
      console.log(`      💰 Total: ${cart.total || 'R$ 0,00'}`);
      console.log(`      🍪 Itens no cookie: ${cart.itemsInCookie || cart.items?.length || 0}`);
      console.log(`      ⚠️ Tem mais itens: ${cart.hasMoreItems ? 'Sim' : 'Não'}`);
      console.log(`      🔍 Todos incluídos: ${cart.allItemsIncluded ? 'Sim' : 'Não'}`);
      
      // Verificar se todos os produtos aparecem na resposta
      if (cart.items && cart.items.length >= 5) {
        console.log('\n   🎉 SUCESSO! Todos os 5 produtos aparecem na resposta da API');
      } else if (cart.totalItemTypes >= 5) {
        console.log('\n   ✅ Sistema rastreando 5 produtos corretamente (mesmo com cookie limitado)');
      } else {
        console.log('\n   ⚠️ Apenas', cart.items?.length || 0, 'produtos na resposta');
      }
      
      console.log('\n   📝 Primeiros itens do carrinho:');
      (cart.items || []).slice(0, 3).forEach((item, index) => {
        console.log(`      ${index + 1}. ${item.name} - R$ ${item.price} (Qty: ${item.quantity})`);
      });
      
    } else {
      console.log('   ❌ Erro ao verificar carrinho final:', finalResponse.status);
    }
    
  } catch (error) {
    console.log('❌ Erro no teste de múltiplos produtos:', error.message);
  }
}

async function runTests() {
  console.log('🚀 Iniciando testes do carrinho...\n');
  
  await testCartAPI();
  await testMultipleProducts();
  
  console.log('\n✅ TESTES CONCLUÍDOS');
  console.log('\n📋 RESULTADO ESPERADO:');
  console.log('   - APIs funcionando sem erros de compilação');
  console.log('   - Todos os 5 produtos aparecem na resposta da API');
  console.log('   - Sistema lida com limite de cookie automaticamente');
  console.log('   - Minicart deve mostrar todos os produtos adicionados');
  
  console.log('\n🎯 PRÓXIMOS PASSOS:');
  console.log('   1. Testar no navegador: página Xiaomi');
  console.log('   2. Adicionar mais de 3 produtos');
  console.log('   3. Verificar se todos aparecem no minicart');
}

// Executar testes
runTests().catch(console.error);
