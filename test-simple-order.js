// Test simples para debug do erro 400
const axios = require('axios');

async function testSimpleOrder() {
    try {
        console.log('🧪 Testando criação de pedido simples...');
        
        const data = {
            items: [{
                name: "Test Product",
                price: 200, // R$ 2,00
                quantity: 1,
                productId: 123
            }],
            customer: {
                firstName: "Test",
                lastName: "User", 
                email: "test@test.com",
                databaseId: 5
            },
            shipping: {
                cost: 1481 // R$ 14,81 em centavos
            },
            paymentMethod: "infinitepay-checkout"
        };

        console.log('📤 Dados:', JSON.stringify(data, null, 2));
        
        const response = await axios.post('http://localhost:3000/api/infinitepay/create-link', data, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        console.log('📥 Resposta:', response.data);
        
    } catch (error) {
        console.error('❌ Erro:', error.response?.data || error.message);
        if (error.response?.data?.details) {
            console.error('🔍 Detalhes:', error.response.data.details);
        }
    }
}

testSimpleOrder();
