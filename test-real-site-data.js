// Script para simular exatamente o que o site está enviando
console.log('🧪 Simulando pedido exato do SITE...\n');

// Dados exatos que apareceram no log do site
const siteOrderData = {
    items: [
        {
            productId: 137,
            cartKey: '3988c7f88ebcb58c6ce932b957b6f332',
            name: "iPhone 11 64 Gb's Branco",
            qty: 1,
            price: 2, // R$ 2.00 (preço em reais como vem do site)
            totalPrice: 'R$&nbsp;2,00',
            image: {
                sourceUrl: 'https://rota.rotadoscelulares.com/wp-content/uploads/2025/04/ChatGPT-Image-14-de-abr.-de-2025-17_43_11.png',
                srcSet: 'https://rota.rotadoscelulares.com/wp-content/uploads/2025/04/ChatGPT-Image-14-de-abr.-de-2025-17_43_11-200x300.png 200w',
                title: 'ChatGPT Image 14 de abr. de 2025, 17_43_11',
                altText: ''
            }
        }
    ],
    customer: {
        firstName: 'Wesley',
        lastName: 'Silva',
        email: 'arctic-pkr@hotmail.com',
        phone: '65999999999',
        databaseId: 5,
        cpf: '12345678901'
    },
    shipping: {
        cost: 0.22, // R$ 0.22 (frete em reais como calculado no site)
        address1: 'Rua Teste 123',
        city: 'Cuiabá',
        state: 'MT',
        postcode: '78000-000',
        country: 'BR'
    },
    total: 23.55, // TOTAL CORRETO DO SITE: R$ 23.55
    paymentMethod: 'infinitepay-checkout'
};

async function testRealSiteData() {
    try {
        console.log('📤 Enviando dados EXATOS do site para API...');
        console.log('🎯 Total esperado: R$ 23.55 (do site)');
        console.log('🎯 Item: R$ 2.00');
        console.log('🎯 Frete: R$ 0.22');
        console.log('');
        
        const response = await fetch('http://localhost:3000/api/infinitepay/create-link', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(siteOrderData)
        });
        
        const result = await response.json();
        
        console.log('📥 Resposta da API:');
        console.log(`Status: ${response.status}`);
        console.log(`Success: ${result.success}`);
        
        if (result.success) {
            console.log(`✅ Pedido criado: #${result.orderId}`);
            console.log(`🔗 Checkout URL: ${result.checkoutUrl ? 'Gerado' : 'Erro'}`);
            
            // Verificar o pedido criado
            setTimeout(async () => {
                console.log('\n🔍 Verificando pedido criado...');
                
                try {
                    const WooCommerceRestApi = require('@woocommerce/woocommerce-rest-api').default;
                    const wooApi = new WooCommerceRestApi({
                        url: 'https://rota.rotadoscelulares.com',
                        consumerKey: 'ck_5c4ee8894628afae3de00713c32d90b17bb53b05',
                        consumerSecret: 'cs_2059eb6cf2a4319f68bcfd7541ab2bceca14cb97',
                        version: 'wc/v3'
                    });
                    
                    const order = await wooApi.get(`orders/${result.orderId}`);
                    const orderData = order.data;
                    
                    const actualTotal = parseFloat(orderData.total);
                    const actualShipping = parseFloat(orderData.shipping_total);
                    const actualItemPrice = parseFloat(orderData.line_items[0]?.price);
                    
                    console.log(`\n📊 RESULTADO FINAL:`);
                    console.log(`   Pedido: #${orderData.number}`);
                    console.log(`   Total: R$ ${actualTotal}`);
                    console.log(`   Frete: R$ ${actualShipping}`);
                    console.log(`   Item: R$ ${actualItemPrice}`);
                    console.log('');
                    
                    // Verificações
                    const totalCorrect = actualTotal === 23.55;
                    const itemCorrect = actualItemPrice === 2.00;
                    const shippingCorrect = Math.abs(actualShipping - 21.55) < 0.01; // 23.55 - 2.00 = 21.55
                    
                    console.log(`✅ Verificações:`);
                    console.log(`   Total correto (R$ 23.55): ${totalCorrect ? '✅' : '❌'}`);
                    console.log(`   Item correto (R$ 2.00): ${itemCorrect ? '✅' : '❌'}`);
                    console.log(`   Frete calculado correto: ${shippingCorrect ? '✅' : '❌'}`);
                    
                    if (totalCorrect && itemCorrect) {
                        console.log('\n🎉 SITE CORRIGIDO COM SUCESSO!');
                        console.log('   ✅ Total do site preservado');
                        console.log('   ✅ Preços dos itens corretos');
                        console.log('   ✅ Frete calculado automaticamente');
                    } else {
                        console.log('\n⚠️ Ainda há problemas a corrigir...');
                    }
                    
                } catch (error) {
                    console.log('❌ Erro ao verificar pedido:', error.message);
                }
            }, 2000);
            
        } else {
            console.log('❌ Erro:', result.error);
        }
        
    } catch (error) {
        console.log('❌ Erro na requisição:', error.message);
    }
}

// Verificar servidor e executar
fetch('http://localhost:3000/api/health')
    .then(() => {
        console.log('🚀 Servidor detectado, testando dados reais do site...\n');
        testRealSiteData();
    })
    .catch(() => {
        console.log('❌ Servidor não está rodando. Execute: npm run dev');
    });
