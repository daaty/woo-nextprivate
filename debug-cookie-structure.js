// Debug detalhado da estrutura do cookie
// Filepath: f:\Site Felipe\next-react-site\woo-next\debug-cookie-structure.js

const testConfig = {
  baseUrl: 'http://localhost:3000'
};

async function debugCookieStructure() {
  console.log('🔍 DEBUG DETALHADO DA ESTRUTURA DO COOKIE\n');
  
  try {
    // Limpar carrinho primeiro
    console.log('🧹 Limpando carrinho...');
    await fetch(`${testConfig.baseUrl}/api/cart/simple-get`);
    
    // Adicionar produto
    console.log('➕ Adicionando produto...');
    const addResponse = await fetch(`${testConfig.baseUrl}/api/cart/simple-add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        product_id: 12345,
        quantity: 2,
        product_name: 'Produto Teste Debug',
        product_price: 100.00
      })
    });
    
    const addResult = await addResponse.json();
    console.log('\n📊 RESPOSTA ADD COMPLETA:');
    console.log(JSON.stringify(addResult, null, 2));
    
    // Extrair e analisar cookie
    const setCookieHeader = addResponse.headers.get('set-cookie');
    if (setCookieHeader) {
      const cookieMatch = setCookieHeader.match(/simple_cart=([^;]+)/);
      if (cookieMatch) {
        const cookieValue = decodeURIComponent(cookieMatch[1]);
        console.log('\n🍪 ESTRUTURA COMPLETA DO COOKIE:');
        
        try {
          const parsedCookie = JSON.parse(cookieValue);
          console.log(JSON.stringify(parsedCookie, null, 2));
          
          console.log('\n🔍 ANÁLISE DOS CAMPOS:');
          console.log('items.length:', parsedCookie.items?.length || 0);
          console.log('items_count:', parsedCookie.items_count);
          console.log('totalItemTypes:', parsedCookie.totalItemTypes);
          
          if (parsedCookie.items && parsedCookie.items.length > 0) {
            console.log('\n📱 PRIMEIRO ITEM:');
            const firstItem = parsedCookie.items[0];
            console.log('productId:', firstItem.productId);
            console.log('quantity:', firstItem.quantity);
            console.log('qty:', firstItem.qty);
            console.log('price:', firstItem.price);
            console.log('name:', firstItem.name);
          }
          
        } catch (parseError) {
          console.log('❌ Erro ao parsear cookie:', parseError.message);
          console.log('Cookie raw:', cookieValue.substring(0, 500));
        }
      }
    }
    
    // Testar GET com cookie
    console.log('\n📦 TESTANDO GET COM COOKIE...');
    const getResponse = await fetch(`${testConfig.baseUrl}/api/cart/simple-get`, {
      headers: { 'Cookie': setCookieHeader ? setCookieHeader.split(';')[0] : '' }
    });
    
    const getResult = await getResponse.json();
    console.log('\n📊 RESPOSTA GET COMPLETA:');
    console.log(JSON.stringify(getResult, null, 2));
    
    // Comparação detalhada
    console.log('\n⚖️ COMPARAÇÃO DETALHADA:');
    console.log('ADD - itemsCount:', addResult.cart?.itemsCount);
    console.log('GET - itemsCount:', getResult.cart?.itemsCount);
    console.log('ADD - items.length:', addResult.cart?.items?.length);
    console.log('GET - items.length:', getResult.cart?.items?.length);
    console.log('ADD - totalItemTypes:', addResult.cart?.totalItemTypes);
    console.log('GET - totalItemTypes:', getResult.cart?.totalItemTypes);
    
  } catch (error) {
    console.log('❌ Erro no debug:', error.message);
  }
}

debugCookieStructure().catch(console.error);
