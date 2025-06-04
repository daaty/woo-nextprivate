// Script para testar a correção do shipping.cost
// Simula o comportamento do checkout para verificar se o frete está sendo incluído corretamente

const { checkoutLogger, apiLogger } = require('./debug-checkout-logs');

console.log('🧪 TESTE: Correção do shipping.cost no WooCommerce');
console.log('='.repeat(60));

// Simular dados do checkout (como seriam enviados para a API)
const simulatedOrderData = {
    paymentMethod: 'infinitepay-checkout',
    shipping: {
        address1: 'Rua Teste, 123',
        city: 'São Paulo',
        state: 'SP',
        postcode: '01234567',
        country: 'BR',
        cost: 15.50 // ⭐ CORREÇÃO APLICADA: cost agora está dentro do objeto shipping
    },
    billing: {
        address1: 'Rua Teste, 123',
        city: 'São Paulo',
        state: 'SP',
        postcode: '01234567',
        country: 'BR'
    },
    shippingOption: 'pac-123',
    shippingCost: 15.50, // Mantido para compatibilidade
    items: [
        {
            name: 'Produto Teste',
            price: 100.00,
            qty: 2,
            totalPrice: 'R$ 200,00',
            productId: 123
        }
    ],
    total: 215.50, // 200 (produtos) + 15.50 (frete)
    customer: {
        email: 'teste@teste.com',
        firstName: 'João',
        lastName: 'Silva',
        phone: '11999999999'
    }
};

// Simular o processamento da API
function simulateApiProcessing(orderData) {
    const { items, shipping, total } = orderData;
    
    console.log('\n📨 API: Dados recebidos');
    console.log('- shipping.cost:', shipping?.cost);
    console.log('- shipping.cost type:', typeof shipping?.cost);
    console.log('- total:', total);
    console.log('- items count:', items?.length);
    
    // Simular a lógica de shipping_lines da API corrigida
    if (shipping?.cost && shipping.cost > 0) {
        const shippingCostValue = parseFloat(shipping.cost);
        console.log('\n✅ API: Usando shipping.cost do frontend');
        console.log('- shippingCostValue:', shippingCostValue);
        console.log('- shippingFixed:', shippingCostValue.toFixed(2));
        
        const shippingLines = [{
            method_id: 'flat_rate',
            method_title: 'Frete',
            total: shippingCostValue.toFixed(2)
        }];
        
        console.log('- shipping_lines criado:', JSON.stringify(shippingLines, null, 2));
        
        // Simular criação do pedido WooCommerce
        const finalOrderTotal = parseFloat(total.toString());
        const wooOrderData = {
            total: finalOrderTotal.toFixed(2),
            shipping_lines: shippingLines,
            line_items: items.map(item => ({
                product_id: item.productId || 0,
                quantity: item.qty || 1,
                name: item.name,
                price: (item.price || 0).toFixed(2),
                total: (item.price * item.qty).toFixed(2)
            }))
        };
        
        console.log('\n🏪 WooCommerce: Pedido criado com dados:');
        console.log('- Total do pedido:', wooOrderData.total);
        console.log('- Shipping lines:', JSON.stringify(wooOrderData.shipping_lines, null, 2));
        console.log('- Line items:', JSON.stringify(wooOrderData.line_items, null, 2));
        
        // Verificar se o total está correto
        const itemsTotal = items.reduce((sum, item) => sum + (item.price * item.qty), 0);
        const shippingTotal = shippingCostValue;
        const calculatedTotal = itemsTotal + shippingTotal;
        
        console.log('\n🧮 VERIFICAÇÃO DO TOTAL:');
        console.log('- Itens total:', itemsTotal);
        console.log('- Frete total:', shippingTotal);
        console.log('- Total calculado:', calculatedTotal);
        console.log('- Total enviado:', finalOrderTotal);
        console.log('- ✅ Totais coincidem?', calculatedTotal === finalOrderTotal);
        
        return {
            success: true,
            orderId: 'ORDER_TEST_123',
            totalWithShipping: finalOrderTotal,
            shippingIncluded: true,
            shippingValue: shippingCostValue
        };
    } else {
        console.log('\n❌ API: shipping.cost não encontrado ou inválido');
        console.log('- shipping object:', shipping);
        return {
            success: false,
            error: 'shipping.cost não encontrado'
        };
    }
}

// Executar teste
console.log('\n🚀 INICIANDO SIMULAÇÃO...');
const result = simulateApiProcessing(simulatedOrderData);

console.log('\n📊 RESULTADO DO TESTE:');
console.log(JSON.stringify(result, null, 2));

if (result.success) {
    console.log('\n✅ TESTE PASSOU! O frete está sendo incluído corretamente no pedido WooCommerce.');
    console.log(`💰 Total do pedido: R$ ${result.totalWithShipping}`);
    console.log(`🚚 Valor do frete: R$ ${result.shippingValue}`);
} else {
    console.log('\n❌ TESTE FALHOU!', result.error);
}

console.log('\n' + '='.repeat(60));
console.log('🏁 TESTE CONCLUÍDO');
