// Script para testar a lógica de cálculo de preços
const WooCommerceRestApi = require('@woocommerce/woocommerce-rest-api').default;

const wooApi = new WooCommerceRestApi({
    url: 'https://rota.rotadoscelulares.com',
    consumerKey: 'ck_5c4ee8894628afae3de00713c32d90b17bb53b05',
    consumerSecret: 'cs_2059eb6cf2a4319f68bcfd7541ab2bceca14cb97',
    version: 'wc/v3'
});

// Simular dados de teste como se viessem do frontend
const testOrderData = {
    items: [
        {
            name: 'iPhone 11 64 Gb\'s Branco',
            price: 200, // R$ 2.00 em centavos
            quantity: 1,
            productId: 123
        }
    ],
    customer: {
        firstName: 'Wesley',
        lastName: 'Silva',
        email: 'arctic-pkr@hotmail.com',
        phone: '65999999999',
        databaseId: 5
    },
    shipping: {
        cost: 1481, // R$ 14.81 em centavos
        address1: 'Rua Teste 123',
        city: 'Cuiabá',
        state: 'MT',
        postcode: '78000-000',
        country: 'BR'
    },
    paymentMethod: 'infinitepay-checkout'
};

// Função para calcular total (mesma lógica da API)
const calculateOrderTotal = (items, shipping) => {
    let itemsTotal = 0;
    
    items.forEach(item => {
        let itemPrice = item.price;
        if (!itemPrice || isNaN(itemPrice) || itemPrice <= 0) {
            console.warn('Preço inválido no item:', item);
            itemPrice = 0;
        }
        itemsTotal += itemPrice * (item.quantity || 1);
    });
    
    const shippingCost = shipping?.cost || 0;
    const orderTotal = itemsTotal + shippingCost;
    
    console.log('Cálculo do total:', {
        itemsTotal: itemsTotal.toFixed(2),
        shippingCost: shippingCost.toString(),
        orderTotal: orderTotal.toFixed(2)
    });
    
    return orderTotal;
};

async function testPriceCalculation() {
    console.log('🧮 Testando cálculo de preços...\n');
    
    // Testar cálculo
    const total = calculateOrderTotal(testOrderData.items, testOrderData.shipping);
    console.log(`Total calculado: R$ ${(total / 100).toFixed(2)}`);
    
    // Simular dados para criação do pedido WooCommerce
    const wooOrderData = {
        customer_id: testOrderData.customer.databaseId,
        payment_method: 'infinitepay-checkout',
        payment_method_title: 'Infinitepay Checkout',
        status: 'pending',
        billing: {
            first_name: testOrderData.customer.firstName,
            last_name: testOrderData.customer.lastName,
            email: testOrderData.customer.email,
            phone: testOrderData.customer.phone
        },
        line_items: testOrderData.items.map(item => {
            const quantity = item.quantity || 1;
            const lineTotal = item.price * quantity;
            
            return {
                product_id: item.productId || 0,
                quantity: quantity,
                name: item.name,
                price: (item.price / 100).toFixed(2), // Converter para reais
                total: (lineTotal / 100).toFixed(2)   // Converter para reais
            };
        }),
        shipping_total: ((testOrderData.shipping?.cost || 0) / 100).toFixed(2),
        total: (total / 100).toFixed(2) // Total em reais
    };
    
    console.log('\n📋 Dados do pedido WooCommerce:');
    console.log('Customer ID:', wooOrderData.customer_id);
    console.log('Total:', wooOrderData.total);
    console.log('Shipping Total:', wooOrderData.shipping_total);
    console.log('Line Items:');
    wooOrderData.line_items.forEach(item => {
        console.log(`  - ${item.name}: ${item.quantity}x ${item.price} = ${item.total}`);
    });
    
    // Verificar se está correto
    const expectedTotal = (200 + 1481) / 100; // R$ 16.81
    const calculatedTotal = parseFloat(wooOrderData.total);
    
    if (Math.abs(expectedTotal - calculatedTotal) < 0.01) {
        console.log('\n✅ Cálculo correto!');
        console.log(`Expected: R$ ${expectedTotal.toFixed(2)}`);
        console.log(`Calculated: R$ ${calculatedTotal.toFixed(2)}`);
    } else {
        console.log('\n❌ Erro no cálculo!');
        console.log(`Expected: R$ ${expectedTotal.toFixed(2)}`);
        console.log(`Calculated: R$ ${calculatedTotal.toFixed(2)}`);
    }
}

testPriceCalculation().catch(console.error);
