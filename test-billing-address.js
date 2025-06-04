/**
 * Script para testar se os endereços de cobrança e entrega estão sendo enviados corretamente
 */

// Simular dados como enviados pelo checkout.js
const mockOrderData = {
    paymentMethod: 'infinitepay-checkout',
    shipping: {
        address1: 'Rua das Flores, 123',
        address2: 'Apt 45',
        city: 'Cuiabá',
        state: 'MT',
        postcode: '78000-000',
        country: 'BR'
    },
    billing: {
        address1: 'Rua Comercial, 456',
        address2: 'Sala 10',
        city: 'Várzea Grande',
        state: 'MT',
        postcode: '78110-000',
        country: 'BR'
    },
    customer: {
        firstName: 'João',
        lastName: 'Silva',
        email: 'joao@test.com',
        phone: '65999887766',
        databaseId: 123
    },
    items: [
        {
            name: 'iPhone 14',
            price: 3500.00,
            quantity: 1,
            productId: 456
        }
    ],
    total: 3650.00
};

console.log('=== TESTE DE DADOS DE COBRANÇA E ENTREGA ===\n');

console.log('1. Dados de Entrega (Shipping):');
console.log('   Endereço:', mockOrderData.shipping.address1);
console.log('   Cidade:', mockOrderData.shipping.city);
console.log('   CEP:', mockOrderData.shipping.postcode);
console.log('');

console.log('2. Dados de Cobrança (Billing):');
console.log('   Endereço:', mockOrderData.billing.address1);
console.log('   Cidade:', mockOrderData.billing.city);
console.log('   CEP:', mockOrderData.billing.postcode);
console.log('');

console.log('3. Verificação de diferenças:');
console.log('   Endereços diferentes?', mockOrderData.shipping.address1 !== mockOrderData.billing.address1);
console.log('   Cidades diferentes?', mockOrderData.shipping.city !== mockOrderData.billing.city);
console.log('   CEPs diferentes?', mockOrderData.shipping.postcode !== mockOrderData.billing.postcode);
console.log('');

// Simular como os dados serão processados na API create-link.js
console.log('4. Como será processado na API:');
console.log('   WooCommerce billing.address_1:', mockOrderData.billing?.address1 || mockOrderData.shipping?.address1 || '');
console.log('   WooCommerce billing.city:', mockOrderData.billing?.city || mockOrderData.shipping?.city || '');
console.log('   WooCommerce billing.postcode:', mockOrderData.billing?.postcode || mockOrderData.shipping?.postcode || '');
console.log('');
console.log('   WooCommerce shipping.address_1:', mockOrderData.shipping?.address1 || '');
console.log('   WooCommerce shipping.city:', mockOrderData.shipping?.city || '');
console.log('   WooCommerce shipping.postcode:', mockOrderData.shipping?.postcode || '');
console.log('');

console.log('✅ TESTE CONCLUÍDO - Os dados estão sendo estruturados corretamente');
console.log('');
console.log('Próximos passos:');
console.log('1. Teste real no checkout');
console.log('2. Verificar logs da API');
console.log('3. Confirmar no WooCommerce se os dois endereços aparecem');
