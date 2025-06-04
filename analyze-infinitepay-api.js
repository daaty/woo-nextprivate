// Analisar como a Infinitepay constrói URLs de checkout
const fetch = require('cross-fetch');

async function analyzeInfinitepayAPI() {
  console.log('🔍 ANÁLISE: API da Infinitepay');
  console.log('=' * 40);

  // Testar endpoint de informações da conta
  console.log('\n1️⃣ Testando endpoint de informações...');
  
  try {
    const infoUrl = 'https://api.infinitepay.io/invoices/public/checkout/cart/rotadoscelulares';
    const response = await fetch(infoUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });

    console.log('Status info:', response.status);
    const infoText = await response.text();
    console.log('Resposta info:', infoText.substring(0, 500));

  } catch (error) {
    console.error('Erro info:', error.message);
  }

  // Testar endpoint direto do checkout (como no site)
  console.log('\n2️⃣ Testando URL de checkout direta...');
  
  try {
    const checkoutUrl = 'https://checkout.infinitepay.io/rotadoscelulares';
    const response = await fetch(checkoutUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    console.log('Status checkout direto:', response.status);
    const checkoutText = await response.text();
    
    // Procurar por informações sobre a API
    const hasApiInfo = checkoutText.includes('api.infinitepay.io');
    const hasCheckEndpoint = checkoutText.includes('/check');
    
    console.log('Contém referência à API:', hasApiInfo);
    console.log('Contém endpoint /check:', hasCheckEndpoint);
    
    if (checkoutText.includes('application/json')) {
      console.log('✅ Página aceita JSON');
    }

  } catch (error) {
    console.error('Erro checkout direto:', error.message);
  }

  // Verificar se há headers específicos necessários
  console.log('\n3️⃣ Testando com headers diferentes...');
  
  const testHeaders = [
    { 'X-Requested-With': 'XMLHttpRequest' },
    { 'Origin': 'https://checkout.infinitepay.io' },
    { 'Referer': 'https://checkout.infinitepay.io/rotadoscelulares' },
    { 'X-Infinitepay-Handle': 'rotadoscelulares' }
  ];

  for (const headers of testHeaders) {
    try {
      const response = await fetch('https://api.infinitepay.io/invoices/public/checkout/cart/rotadoscelulares/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers
        },
        body: JSON.stringify({
          test: true
        })
      });

      console.log(`Headers ${JSON.stringify(headers)} - Status:`, response.status);
      
      if (response.status !== 400) {
        const text = await response.text();
        console.log('Resposta diferente:', text.substring(0, 200));
      }

    } catch (error) {
      console.log(`Headers ${JSON.stringify(headers)} - Erro:`, error.message);
    }
  }

  // Verificar se o problema está na estrutura de dados esperada
  console.log('\n4️⃣ Testando estrutura mínima...');
  
  const minimalStructures = [
    { cart: [] },
    { items: [] },
    { products: [] },
    { handle: 'rotadoscelulares' },
    { checkout: true },
    { validate: true }
  ];

  for (const structure of minimalStructures) {
    try {
      const response = await fetch('https://api.infinitepay.io/invoices/public/checkout/cart/rotadoscelulares/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(structure)
      });

      console.log(`Estrutura ${JSON.stringify(structure)} - Status:`, response.status);
      
      if (response.status !== 400) {
        const text = await response.text();
        console.log('Resposta diferente:', text.substring(0, 200));
      }

    } catch (error) {
      console.log(`Estrutura ${JSON.stringify(structure)} - Erro:`, error.message);
    }
  }
}

analyzeInfinitepayAPI()
  .then(() => {
    console.log('\n🏁 Análise concluída!');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Erro na análise:', error);
    process.exit(1);
  });
