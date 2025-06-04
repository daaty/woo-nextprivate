
/**
 * TESTE DE INTEGRAÇÃO DO SISTEMA DE ARMAZENAMENTO
 * 
 * Este script testa a integração completa entre:
 * 1. Sistema de armazenamento persistente (cart-storage.js)
 * 2. API de adicionar produtos (simple-add-improved.js) 
 * 3. API de buscar carrinho (simple-get.js)
 * 4. Verificação se TODOS os produtos aparecem no minicart
 */

const http = require('http');
const querystring = require('querystring');

// Configuração do teste
const BASE_URL = 'http://localhost:3000';
const TEST_PRODUCTS = [
  { id: 6788, name: 'Xiaomi Redmi Note 13', price: 899.99 },
  { id: 6789, name: 'Xiaomi 14 Ultra', price: 1899.99 },
  { id: 6790, name: 'Xiaomi Mi Band 8', price: 299.99 },
  { id: 6791, name: 'Xiaomi Pad 6', price: 1299.99 },
  { id: 6792, name: 'Xiaomi Buds 4 Pro', price: 399.99 },
  { id: 6793, name: 'Xiaomi Robot Vacuum', price: 799.99 },
  { id: 6794, name: 'Xiaomi Air Purifier', price: 599.99 },
  { id: 6795, name: 'Xiaomi Electric Scooter', price: 1599.99 }
];

// Função para fazer requisições HTTP
function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: jsonData
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: data
          });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

// Função para adicionar produto ao carrinho
async function addToCart(product, cookies = '') {
  const postData = JSON.stringify({
    product_id: product.id,
    quantity: 1,
    product_name: product.name,
    product_price: product.price,
    product_image: `https://example.com/image-${product.id}.jpg`
  });

  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/cart/simple-add-improved',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData),
      'Cookie': cookies
    }
  };

  return await makeRequest(options, postData);
}

// Função para buscar carrinho
async function getCart(cookies = '') {
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/cart/simple-get',
    method: 'GET',
    headers: {
      'Cookie': cookies
    }
  };

  return await makeRequest(options);
}

// Função para extrair cookies de resposta
function extractCookies(headers) {
  const setCookieHeader = headers['set-cookie'];
  if (!setCookieHeader) return '';
  
  return setCookieHeader.map(cookie => cookie.split(';')[0]).join('; ');
}

