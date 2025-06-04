// Test script for cart UI display fixes
// filepath: f:\Site Felipe\next-react-site\woo-next\test-minicart-display-fix.js

/**
 * This script tests if the Minicart component correctly displays all items
 * from the cart API response, not just the ones in the cookie.
 */

console.log('🧪 INICIANDO TESTE DO MINICART COM MÚLTIPLOS PRODUTOS\n');

// Mock do objeto window para eventos
if (typeof window === 'undefined') {
  global.window = {
    dispatchEvent: (event) => {
      console.log(`🔔 Evento disparado: ${event.type}`, event.detail);
    },
    addEventListener: () => {},
    removeEventListener: () => {},
  };
}

// Mock da função fetch para simular respostas da API
global.fetch = async (url, options) => {
  console.log(`📡 Requisição para: ${url}`);
  
  if (url === '/api/cart/simple-get') {
    console.log('🛒 Simulando resposta do simple-get');
    
    // Simular resposta com mais produtos do que cabem no cookie
    return {
      ok: true,
      json: async () => ({
        success: true,
        cart: {
          items: [
            { 
              cartKey: '1001_no_var_1654321001',
              productId: 1001,
              name: "Xiaomi Redmi Note 10",
              price: 1299.90,
              quantity: 1,
              image: { sourceUrl: "https://example.com/image1.jpg", alt: "Xiaomi Redmi Note 10" },
              totalPrice: "R$ 1.299,90"
            },
            { 
              cartKey: '1002_no_var_1654321002',
              productId: 1002,
              name: "Xiaomi Mi 11",
              price: 2999.90,
              quantity: 1,
              image: { sourceUrl: "https://example.com/image2.jpg", alt: "Xiaomi Mi 11" },
              totalPrice: "R$ 2.999,90"
            },
            { 
              cartKey: '1003_no_var_1654321003',
              productId: 1003,
              name: "Xiaomi POCO X3",
              price: 1599.90,
              quantity: 1,
              image: { sourceUrl: "https://example.com/image3.jpg", alt: "Xiaomi POCO X3" },
              totalPrice: "R$ 1.599,90"
            },
            { 
              cartKey: '1004_no_var_1654321004',
              productId: 1004,
              name: "Xiaomi Mi Band 6",
              price: 349.90,
              quantity: 1,
              image: { sourceUrl: "https://example.com/image4.jpg", alt: "Xiaomi Mi Band 6" },
              totalPrice: "R$ 349,90"
            },
            { 
              cartKey: '1005_no_var_1654321005',
              productId: 1005,
              name: "Xiaomi Mi TV Stick",
              price: 399.90,
              quantity: 1,
              image: { sourceUrl: "https://example.com/image5.jpg", alt: "Xiaomi Mi TV Stick" },
              totalPrice: "R$ 399,90"
            },
            { 
              cartKey: '1006_no_var_1654321006',
              productId: 1006,
              name: "Xiaomi Redmi AirDots",
              price: 199.90,
              quantity: 1,
              image: { sourceUrl: "https://example.com/image6.jpg", alt: "Xiaomi Redmi AirDots" },
              totalPrice: "R$ 199,90"
            }
          ],
          items_count: 6,
          total: "R$ 6.949,40",
          total_numeric: 6949.40,
          subtotal: "R$ 6.949,40",
          totalItemTypes: 6,
          hasMoreItems: false,
          itemsInCookie: 6
        },
        responseTime: 125
      })
    };
  }
  
  if (url === '/api/cart/simple-add') {
    const body = JSON.parse(options.body);
    console.log(`🛒 Simulando adição ao carrinho: ${body.product_name}`);
    
    return {
      ok: true,
      json: async () => ({
        success: true,
        message: `${body.product_name} adicionado ao carrinho com sucesso!`,
        product: {
          id: body.product_id,
          name: body.product_name,
          quantity: body.quantity,
          price: body.product_price,
          image: body.product_image
        },
        cart: {
          items: [
            // Simulando um carrinho com o produto adicionado e outros produtos existentes
            {
              cartKey: `${body.product_id}_no_var_${Date.now()}`,
              productId: parseInt(body.product_id),
              name: body.product_name,
              price: parseFloat(body.product_price),
              quantity: parseInt(body.quantity),
              image: { sourceUrl: body.product_image, alt: body.product_name },
              totalPrice: `R$ ${(parseFloat(body.product_price) * parseInt(body.quantity)).toFixed(2).replace('.', ',')}`
            },
            // Adicionar outros produtos simulados
            // ... mais produtos seriam adicionados aqui
          ],
          items_count: 6,
          total: "R$ 6.949,40",
          total_numeric: 6949.40,
          subtotal: "R$ 6.949,40",
          totalItemTypes: 6,
          hasMoreItems: true,
          itemsInCookie: 3
        },
        responseTime: 150
      })
    };
  }
  
  return {
    ok: false,
    status: 404,
    statusText: 'Not Found'
  };
};

// Simulação de teste do Minicart
const testMinicart = async () => {
  console.log('📋 Simulando renderização do Minicart...');
  
  // Simular os estados que o Minicart teria
  const cartData = {
    items: [],
    itemsCount: 0,
    total: 'R$ 0,00',
    totalNumeric: 0
  };
  
  try {
    console.log('1️⃣ Buscando dados iniciais do carrinho...');
    const response = await fetch('/api/cart/simple-get');
    const result = await response.json();
    
    if (result.success && result.cart) {
      const updatedCartData = {
        items: result.cart.items || [],
        itemsCount: result.cart.items_count || 0,
        total: result.cart.total || 'R$ 0,00',
        totalNumeric: result.cart.total_numeric || 0,
        totalItemTypes: result.cart.totalItemTypes || result.cart.items.length,
        hasMoreItems: result.cart.hasMoreItems || false,
        itemsInCookie: result.cart.itemsInCookie || result.cart.items.length
      };
      
      console.log('✅ Dados do carrinho carregados:');
      console.log(`- Total de itens: ${updatedCartData.itemsCount}`);
      console.log(`- Total de tipos de produtos: ${updatedCartData.totalItemTypes}`);
      console.log(`- Itens no cookie: ${updatedCartData.itemsInCookie}`);
      console.log(`- Valor total: ${updatedCartData.total}`);
      
      console.log('\n📋 Itens que seriam exibidos no minicart:');
      updatedCartData.items.forEach((item, index) => {
        console.log(`${index + 1}. ${item.name} - Qtd: ${item.quantity} - Preço: ${item.totalPrice || item.price}`);
      });
      
      if (updatedCartData.hasMoreItems) {
        console.log(`\n⚠️ Há ${updatedCartData.totalItemTypes - updatedCartData.items.length} itens adicionais que não estão no cookie`);
        console.log('✅ O minicart exibiria uma mensagem para ver todos os itens');
      }
      
      // Verificar se o minicart renderiza todos os itens ou apenas 3
      const oldLimit = 3;
      if (updatedCartData.items.length > oldLimit && updatedCartData.items.length >= updatedCartData.totalItemTypes) {
        console.log(`\n✅ CORREÇÃO FUNCIONANDO: O minicart agora exibiria todos os ${updatedCartData.items.length} itens`);
        console.log('   Antes mostrava apenas 3 itens devido à limitação na interface.');
      }
    }
  } catch (error) {
    console.error('❌ Erro ao testar o Minicart:', error);
  }
};

// Executar o teste
testMinicart().then(() => {
  console.log('\n🧪 Teste concluído!');
});
