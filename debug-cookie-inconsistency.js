// Debug: Inconsistência entre salvar e ler cookie
// Filepath: f:\Site Felipe\next-react-site\woo-next\debug-cookie-inconsistency.js

const testConfig = {
  baseUrl: 'http://localhost:3000',
  testProduct: { id: 9999, name: 'Debug Test Product', price: 123.45 }
};

async function debugCookieFlow() {
  console.log('🔍 DEBUGANDO INCONSISTÊNCIA DO COOKIE\n');
  
  try {
    // 1. Adicionar um produto e capturar o cookie
    console.log('1️⃣ Adicionando produto para debug...');
    const addResponse = await fetch(`${testConfig.baseUrl}/api/cart/simple-add`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        product_id: testConfig.testProduct.id,
        quantity: 1,
        product_name: testConfig.testProduct.name,
        product_price: testConfig.testProduct.price
      })
    });
    
    const addResult = await addResponse.json();
    const setCookieHeader = addResponse.headers.get('set-cookie');
    
    console.log('📊 Resposta do ADD:', {
      success: addResult.success,
      itemsCount: addResult.cart?.itemsCount || 0,
      totalItemTypes: addResult.cart?.totalItemTypes || 0
    });
    
    console.log('🍪 Cookie definido:', setCookieHeader ? 'SIM' : 'NÃO');
    
    if (setCookieHeader) {
      // Extrair valor do cookie
      const cookieMatch = setCookieHeader.match(/simple_cart=([^;]+)/);
      if (cookieMatch) {
        const cookieValue = decodeURIComponent(cookieMatch[1]);
        console.log('📝 Conteúdo do cookie:');
        console.log(cookieValue.substring(0, 200) + (cookieValue.length > 200 ? '...' : ''));
        
        try {
          const parsedCookie = JSON.parse(cookieValue);
          console.log('🔍 Cookie parseado:', {
            itemsLength: parsedCookie.items?.length || 0,
            items_count: parsedCookie.items_count,
            total: parsedCookie.total,
            totalItemTypes: parsedCookie.totalItemTypes
          });
        } catch (parseError) {
          console.log('❌ Erro ao parsear cookie:', parseError.message);
        }
      }
    }
    
    // 2. Simular uma requisição GET com o mesmo cookie
    console.log('\n2️⃣ Testando GET com o cookie...');
    
    const cookieForGet = setCookieHeader ? setCookieHeader.split(';')[0] : '';
    
    const getResponse = await fetch(`${testConfig.baseUrl}/api/cart/simple-get`, {
      headers: {
        'Cookie': cookieForGet
      }
    });
    
    const getResult = await getResponse.json();
    
    console.log('📊 Resposta do GET:', {
      success: getResult.success,
      itemsCount: getResult.cart?.itemsCount || 0,
      itemsLength: getResult.cart?.items?.length || 0,
      totalItemTypes: getResult.cart?.totalItemTypes || 0
    });
    
    // 3. Comparar resultados
    console.log('\n3️⃣ ANÁLISE DA INCONSISTÊNCIA:');
    
    if (addResult.cart?.itemsCount > 0 && getResult.cart?.itemsCount === 0) {
      console.log('❌ INCONSISTÊNCIA DETECTADA!');
      console.log('   - ADD retorna itens, mas GET retorna vazio');
      console.log('   - Possíveis causas:');
      console.log('     • Cookie não sendo enviado corretamente');
      console.log('     • Formato do cookie diferente entre APIs');
      console.log('     • Parsing do cookie falhando no GET');
    } else {
      console.log('✅ Consistência OK entre ADD e GET');
    }
    
  } catch (error) {
    console.log('❌ Erro no debug:', error.message);
  }
}

debugCookieFlow().catch(console.error);
