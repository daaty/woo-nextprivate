// Script para testar a correção de preços com formato real
console.log('🧪 Testando correção de preços - simulando pedido real...\n');

const testOrderData = {
    items: [
        {
            name: 'iPhone 11 64 Gb\'s Branco',
            price: 200, // R$ 2.00 (formato correto em centavos)
            quantity: 1,
            productId: 123
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
        cost: 1481, // R$ 14.81 (em centavos)
        address1: 'Rua Teste 123',
        address2: '',
        city: 'Cuiabá',
        state: 'MT',
        postcode: '78000-000',
        country: 'BR'
    },
    total: 1681, // R$ 16.81 (em centavos)
    paymentMethod: 'infinitepay-checkout'
};

async function testCorrectedAPI() {
    try {
        console.log('📤 Enviando dados para API corrigida');
        console.log('Produto: R$ 2.00, Frete: R$ 14.81, Total esperado: R$ 16.81\n');
        
        const response = await fetch('http://localhost:3000/api/infinitepay/create-link', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(testOrderData)
        });
        
        const result = await response.json();
        
        console.log('📥 Resposta da API:');
        console.log(`Status: ${response.status}`);
        console.log(`Success: ${result.success}`);
        
        if (result.success) {
            console.log(`✅ Pedido criado: #${result.orderId}`);
            console.log(`🔗 Checkout URL: ${result.checkoutUrl ? 'Gerado' : 'Erro'}`);
            
            // Aguardar um pouco e verificar o pedido criado
            setTimeout(async () => {
                console.log('\n🔍 Verificando pedido criado...');
                
                const WooCommerceRestApi = require('@woocommerce/woocommerce-rest-api').default;
                const wooApi = new WooCommerceRestApi({
                    url: 'https://rota.rotadoscelulares.com',
                    consumerKey: 'ck_5c4ee8894628afae3de00713c32d90b17bb53b05',
                    consumerSecret: 'cs_2059eb6cf2a4319f68bcfd7541ab2bceca14cb97',
                    version: 'wc/v3'
                });
                
                try {
                    const order = await wooApi.get(`orders/${result.orderId}`);
                    const orderData = order.data;
                    
                    console.log(`\n📊 Pedido #${orderData.number}:`);
                    console.log(`   Total: R$ ${orderData.total}`);
                    console.log(`   Frete: R$ ${orderData.shipping_total}`);
                    console.log(`   Produto: ${orderData.line_items[0]?.name}`);
                    console.log(`   Preço unitário: R$ ${orderData.line_items[0]?.price}`);
                    console.log(`   Subtotal item: R$ ${orderData.line_items[0]?.total}`);
                    
                    // Verificar se está correto
                    const totalCorrect = parseFloat(orderData.total) === 16.81;
                    const shippingCorrect = parseFloat(orderData.shipping_total) === 14.81;
                    const priceCorrect = parseFloat(orderData.line_items[0]?.price) === 2.00;
                    
                    console.log(`\n✅ Verificação:`);
                    console.log(`   Total correto (R$ 16.81): ${totalCorrect ? '✅' : '❌'}`);
                    console.log(`   Frete correto (R$ 14.81): ${shippingCorrect ? '✅' : '❌'}`);
                    console.log(`   Preço correto (R$ 2.00): ${priceCorrect ? '✅' : '❌'}`);
                    
                    if (totalCorrect && shippingCorrect && priceCorrect) {
                        console.log('\n🎉 SUCESSO! Correção funcionou perfeitamente!');
                    } else {
                        console.log('\n⚠️  Ainda há problemas. Verificar logs da API.');
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

// Verificar se o servidor está rodando
fetch('http://localhost:3000/api/health')
    .then(() => {
        console.log('🚀 Servidor detectado, iniciando teste...\n');
        testCorrectedAPI();
    })
    .catch(() => {
        console.log('❌ Servidor não está rodando. Execute: npm run dev');
    });
