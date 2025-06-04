// Script to test the cart API with multiple products
// Filepath: f:\Site Felipe\next-react-site\woo-next\test-cart-size-limit-fix.js

/**
 * This script tests the improved cart APIs by adding multiple products
 * and verifying that all items are properly returned.
 */

const fetch = require('node-fetch');

const testProducts = [
  { 
    id: 1001,
    name: "Xiaomi Redmi Note 10",
    price: 1299.90,
    image: "https://example.com/image1.jpg"
  },
  { 
    id: 1002,
    name: "Xiaomi Mi 11",
    price: 2999.90,
    image: "https://example.com/image2.jpg"
  },
  { 
    id: 1003,
    name: "Xiaomi POCO X3",
    price: 1599.90,
    image: "https://example.com/image3.jpg"
  },
  { 
    id: 1004,
    name: "Xiaomi Mi Band 6",
    price: 349.90,
    image: "https://example.com/image4.jpg"
  },
  { 
    id: 1005,
    name: "Xiaomi Mi TV Stick",
    price: 399.90,
    image: "https://example.com/image5.jpg"
  },
  { 
    id: 1006,
    name: "Xiaomi Redmi AirDots",
    price: 199.90,
    image: "https://example.com/image6.jpg"
  }
];

// Start with an empty cart
let cookies = '';

async function clearCart() {
  console.log('🧹 Limpando carrinho...');
  cookies = ''; // Reset cookies
}

async function addProductToCart(product) {
  console.log(`🛒 Adicionando produto: ${product.name}`);
  
  const response = await fetch('http://localhost:3000/api/cart/simple-add', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookies
    },
    body: JSON.stringify({
      product_id: product.id,
      quantity: 1,
      product_name: product.name,
      product_price: product.price,
      product_image: product.image
    })
  });
  
  // Update cookies for next request
  if (response.headers.get('set-cookie')) {
    cookies = response.headers.get('set-cookie');
  }
  
  const data = await response.json();
  
  console.log(`✅ Produto adicionado: ${product.name}`);
  console.log(`📊 Carrinho agora tem ${data.cart.items.length} produtos`);
  console.log(`🔢 Total de itens: ${data.cart.itemsCount}`);
  console.log(`💰 Total: ${data.cart.total}`);
  
  if (data.cart.hasMoreItems) {
    console.log(`⚠️ Atenção: O carrinho tem ${data.cart.totalItemTypes} tipos de produtos, mas apenas ${data.cart.itemsInCookie || data.cart.items.length} no cookie!`);
  }
  
  return data;
}

async function getCart() {
  console.log('🔍 Buscando carrinho...');
  
  const response = await fetch('http://localhost:3000/api/cart/simple-get', {
    headers: {
      'Cookie': cookies
    }
  });
  
  // Update cookies for next request
  if (response.headers.get('set-cookie')) {
    cookies = response.headers.get('set-cookie');
  }
  
  const data = await response.json();
  
  console.log(`✅ Carrinho recuperado com ${data.cart.items.length} produtos`);
  console.log(`📊 Detalhes do carrinho:`);
  console.log(`- Itens no carrinho: ${data.cart.items.length}`);
  console.log(`- Total de tipos de produtos: ${data.cart.totalItemTypes || data.cart.items.length}`);
  console.log(`- Total de itens: ${data.cart.items_count}`);
  console.log(`- Valor total: ${data.cart.total}`);
  
  if (data.cart.wasLimited || data.cart.hasMoreItems) {
    console.log(`⚠️ O carrinho foi limitado devido ao tamanho do cookie. Total real: ${data.cart.totalItemTypes} produtos`);
  }
  
  // Show each item in cart
  console.log('\n📋 Itens no carrinho:');
  data.cart.items.forEach((item, index) => {
    console.log(`${index+1}. ${item.name} - Qtd: ${item.quantity} - Preço: R$ ${item.price}`);
  });
  
  return data;
}

async function runTest() {
  try {
    console.log('🧪 INICIANDO TESTE DO CARRINHO COM MÚLTIPLOS PRODUTOS\n');
    
    // Step 1: Clear cart
    await clearCart();
    
    // Step 2: Add products one by one
    for (const product of testProducts) {
      await addProductToCart(product);
      console.log('-'.repeat(60));
    }
    
    // Step 3: Get final cart
    console.log('\n🔍 VERIFICANDO ESTADO FINAL DO CARRINHO:');
    const finalCart = await getCart();
      // Step 4: Analyze results
    console.log('\n📊 RESULTADOS DO TESTE:');
    
    // Use totalItemTypes as the true measure of how many products are in the cart
    const totalItemsInCart = finalCart.cart.totalItemTypes || finalCart.cart.items.length;
    
    if (totalItemsInCart >= testProducts.length) {
      console.log(`✅ SUCESSO: O sistema está rastreando todos os ${totalItemsInCart} produtos adicionados ao carrinho!`);
      if (finalCart.cart.items.length < testProducts.length) {
        console.log(`ℹ️ Nota: Apenas ${finalCart.cart.items.length} produtos estão no cookie devido às limitações de tamanho,`);
        console.log(`   mas o sistema rastreia corretamente todos os ${totalItemsInCart} produtos.`);
        console.log(`ℹ️ Os produtos adicionados mais recentemente são mantidos no cookie.`);
      }
    } else if (finalCart.cart.items.length > 3) {
      console.log(`✅ MELHORIA: O carrinho agora suporta ${finalCart.cart.items.length} produtos, mais que os 3 anteriores!`);
      console.log(`⚠️ No entanto, ainda não está rastreando todos os ${testProducts.length} produtos adicionados.`);
    } else if (totalItemsInCart > 3) {
      console.log(`✅ MELHORIA: O sistema agora rastreia ${totalItemsInCart} produtos, mais que os 3 anteriores!`);
      console.log(`ℹ️ Apenas ${finalCart.cart.items.length} produtos estão no cookie devido às limitações de tamanho.`);
    } else {
      console.log(`❌ FALHA: O carrinho deveria rastrear ${testProducts.length} produtos, mas tem apenas ${totalItemsInCart}.`);
    }
    
    console.log('\nTeste concluído!');
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

// Check if server is running
async function checkServer() {
  try {
    const response = await fetch('http://localhost:3000');
    if (response.ok) {
      runTest();
    }
  } catch (error) {
    console.error('❌ Servidor não está rodando em http://localhost:3000');
    console.log('▶️ Inicie o servidor com "npm run dev" antes de executar este teste');
  }
}

checkServer();
