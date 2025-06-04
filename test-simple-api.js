// TESTE SIMPLES DA API DE CARRINHO
const { execSync } = require('child_process');

console.log('🧪 TESTE SIMPLES DA API DO CARRINHO');
console.log('================================');

async function testSimpleAPI() {
  try {
    console.log('\n1️⃣ Testando API original (simple-add)...');
    
    const response = await fetch('http://localhost:3000/api/cart/simple-add', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        product_id: 143,
        quantity: 1,
        product_name: 'Produto Teste',
        product_price: 100.00
      })
    });
    
    console.log(`   Status: ${response.status}`);
    
    if (response.ok) {
      const result = await response.json();
      console.log(`   ✅ Sucesso: ${result.message}`);
      console.log(`   📦 Total de itens: ${result.cart?.items?.length || 'N/A'}`);
    } else {
      const error = await response.text();
      console.log(`   ❌ Erro: ${error}`);
    }
    
  } catch (error) {
    console.log(`   💥 Erro na requisição: ${error.message}`);
  }
  
  try {
    console.log('\n2️⃣ Testando API melhorada (simple-add-improved)...');
    
    const response2 = await fetch('http://localhost:3000/api/cart/simple-add-improved', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        product_id: 144,
        quantity: 1,
        product_name: 'Produto Teste 2',
        product_price: 200.00
      })
    });
    
    console.log(`   Status: ${response2.status}`);
    
    if (response2.ok) {
      const result2 = await response2.json();
      console.log(`   ✅ Sucesso: ${result2.message}`);
      console.log(`   📦 Total de itens: ${result2.cart?.items?.length || 'N/A'}`);
    } else {
      const error2 = await response2.text();
      console.log(`   ❌ Erro: ${error2}`);
    }
    
  } catch (error) {
    console.log(`   💥 Erro na requisição: ${error.message}`);
  }
  
  try {
    console.log('\n3️⃣ Verificando se arquivo cart-storage.js existe...');
    
    const fs = require('fs');
    const path = require('path');
    
    const cartStoragePath = path.join(__dirname, 'lib', 'cart-storage.js');
    
    if (fs.existsSync(cartStoragePath)) {
      console.log(`   ✅ Arquivo cart-storage.js encontrado`);
      
      // Verificar se as funções estão exportadas corretamente
      try {
        const { saveCompleteCart, getCompleteCart } = require('./lib/cart-storage');
        console.log(`   ✅ Funções exportadas corretamente`);
        console.log(`   - saveCompleteCart: ${typeof saveCompleteCart}`);
        console.log(`   - getCompleteCart: ${typeof getCompleteCart}`);
      } catch (requireError) {
        console.log(`   ❌ Erro ao importar: ${requireError.message}`);
      }
      
    } else {
      console.log(`   ❌ Arquivo cart-storage.js não encontrado em: ${cartStoragePath}`);
    }
    
  } catch (error) {
    console.log(`   💥 Erro na verificação: ${error.message}`);
  }
}

testSimpleAPI();