// Função principal de teste
async function runStorageIntegrationTest() {
  console.log('🧪 INICIANDO TESTE DE INTEGRAÇÃO DO SISTEMA DE ARMAZENAMENTO');
  console.log('=' .repeat(70));
  
  let cookies = '';
  let testResults = {
    productsAdded: 0,
    totalInCart: 0,
    allItemsVisible: false,
    storageWorking: false,
    cookieFallbackWorking: false
  };
  
  try {
    // FASE 1: Adicionar múltiplos produtos para testar limite do cookie
    console.log('\n📦 FASE 1: Adicionando produtos ao carrinho...');
    
    for (let i = 0; i < TEST_PRODUCTS.length; i++) {
      const product = TEST_PRODUCTS[i];
      console.log(`\n➕ Adicionando produto ${i + 1}/${TEST_PRODUCTS.length}: ${product.name}`);
      
      const response = await addToCart(product, cookies);
      
      if (response.statusCode === 200 && response.data.success) {
        testResults.productsAdded++;
        
        // Atualizar cookies para próximas requisições
        const newCookies = extractCookies(response.headers);
        if (newCookies) {
          cookies = newCookies;
        }
        
        console.log(`✅ Produto adicionado. Carrinho agora tem ${response.data.cart.totalItemTypes} tipos de produtos`);
        console.log(`📊 Itens na resposta: ${response.data.cart.items.length}`);
        console.log(`🍪 Itens no cookie: ${response.data.cart.itemsInCookie || 'não informado'}`);
        console.log(`🏪 Tem mais itens?: ${response.data.cart.hasMoreItems ? 'Sim' : 'Não'}`);
        
        // Verificar se sistema de armazenamento está funcionando
        if (response.data.cart.totalItemTypes > (response.data.cart.itemsInCookie || 0)) {
          testResults.storageWorking = true;
          console.log('💾 Sistema de armazenamento detectado!');
        }
        
      } else {
        console.log(`❌ Erro ao adicionar produto: ${response.data.message || 'Erro desconhecido'}`);
      }
      
      // Pequena pausa entre requisições
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // FASE 2: Buscar carrinho e verificar se todos os itens estão disponíveis
    console.log('\n📦 FASE 2: Buscando carrinho completo...');
    
    const cartResponse = await getCart(cookies);
    
    if (cartResponse.statusCode === 200 && cartResponse.data.success) {
      const cart = cartResponse.data.cart;
      testResults.totalInCart = cart.totalItemTypes || cart.items.length;
      
      console.log('\n📊 RESULTADO DA BUSCA DO CARRINHO:');
      console.log(`   Total de tipos de produtos: ${testResults.totalInCart}`);
      console.log(`   Itens na resposta: ${cart.items.length}`);
      console.log(`   Fonte dos dados: ${cart.source || 'não informado'}`);
      console.log(`   Todos os itens incluídos: ${cart.allItemsIncluded ? 'Sim' : 'Não'}`);
      
      // Verificar se todos os produtos adicionados estão visíveis
      if (cart.items.length === TEST_PRODUCTS.length) {
        testResults.allItemsVisible = true;
        console.log('✅ TODOS os produtos estão visíveis no carrinho!');
      } else if (cart.items.length < TEST_PRODUCTS.length && cart.source === 'cookie_fallback') {
        testResults.cookieFallbackWorking = true;
        console.log('⚠️  Nem todos os produtos visíveis - sistema usando fallback do cookie');
        console.log(`   Produtos adicionados: ${TEST_PRODUCTS.length}`);
        console.log(`   Produtos visíveis: ${cart.items.length}`);
      } else if (cart.source === 'persistent_storage') {
        testResults.storageWorking = true;
        console.log('💾 Sistema de armazenamento persistente funcionando!');
      }
      
      // Mostrar detalhes dos itens
      console.log('\n🛍️  ITENS NO CARRINHO:');
      cart.items.forEach((item, index) => {
        console.log(`   ${index + 1}. ${item.name} - R$ ${item.price} (Qty: ${item.quantity})`);
      });
      
    } else {
      console.log(`❌ Erro ao buscar carrinho: ${cartResponse.data.message || 'Erro desconhecido'}`);
    }
    
    // FASE 3: Análise dos resultados
    console.log('\n' + '='.repeat(70));
    console.log('📋 RELATÓRIO FINAL DO TESTE');
    console.log('='.repeat(70));
    
    console.log(`✅ Produtos adicionados com sucesso: ${testResults.productsAdded}/${TEST_PRODUCTS.length}`);
    console.log(`📊 Total de produtos no carrinho: ${testResults.totalInCart}`);
    console.log(`👁️  Todos os produtos visíveis: ${testResults.allItemsVisible ? 'SIM' : 'NÃO'}`);
    console.log(`💾 Sistema de armazenamento funcionando: ${testResults.storageWorking ? 'SIM' : 'NÃO'}`);
    console.log(`🍪 Fallback do cookie funcionando: ${testResults.cookieFallbackWorking ? 'SIM' : 'NÃO'}`);
    
    // Avaliar resultado geral
    const success = testResults.productsAdded === TEST_PRODUCTS.length && 
                   (testResults.allItemsVisible || testResults.storageWorking);
    
    if (success) {
      console.log('\n🎉 TESTE APROVADO! Sistema de armazenamento integrado funciona corretamente.');
      console.log('   - Todos os produtos foram adicionados ao carrinho');
      console.log('   - Sistema consegue manter produtos além do limite do cookie');
      console.log('   - APIs estão integradas com sistema de armazenamento');
    } else {
      console.log('\n⚠️  TESTE PARCIAL. Alguns problemas detectados:');
      if (testResults.productsAdded < TEST_PRODUCTS.length) {
        console.log('   - Nem todos os produtos foram adicionados com sucesso');
      }
      if (!testResults.allItemsVisible && !testResults.storageWorking) {
        console.log('   - Sistema não conseguiu manter todos os produtos visíveis');
        console.log('   - Sistema de armazenamento pode não estar funcionando');
      }
    }
    
    console.log('\n📝 PRÓXIMOS PASSOS:');
    if (!testResults.storageWorking) {
      console.log('   1. Verificar se cart-storage.js está funcionando corretamente');
      console.log('   2. Verificar se as APIs estão importando cart-storage.js');
      console.log('   3. Verificar logs do servidor para errors de armazenamento');
    }
    if (!testResults.allItemsVisible) {
      console.log('   4. Verificar se o componente Minicart está usando todos os itens da resposta');
      console.log('   5. Verificar se não há limitação no frontend');
    }
    console.log('   6. Testar no navegador para verificar comportamento real');
    
  } catch (error) {
    console.error('\n❌ ERRO NO TESTE:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Executar teste se arquivo for chamado diretamente
if (require.main === module) {
  runStorageIntegrationTest().catch(console.error);
}

module.exports = { runStorageIntegrationTest };
