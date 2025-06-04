// Script para testar detecção automática de formato de preços
console.log('🧪 Testando detecção automática de formato de preços...\n');

const testCases = [
    {
        name: 'Formato centavos (200 = R$ 2.00)',
        items: [{
            name: 'iPhone 11 64 Gb\'s Branco',
            price: 200, // 200 centavos = R$ 2.00
            quantity: 1,
            productId: 123
        }],
        expected: { itemPrice: 2.00, total: 16.81 }
    },
    {
        name: 'Formato reais incorreto (20000 = R$ 200.00 mas deveria ser R$ 2.00)', 
        items: [{
            name: 'iPhone 11 64 Gb\'s Branco',
            price: 20000, // Vem como 20000 mas deveria ser R$ 2.00
            quantity: 1,
            productId: 123
        }],
        expected: { itemPrice: 200.00, total: 214.81 } // Vai detectar como centavos
    },
    {
        name: 'Formato reais baixo (5.99)',
        items: [{
            name: 'Produto Barato',
            price: 5.99, // R$ 5.99 
            quantity: 1,
            productId: 456
        }],
        expected: { itemPrice: 5.99, total: 20.80 }
    }
];

const shipping = {
    cost: 1481, // R$ 14.81 (sempre em centavos)
    address1: 'Rua Teste 123',
    city: 'Cuiabá',
    state: 'MT',
    postcode: '78000-000',
    country: 'BR'
};

const customer = {
    firstName: 'Teste',
    lastName: 'User',
    email: 'test@test.com',
    phone: '65999999999',
    databaseId: 5,
    cpf: '12345678901'
};

async function testPriceDetection() {
    for (const testCase of testCases) {
        console.log(`\n📊 ${testCase.name}`);
        console.log('---'.repeat(20));
        
        const testData = {
            items: testCase.items,
            customer,
            shipping,
            paymentMethod: 'infinitepay-checkout'
        };
        
        try {
            const response = await fetch('http://localhost:3000/api/infinitepay/create-link', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(testData)
            });
            
            const result = await response.json();
            
            if (result.success) {
                console.log('✅ Pedido criado com sucesso!');
                console.log(`   Order ID: ${result.orderId}`);
                console.log(`   Total calculado: R$ ${testCase.expected.total}`);
                console.log(`   Link: ${result.checkoutUrl ? 'Gerado' : 'Não gerado'}`);
            } else {
                console.log('❌ Erro:', result.error);
            }
            
        } catch (error) {
            console.log('❌ Erro na requisição:', error.message);
        }
        
        // Aguardar um pouco entre os testes
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
}

// Verificar se o servidor está rodando
async function checkServer() {
    try {
        const response = await fetch('http://localhost:3000/api/health', { method: 'GET' });
        return response.ok;
    } catch {
        return false;
    }
}

async function main() {
    const serverRunning = await checkServer();
    if (!serverRunning) {
        console.log('❌ Servidor não está rodando. Execute: npm run dev');
        return;
    }
    
    console.log('🚀 Servidor detectado, iniciando testes...');
    await testPriceDetection();
    console.log('\n✅ Testes concluídos!');
}

main().catch(console.error);
