// Debugar erro 400 no endpoint /check da Infinitepay
const fetch = require('cross-fetch');

async function debugInfinitepayCheckError() {
  console.log('🔍 DEBUGGING: Erro 400 no /check da Infinitepay');
  console.log('=' * 50);

  // Simular dados típicos enviados no checkout
  const testData = {
    items: [
      {
        name: "Produto Teste",
        quantity: 1,
        price: 10000, // Em centavos
        total: 10000
      }
    ],
    customer: {
      email: "teste@example.com",
      name: "Cliente Teste"
    },
    shipping: {
      cost: 1500, // Em centavos
      address1: "Rua Teste, 123",
      city: "São Paulo",
      state: "SP",
      postcode: "01234-567"
    },
    total: 11500 // Em centavos
  };

  // Testar o endpoint /check da Infinitepay
  try {
    console.log('\n1️⃣ Testando endpoint /check da Infinitepay...');
    
    const checkUrl = 'https://api.infinitepay.io/invoices/public/checkout/cart/rotadoscelulares/check';
    
    console.log('URL:', checkUrl);
    console.log('Dados de teste:', JSON.stringify(testData, null, 2));

    const response = await fetch(checkUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(testData)
    });

    console.log('\n📊 RESPOSTA:');
    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);
    
    const responseText = await response.text();
    console.log('Body:', responseText);

    if (!response.ok) {
      console.log('\n❌ ERRO 400 - Analisando possíveis causas:');
      
      try {
        const errorData = JSON.parse(responseText);
        console.log('Dados do erro:', JSON.stringify(errorData, null, 2));
      } catch (e) {
        console.log('Resposta não é JSON válido');
      }
    }

  } catch (error) {
    console.error('❌ Erro na requisição:', error.message);
  }

  // Testar diferentes formatos de dados
  console.log('\n2️⃣ Testando formato alternativo...');
  
  const alternativeData = {
    products: [
      {
        name: "Produto Teste",
        qty: 1,
        unit_price: 100.00, // Em reais
        total_price: 100.00
      }
    ],
    customer_email: "teste@example.com",
    customer_name: "Cliente Teste",
    shipping_cost: 15.00,
    total_amount: 115.00
  };

  try {
    const response2 = await fetch('https://api.infinitepay.io/invoices/public/checkout/cart/rotadoscelulares/check', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(alternativeData)
    });

    console.log('Status formato alternativo:', response2.status);
    const altText = await response2.text();
    console.log('Resposta formato alternativo:', altText.substring(0, 200));

  } catch (error) {
    console.error('Erro formato alternativo:', error.message);
  }

  // Testar sem dados (para ver qual erro retorna)
  console.log('\n3️⃣ Testando sem dados...');
  
  try {
    const response3 = await fetch('https://api.infinitepay.io/invoices/public/checkout/cart/rotadoscelulares/check', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    });

    console.log('Status sem dados:', response3.status);
    const emptyText = await response3.text();
    console.log('Resposta sem dados:', emptyText.substring(0, 200));

  } catch (error) {
    console.error('Erro sem dados:', error.message);
  }
}

debugInfinitepayCheckError()
  .then(() => {
    console.log('\n🏁 Debug concluído!');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Erro no debug:', error);
    process.exit(1);
  });
