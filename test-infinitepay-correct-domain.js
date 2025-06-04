const fetch = require('cross-fetch');

async function testInfinitepayWithCorrectDomain() {
  console.log('🧪 TESTE: Infinitepay com domínio correto');
  console.log('=====================================');

  const handle = 'rotadoscelulares';
  
  try {
    // 1. Testar API base da Infinitepay
    console.log('\n1️⃣ Testando API base da Infinitepay...');
    const apiUrl = `https://api.infinitepay.io/invoices/public/checkout/cart/${handle}`;
    const apiResponse = await fetch(apiUrl);
    console.log(`Status API: ${apiResponse.status}`);
    
    if (apiResponse.ok) {
      const apiData = await apiResponse.text();
      console.log('API Response:', apiData);
    }

    // 2. Testar URL de checkout com domínio correto
    console.log('\n2️⃣ Testando URL de checkout com domínio site.rotadoscelulares.com...');
    
    const testParams = new URLSearchParams();
    testParams.append('items', JSON.stringify([
      { name: 'Produto Teste', price: 10000, quantity: 1 }
    ]));
    testParams.append('order_nsu', `test_${Date.now()}`);
    testParams.append('redirect_url', 'https://site.rotadoscelulares.com/confirmacao/infinitepay');
    testParams.append('customer_name', 'João Silva');
    testParams.append('customer_email', 'teste@exemplo.com');
    testParams.append('customer_cellphone', '11999999999');
    testParams.append('address_cep', '01234567');

    const checkoutUrl = `https://checkout.infinitepay.io/${handle}?${testParams.toString()}`;
    console.log('URL de checkout:', checkoutUrl);

    const checkoutResponse = await fetch(checkoutUrl);
    console.log(`Status checkout: ${checkoutResponse.status}`);
    console.log(`Headers:`, Object.fromEntries(checkoutResponse.headers.entries()));

    if (checkoutResponse.ok) {
      const checkoutText = await checkoutResponse.text();
      if (checkoutText.includes('página não encontrada') || checkoutText.includes('Opa, página não encontrada')) {
        console.log('❌ ERRO: Página não encontrada detectada no HTML');
      } else {
        console.log('✅ SUCESSO: Página de checkout carregada corretamente');
      }
    } else {
      console.log('❌ ERRO: Status não-ok:', checkoutResponse.status);
    }

    // 3. Testar endpoint /check com domínio correto
    console.log('\n3️⃣ Testando endpoint /check...');
    const checkUrl = `https://api.infinitepay.io/invoices/public/checkout/cart/${handle}/check`;
    const checkResponse = await fetch(checkUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'https://site.rotadoscelulares.com',
        'Referer': 'https://site.rotadoscelulares.com/'
      },
      body: JSON.stringify({
        items: [{ name: 'Produto Teste', price: 10000, quantity: 1 }],
        customer: { name: 'João Silva', email: 'teste@exemplo.com' }
      })
    });
    
    console.log(`Status /check: ${checkResponse.status}`);
    
    if (checkResponse.ok || checkResponse.status === 400) {
      const checkText = await checkResponse.text();
      console.log('Response /check:', checkText);
    }

  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
  }
}

testInfinitepayWithCorrectDomain()
  .then(() => {
    console.log('\n🏁 Teste concluído!');
  })
  .catch(error => {
    console.error('💥 Erro crítico:', error);
  });
