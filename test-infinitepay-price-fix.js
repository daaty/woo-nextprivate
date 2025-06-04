// Script para testar criação de pedido via API Infinitepay corrigida
console.log('🧪 Testando API Infinitepay com dados do pedido #171...\n');

const testOrderData = {
    items: [
        {
            name: 'iPhone 11 64 Gb\'s Branco',
            price: 200, // R$ 2.00 (valor em centavos)
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
        cost: 1481, // R$ 14.81 (valor em centavos) 
        address1: 'Rua Teste 123',
        address2: '',
        city: 'Cuiabá',
        state: 'MT',
        postcode: '78000-000',
        country: 'BR'
    },
    total: 1681, // R$ 16.81 (valor em centavos)
    paymentMethod: 'infinitepay-checkout'
};

async function testInfinitepayAPI() {
    try {
        console.log('📤 Enviando dados para API /api/infinitepay/create-link');
        console.log('Dados:', JSON.stringify(testOrderData, null, 2));
        
        const response = await fetch('http://localhost:3000/api/infinitepay/create-link', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(testOrderData)
        });
        
        const result = await response.json();
        
        console.log('\n📥 Resposta da API:');
        console.log('Status:', response.status);
        console.log('Success:', result.success);
        
        if (result.success) {
            console.log('✅ Pedido criado com sucesso!');
            console.log('Order ID:', result.orderId);
            console.log('Order Number:', result.orderNumber);
            console.log('Checkout URL:', result.checkoutUrl);
            
            // Verificar se o valor foi definido corretamente
            if (result.orderData) {
                console.log('\n💰 Verificação de valores:');
                console.log('Total do pedido:', result.orderData.total);
                console.log('Shipping total:', result.orderData.shipping_total);
                
                if (result.orderData.line_items) {
                    console.log('Line items:');
                    result.orderData.line_items.forEach(item => {
                        console.log(`  - ${item.name}: ${item.quantity}x ${item.price} = ${item.total}`);
                    });
                }
            }
        } else {
            console.log('❌ Erro ao criar pedido:');
            console.log('Error:', result.error);
        }
        
    } catch (error) {
        console.error('❌ Erro na requisição:', error.message);
        
        // Se o servidor não estiver rodando, mostrar instrução
        if (error.code === 'ECONNREFUSED') {
            console.log('\n💡 Para testar a API, execute primeiro:');
            console.log('npm run dev');
            console.log('\nE então execute este script novamente.');
        }
    }
}

// Verificar se o servidor está rodando antes de testar
console.log('🔍 Verificando se o servidor Next.js está rodando...');
fetch('http://localhost:3000/api/health')
    .then(() => {
        console.log('✅ Servidor está rodando, iniciando teste...\n');
        return testInfinitepayAPI();
    })
    .catch(() => {
        console.log('❌ Servidor não está rodando');
        console.log('\n💡 Para testar a API, execute primeiro:');
        console.log('npm run dev');
        console.log('\nE então execute este script novamente.');
    });
