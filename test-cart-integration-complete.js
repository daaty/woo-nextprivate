// TESTE DE INTEGRAÇÃO COMPLETA - Sistema de Carrinho com Armazenamento Persistente
const fs = require('fs');
const path = require('path');

console.log('🧪 TESTE DE INTEGRAÇÃO COMPLETA DO CARRINHO COM ARMAZENAMENTO PERSISTENTE');
console.log('=' * 80);

async function testCartIntegration() {
  let allTestsPassed = true;
  
  try {
    console.log('\n1️⃣ TESTANDO ADIÇÃO DE MÚLTIPLOS PRODUTOS...');
    
    // Simular adição de 6 produtos para testar o limite do cookie
    const productsToAdd = [
      { id: 143, name: 'Xiaomi Redmi Note 12', price: 899.99 },
      { id: 144, name: 'Xiaomi Mi Band 7', price: 299.99 },
      { id: 145, name: 'Xiaomi Poco X5 Pro', price: 1299.99 },
      { id: 146, name: 'Xiaomi Redmi Buds 4', price: 199.99 },
      { id: 147, name: 'Xiaomi Smart TV 55" 4K', price: 2199.99 },
      { id: 148, name: 'Xiaomi Robot Vacuum S10', price: 1599.99 }
    ];
    
    let sessionId = null;
    
    for (let i = 0; i < productsToAdd.length; i++) {
      const product = productsToAdd[i];
      
      console.log(`\n   📱 Adicionando produto ${i + 1}/6: ${product.name}`);
      
      const addResponse = await fetch('http://localhost:3000/api/cart/simple-add-improved', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': sessionId ? `cartSessionId=${sessionId}` : ''
        },
        body: JSON.stringify({
          product_id: product.id,
          quantity: 1,
          product_name: product.name,
          product_price: product.price,
          product_image: `https://example.com/images/product-${product.id}.jpg`
        })
      });
      
      if (!addResponse.ok) {
        console.log(`   ❌ Erro ao adicionar produto ${product.id}: ${addResponse.status}`);
        allTestsPassed = false;
        continue;
      }
      
      const addResult = await addResponse.json();
      
      // Capturar sessionId dos cookies de resposta se disponível
      const setCookieHeader = addResponse.headers.get('set-cookie');
      if (setCookieHeader && setCookieHeader.includes('cartSessionId=')) {
        const match = setCookieHeader.match(/cartSessionId=([^;]+)/);
        if (match) {
          sessionId = match[1];
          console.log(`   🔑 Session ID capturado: ${sessionId.substring(0, 8)}...`);
        }
      }
      
      if (addResult.success) {
        console.log(`   ✅ Produto adicionado! Carrinho agora tem ${addResult.cart?.totalItemTypes || 'N/A'} tipos de produtos`);
        console.log(`   💰 Total: ${addResult.cart?.total || 'N/A'}`);
        
        // Verificar se todos os itens estão sendo retornados na resposta
        if (addResult.cart?.items) {
          console.log(`   📦 Itens na resposta: ${addResult.cart.items.length}`);
          console.log(`   🍪 Itens no cookie: ${addResult.cart.itemsInCookie || addResult.cart.items.length}`);
          
          if (addResult.cart.hasMoreItems) {
            console.log(`   ⚠️ Cookie tem limitação, mas resposta contém todos os itens`);
          }
        }
      } else {
        console.log(`   ❌ Falha ao adicionar: ${addResult.message}`);
        allTestsPassed = false;
      }
      
      // Pequena pausa entre adições
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log('\n2️⃣ TESTANDO RECUPERAÇÃO DO CARRINHO...');
    
    // Testar se conseguimos recuperar todos os itens
    const getResponse = await fetch('http://localhost:3000/api/cart/simple-get', {
      headers: {
        'Cookie': sessionId ? `cartSessionId=${sessionId}` : ''
      }
    });
    
    if (getResponse.ok) {
      const cartData = await getResponse.json();
      
      console.log(`   📊 Carrinho recuperado:`);
      console.log(`   - Total de tipos de produtos: ${cartData.totalItemTypes || cartData.items?.length || 0}`);
      console.log(`   - Itens na resposta: ${cartData.items?.length || 0}`);
      console.log(`   - Total do carrinho: ${cartData.total || 'N/A'}`);
      console.log(`   - Fonte dos dados: ${cartData.dataSource || 'cookie'}`);
      
      if (cartData.items && cartData.items.length >= 4) {
        console.log(`   ✅ SUCESSO: Carrinho contém ${cartData.items.length} itens (mais de 3!)`);
        
        // Listar os primeiros itens para verificação
        console.log(`   📝 Primeiros itens:`);
        cartData.items.slice(0, 3).forEach((item, index) => {
          console.log(`      ${index + 1}. ${item.name} - ${item.quantity}x - R$ ${item.price}`);
        });
        
        if (cartData.items.length > 3) {
          console.log(`      ... e mais ${cartData.items.length - 3} itens`);
        }
        
      } else {
        console.log(`   ❌ PROBLEMA: Carrinho tem apenas ${cartData.items?.length || 0} itens`);
        allTestsPassed = false;
      }
      
      if (cartData.hasMoreItems) {
        console.log(`   🔍 Sistema detectou limitação de cookie mas manteve todos os dados`);
      }
      
    } else {
      console.log(`   ❌ Erro ao recuperar carrinho: ${getResponse.status}`);
      allTestsPassed = false;
    }
    
    console.log('\n3️⃣ VERIFICANDO SISTEMA DE ARMAZENAMENTO...');
    
    // Verificar se o arquivo de armazenamento foi criado
    const storageDir = path.join(__dirname, 'temp', 'cart-sessions');
    
    if (fs.existsSync(storageDir)) {
      const files = fs.readdirSync(storageDir);
      console.log(`   📁 Arquivos de sessão encontrados: ${files.length}`);
      
      if (sessionId) {
        const sessionFile = path.join(storageDir, `${sessionId}.json`);
        if (fs.existsSync(sessionFile)) {
          const sessionData = JSON.parse(fs.readFileSync(sessionFile, 'utf8'));
          console.log(`   ✅ Sessão ${sessionId.substring(0, 8)}... encontrada no armazenamento`);
          console.log(`   📦 Itens armazenados: ${sessionData.items?.length || 0}`);
          console.log(`   🕒 Última atualização: ${new Date(sessionData.lastUpdated).toLocaleString()}`);
        } else {
          console.log(`   ⚠️ Arquivo de sessão não encontrado para ${sessionId}`);
        }
      }
    } else {
      console.log(`   ⚠️ Diretório de armazenamento não existe: ${storageDir}`);
    }
    
    console.log('\n4️⃣ TESTANDO COMPONENTE MINICART...');
    
    // Verificar se o componente Minicart está configurado corretamente
    const minicartPath = path.join(__dirname, 'src', 'components', 'cart', 'Minicart.js');
    
    if (fs.existsSync(minicartPath)) {
      const minicartContent = fs.readFileSync(minicartPath, 'utf8');
      
      // Verificar se usa .map() sem limitação
      if (minicartContent.includes('cartData.items.map(') || minicartContent.includes('items.map(')) {
        console.log(`   ✅ Minicart configurado para exibir todos os itens`);
      } else {
        console.log(`   ⚠️ Minicart pode ter limitação na exibição de itens`);
      }
      
      // Verificar se há limitações como .slice(0, 3)
      if (minicartContent.includes('.slice(0, 3)') || minicartContent.includes('items.slice(0,3)')) {
        console.log(`   ❌ PROBLEMA: Minicart tem limitação de 3 itens no código`);
        allTestsPassed = false;
      }
      
    } else {
      console.log(`   ⚠️ Componente Minicart não encontrado em: ${minicartPath}`);
    }
    
  } catch (error) {
    console.log(`\n❌ ERRO DURANTE TESTE: ${error.message}`);
    allTestsPassed = false;
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('📋 RESULTADO FINAL:');
  
  if (allTestsPassed) {
    console.log('✅ TODOS OS TESTES PASSARAM!');
    console.log('🎉 O sistema de carrinho está funcionando corretamente');
    console.log('📦 Produtos acima de 3 itens devem aparecer na interface');
  } else {
    console.log('❌ ALGUNS TESTES FALHARAM');
    console.log('🔧 Verificar logs acima para identificar problemas');
  }
  
  console.log('\n📝 Próximos passos recomendados:');
  console.log('1. Testar no navegador adicionando mais de 3 produtos');
  console.log('2. Verificar se o minicart exibe todos os produtos');
  console.log('3. Verificar logs do servidor para erros');
  console.log('4. Confirmar que o total do carrinho está correto');
  
  return allTestsPassed;
}

// Executar teste
testCartIntegration().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.log(`\n💥 ERRO FATAL: ${error.message}`);
  process.exit(1);
});
