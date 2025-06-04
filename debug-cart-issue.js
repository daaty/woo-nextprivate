/**
 * Script de debugging para investigar o problema do carrinho
 * que retorna vazio mesmo após adição bem-sucedida
 */

console.log('🔍 [DEBUG] Iniciando investigação do problema do carrinho...');

// Verificar se temos dados no localStorage
if (typeof window !== 'undefined') {
  const localCart = localStorage.getItem('woo-next-cart');
  console.log('📦 [DEBUG] Carrinho no localStorage:', localCart);
  
  if (localCart) {
    try {
      const parsedCart = JSON.parse(localCart);
      console.log('📦 [DEBUG] Carrinho parseado:', parsedCart);
      console.log('📦 [DEBUG] Produtos no carrinho:', parsedCart?.products?.length || 0);
    } catch (e) {
      console.error('❌ [DEBUG] Erro ao parsear carrinho do localStorage:', e);
    }
  }
  
  // Verificar sessão do WooCommerce
  const wooSession = localStorage.getItem('woo-session');
  console.log('🔑 [DEBUG] Sessão WooCommerce:', wooSession ? 'Existe' : 'Não existe');
  
  // Verificar cookies relacionados ao carrinho
  console.log('🍪 [DEBUG] Cookies do documento:', document.cookie);
}

// Função de teste para simular getFormattedCart
function testGetFormattedCart(mockData) {
  console.log('🧪 [DEBUG] Testando getFormattedCart com dados:', mockData);
  
  // Simular a função getFormattedCart
  if (!mockData || !mockData.cart) {
    console.log('⚠️ [DEBUG] Dados ausentes ou cart não existe');
    return {
      products: [],
      totalProductsCount: 0,
      totalProductsPrice: '0'
    };
  }
  
  if (!mockData.cart.contents || !mockData.cart.contents.nodes) {
    console.log('⚠️ [DEBUG] Estrutura do carrinho inválida');
    return {
      products: [],
      totalProductsCount: 0,
      totalProductsPrice: mockData.cart.total || '0'
    };
  }
  
  if (!mockData.cart.contents.nodes.length) {
    console.log('⚠️ [DEBUG] Carrinho existe mas nodes está vazio');
    console.log('📊 [DEBUG] Contents completo:', mockData.cart.contents);
    return {
      products: [],
      totalProductsCount: 0,
      totalProductsPrice: mockData?.cart?.total ?? '0'
    };
  }
  
  console.log('✅ [DEBUG] Carrinho tem produtos:', mockData.cart.contents.nodes.length);
  return mockData;
}

// Teste com diferentes cenários
console.log('\n=== TESTANDO CENÁRIOS ===');

// Cenário 1: Dados completamente ausentes
console.log('\n1. Dados ausentes:');
testGetFormattedCart(undefined);

// Cenário 2: Cart não existe
console.log('\n2. Cart não existe:');
testGetFormattedCart({});

// Cenário 3: Contents não existe
console.log('\n3. Contents não existe:');
testGetFormattedCart({
  cart: {
    total: 'R$ 50,00'
  }
});

// Cenário 4: Nodes não existe
console.log('\n4. Nodes não existe:');
testGetFormattedCart({
  cart: {
    contents: {},
    total: 'R$ 50,00'
  }
});

// Cenário 5: Nodes vazio
console.log('\n5. Nodes vazio:');
testGetFormattedCart({
  cart: {
    contents: {
      nodes: []
    },
    total: 'R$ 50,00'
  }
});

// Cenário 6: Nodes com produtos
console.log('\n6. Nodes com produtos:');
testGetFormattedCart({
  cart: {
    contents: {
      nodes: [
        {
          key: 'abc123',
          product: {
            node: {
              id: 'cHJvZHVjdDoxMjM=',
              databaseId: 123,
              name: 'Produto Teste',
              image: {
                sourceUrl: 'https://example.com/image.jpg'
              }
            }
          },
          quantity: 2,
          total: 'R$ 100,00'
        }
      ]
    },
    total: 'R$ 100,00'
  }
});

console.log('\n🔍 [DEBUG] Investigação concluída. Verifique os logs acima.');

// Função para verificar o estado atual do Apollo Client Cache
if (typeof window !== 'undefined' && window.__APOLLO_CLIENT__) {
  console.log('\n🚀 [DEBUG] Verificando cache do Apollo Client...');
  try {
    const client = window.__APOLLO_CLIENT__;
    const cache = client.cache;
    console.log('📊 [DEBUG] Cache do Apollo:', cache);
    
    // Tentar extrair dados do carrinho do cache
    const cacheData = cache.extract();
    console.log('📦 [DEBUG] Dados do cache:', cacheData);
    
    // Procurar por dados relacionados ao carrinho
    const cartKeys = Object.keys(cacheData).filter(key => 
      key.toLowerCase().includes('cart') || 
      key.toLowerCase().includes('ROOT_QUERY')
    );
    
    console.log('🔑 [DEBUG] Chaves relacionadas ao carrinho no cache:', cartKeys);
    
    cartKeys.forEach(key => {
      console.log(`📋 [DEBUG] ${key}:`, cacheData[key]);
    });
    
  } catch (cacheError) {
    console.error('❌ [DEBUG] Erro ao acessar cache do Apollo:', cacheError);
  }
}
