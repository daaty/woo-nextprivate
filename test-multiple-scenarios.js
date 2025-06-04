// Script para testar múltiplos cenários de preços
console.log('🧪 Testando múltiplos cenários de preços...\n');

const testCases = [
    {
        name: 'Cenário 1: Produto R$ 2.00 + Frete R$ 14.81 (formato centavos)',
        data: {
            items: [{ name: 'iPhone 11', price: 200, quantity: 1, productId: 123 }],
            shipping: { cost: 1481 },
            total: 1681 // em centavos
        },
        expected: { total: 16.81, itemPrice: 2.00, shipping: 14.81 }
    },
    {
        name: 'Cenário 2: Produto R$ 99.90 sem frete (formato centavos)',
        data: {
            items: [{ name: 'Produto Caro', price: 9990, quantity: 1, productId: 456 }],
            shipping: null,
            total: 9990 // em centavos
        },
        expected: { total: 99.90, itemPrice: 99.90, shipping: 0.00 }
    },
    {
        name: 'Cenário 3: Produto R$ 1.50 (formato centavos baixo)',
        data: {
            items: [{ name: 'Produto Barato', price: 150, quantity: 1, productId: 789 }],
            shipping: { cost: 500 }, // R$ 5.00
            total: 650 // em centavos
        },
        expected: { total: 6.50, itemPrice: 1.50, shipping: 5.00 }
    }
];

const customer = {
    firstName: 'Teste',
    lastName: 'User',
    email: 'test@test.com',
    phone: '65999999999',
    databaseId: 5,
    cpf: '12345678901'
};

const shippingAddress = {
    address1: 'Rua Teste 123',
    city: 'Cuiabá',
    state: 'MT',
    postcode: '78000-000',
    country: 'BR'
};

async function testMultipleScenarios() {
    for (let i = 0; i < testCases.length; i++) {
        const testCase = testCases[i];
        console.log(`\n${i + 1}. ${testCase.name}`);
        console.log('='.repeat(50));
        
        const testData = {
            items: testCase.data.items,
            customer,
            shipping: testCase.data.shipping ? { ...testCase.data.shipping, ...shippingAddress } : null,
            total: testCase.data.total,
            paymentMethod: 'infinitepay-checkout'
        };
        
        try {
            const response = await fetch('http://localhost:3000/api/infinitepay/create-link', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(testData)
            });
            
            const result = await response.json();
            
            if (result.success) {
                console.log(`✅ Pedido criado: #${result.orderId}`);
                
                // Verificar pedido após 1 segundo
                setTimeout(async () => {
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
                        
                        console.log(`   📊 Resultados:`);
                        console.log(`      Total: R$ ${actualTotal} ${actualTotal === testCase.expected.total ? '✅' : '❌'}`);
                        console.log(`      Frete: R$ ${actualShipping} ${actualShipping === testCase.expected.shipping ? '✅' : '❌'}`);
                        console.log(`      Item: R$ ${actualItemPrice} ${actualItemPrice === testCase.expected.itemPrice ? '✅' : '❌'}`);
                        
                        const allCorrect = 
                            actualTotal === testCase.expected.total &&
                            actualShipping === testCase.expected.shipping &&
                            actualItemPrice === testCase.expected.itemPrice;
                            
                        console.log(`   ${allCorrect ? '🎉 PASSOU!' : '⚠️ FALHOU!'}`);
                        
                    } catch (error) {
                        console.log(`   ❌ Erro na verificação: ${error.message}`);
                    }
                }, 1000 * (i + 1)); // Escalonar delays
                
            } else {
                console.log(`❌ Erro: ${result.error}`);
            }
            
        } catch (error) {
            console.log(`❌ Erro na requisição: ${error.message}`);
        }
        
        // Aguardar entre testes
        await new Promise(resolve => setTimeout(resolve, 1500));
    }
}

// Verificar servidor e executar
fetch('http://localhost:3000/api/health')
    .then(() => {
        console.log('🚀 Servidor detectado, iniciando testes...');
        testMultipleScenarios();
    })
    .catch(() => {
        console.log('❌ Servidor não está rodando. Execute: npm run dev');
    });
