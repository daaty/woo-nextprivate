// Teste com dados reais que o site está enviando
// Simular exatamente o problema: site envia total 23.55, API criava 2.22

const axios = require('axios');

async function testRealSiteData() {
    console.log('\n🔍 TESTE COM DADOS REAIS DO SITE');
    console.log('===============================');
    
    // Dados exatos que o site está enviando (baseado no log)
    const testData = {
        total: 23.55, // Site calcula: R$ 23,55
        items: [
            {
                name: 'Produto Teste',
                price: 2.00,        // Preço unitário em reais
                quantity: 1,
                productId: 123
            }
        ],
        shipping: {
            cost: 0.22,     // Frete calculado pelo site
            address1: 'Rua Teste, 123',
            city: 'São Paulo',
            state: 'SP',
            postcode: '01000-000',
            country: 'BR'
        },
        customer: {
            firstName: 'João',
            lastName: 'Silva',
            email: 'joao.silva@example.com',
            phone: '11999999999',
            databaseId: 1
        },
        paymentMethod: 'infinitepay-checkout'
    };
    
    console.log('📊 DADOS ENVIADOS:');
    console.log('- Total do site:', testData.total);
    console.log('- Preço do produto:', testData.items[0].price);
    console.log('- Quantidade:', testData.items[0].quantity);
    console.log('- Frete:', testData.shipping.cost);
    console.log('- Total esperado no WooCommerce:', testData.total);
    
    try {
        const response = await axios.post('http://localhost:3000/api/infinitepay/create-link', testData, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (response.data.success) {
            console.log('\n✅ TESTE PASSOU!');
            console.log('- Pedido criado:', response.data.orderId);
            console.log('- Número do pedido:', response.data.orderNumber);
            console.log('- Link gerado:', response.data.checkoutUrl ? 'Sim' : 'Não');
            
            // Verificar no WooCommerce se o total está correto
            console.log('\n🔍 Verificando pedido no WooCommerce...');
            await verifyOrderInWooCommerce(response.data.orderId, testData.total);
            
        } else {
            console.log('\n❌ TESTE FALHOU:');
            console.log('Erro:', response.data.error);
        }
        
    } catch (error) {
        console.log('\n💥 ERRO NO TESTE:');
        if (error.response) {
            console.log('Status:', error.response.status);
            console.log('Erro:', error.response.data);
        } else {
            console.log('Erro:', error.message);
        }
    }
}

async function verifyOrderInWooCommerce(orderId, expectedTotal) {
    try {
        const WooCommerceRestApi = require("@woocommerce/woocommerce-rest-api").default;
        
        const wooApi = new WooCommerceRestApi({
            url: process.env.NEXT_PUBLIC_WORDPRESS_URL,
            consumerKey: process.env.WOO_CONSUMER_KEY,
            consumerSecret: process.env.WOO_CONSUMER_SECRET,
            version: "wc/v3"
        });
        
        const order = await wooApi.get(`orders/${orderId}`);
        const orderData = order.data;
        
        console.log('\n📋 PEDIDO NO WOOCOMMERCE:');
        console.log('- ID:', orderData.id);
        console.log('- Total:', orderData.total);
        console.log('- Status:', orderData.status);
        
        // Verificar se o total está correto
        const actualTotal = parseFloat(orderData.total);
        const expected = parseFloat(expectedTotal);
        
        console.log('\n🎯 VERIFICAÇÃO DO TOTAL:');
        console.log('- Esperado:', expected.toFixed(2));
        console.log('- Atual:', actualTotal.toFixed(2));
        console.log('- Diferença:', Math.abs(expected - actualTotal).toFixed(2));
        
        if (Math.abs(expected - actualTotal) < 0.01) {
            console.log('✅ TOTAL CORRETO!');
        } else {
            console.log('❌ TOTAL INCORRETO!');
        }
        
        // Mostrar detalhes dos itens
        console.log('\n📦 ITENS DO PEDIDO:');
        orderData.line_items.forEach((item, index) => {
            console.log(`- Item ${index + 1}: ${item.name}`);
            console.log(`  Preço: R$ ${item.price}`);
            console.log(`  Qtd: ${item.quantity}`);
            console.log(`  Total: R$ ${item.total}`);
        });
        
        // Mostrar detalhes do frete
        if (orderData.shipping_lines && orderData.shipping_lines.length > 0) {
            console.log('\n🚚 FRETE:');
            orderData.shipping_lines.forEach((shipping, index) => {
                console.log(`- Frete ${index + 1}: ${shipping.method_title}`);
                console.log(`  Total: R$ ${shipping.total}`);
            });
        }
        
    } catch (error) {
        console.log('\n❌ Erro ao verificar pedido:', error.message);
    }
}

// Executar teste
if (require.main === module) {
    testRealSiteData();
}

module.exports = { testRealSiteData };
