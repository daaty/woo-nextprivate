/**
 * Teste específico para debugar problema de endereço de entrega no WooCommerce
 */

const testData = {
    paymentMethod: 'infinitepay-checkout',
    shipping: {
        address1: 'Rua Engenheiro Ricardo Franco',
        address2: '',
        city: 'Cuiabá',
        state: 'Mato Grosso',
        postcode: '78005000',
        country: 'BR'
    },
    billing: {
        address1: 'Rua Engenheiro Ricardo Franco',
        address2: '',
        city: 'Cuiabá',
        state: 'Mato Grosso',
        postcode: '78005000',
        country: 'BR'
    },
    customer: {
        firstName: 'Wesley',
        lastName: 'Silva',
        email: 'arctic-pkr@hotmail.com',
        phone: '66999367808',
        databaseId: 123
    },
    items: [
        {
            name: 'Produto Teste',
            price: 100.00,
            quantity: 1,
            productId: 456
        }
    ],
    total: 110.00,
    shippingCost: 10.00
};

console.log('=== TESTE DE DEBUG - ENDEREÇO DE ENTREGA ===\n');

console.log('1. DADOS SENDO ENVIADOS PELO CHECKOUT:');
console.log('   Shipping:', JSON.stringify(testData.shipping, null, 2));
console.log('   Billing:', JSON.stringify(testData.billing, null, 2));
console.log('');

console.log('2. COMO SERÁ PROCESSADO NA API create-link.js:');

// Simular a lógica da API
const { items, customer, shipping, billing, total, paymentMethod } = testData;

console.log('   Validação shipping:');
console.log('   - Tem address1?', !!shipping?.address1);
console.log('   - Tem postcode?', !!shipping?.postcode);
console.log('   - Válido?', !!(shipping && shipping.address1 && shipping.postcode));

console.log('');
console.log('3. DADOS QUE SERÃO ENVIADOS PARA O WOOCOMMERCE:');

const wooOrderData = {
    customer_id: customer.databaseId || 0,
    payment_method: 'infinitepay-checkout',
    payment_method_title: 'Infinitepay Checkout',
    status: 'pending',
    needs_shipping_address: true,
    billing: {
        first_name: customer.firstName || '',
        last_name: customer.lastName || '',
        email: customer.email,
        phone: customer.phone || '',
        address_1: billing?.address1 || shipping?.address1 || '',
        address_2: billing?.address2 || shipping?.address2 || '',
        city: billing?.city || shipping?.city || '',
        state: billing?.state || shipping?.state || '',
        postcode: billing?.postcode || shipping?.postcode || '',
        country: billing?.country || shipping?.country || 'BR'
    },
    shipping: {
        first_name: customer.firstName || '',
        last_name: customer.lastName || '',
        address_1: shipping?.address1 || '',
        address_2: shipping?.address2 || '',
        city: shipping?.city || '',
        state: shipping?.state || '',
        postcode: shipping?.postcode || '',
        country: shipping?.country || 'BR'
    }
};

console.log('   BILLING para WooCommerce:');
console.log('   - first_name:', wooOrderData.billing.first_name);
console.log('   - address_1:', wooOrderData.billing.address_1);
console.log('   - city:', wooOrderData.billing.city);
console.log('   - postcode:', wooOrderData.billing.postcode);

console.log('');
console.log('   SHIPPING para WooCommerce:');
console.log('   - first_name:', wooOrderData.shipping.first_name);
console.log('   - address_1:', wooOrderData.shipping.address_1);
console.log('   - city:', wooOrderData.shipping.city);
console.log('   - postcode:', wooOrderData.shipping.postcode);

console.log('');
console.log('4. VERIFICAÇÕES:');
console.log('   ✅ Shipping tem dados?', !!wooOrderData.shipping.address_1);
console.log('   ✅ Billing tem dados?', !!wooOrderData.billing.address_1);
console.log('   ✅ needs_shipping_address definido?', wooOrderData.needs_shipping_address);

if (wooOrderData.shipping.address_1 && wooOrderData.billing.address_1) {
    console.log('');
    console.log('✅ TESTE PASSOU - Ambos endereços estão sendo enviados corretamente!');
    console.log('');
    console.log('Se ainda assim o WooCommerce não está mostrando o endereço de entrega, pode ser:');
    console.log('1. Plugin/tema do WooCommerce ocultando os dados');
    console.log('2. Configuração do WooCommerce para produtos virtuais');
    console.log('3. Status do pedido que não mostra endereço de entrega');
    console.log('4. Necessário verificar no banco de dados wp_postmeta');
} else {
    console.log('');
    console.log('❌ TESTE FALHOU - Dados de endereço estão incompletos!');
}

console.log('');
console.log('PRÓXIMOS PASSOS:');
console.log('1. Executar checkout real e verificar logs');
console.log('2. Verificar no banco de dados WooCommerce se os dados estão salvos');
console.log('3. Verificar configurações do tema/plugin do WooCommerce');
