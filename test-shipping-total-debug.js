/**
 * Teste específico para verificar se o total está sendo enviado corretamente 
 * com o frete incluído do checkout.js para create-link.js
 */

// Simular dados do checkout
const cartTotal = "199.90"; // Valor dos produtos
const shippingCost = 15.50; // Custo do frete
const selectedShipping = "04014"; // SEDEX

console.log('=== TESTE DE TOTAL COM FRETE ===');
console.log('');

// Simular a função priceToNumber do utils/format-price.js
const priceToNumber = (price) => {
    if (typeof price === 'number') {
        return isFinite(price) ? price : 0;
    }
    
    if (!price || typeof price !== 'string') {
        return 0;
    }
    
    // Remove tudo exceto números, vírgulas e pontos
    let cleanPrice = price.replace(/[^\d.,\-]/g, '');
    
    // Trata caso especial brasileiro com vírgula como separador decimal
    if (cleanPrice.includes(',') && cleanPrice.includes('.')) {
        // Se tem tanto vírgula quanto ponto, a vírgula é separador decimal
        cleanPrice = cleanPrice.replace(/\./g, '').replace(',', '.');
    } else if (cleanPrice.includes(',')) {
        // Se só tem vírgula, substitui por ponto
        cleanPrice = cleanPrice.replace(',', '.');
    }
    
    const result = parseFloat(cleanPrice) || 0;
    return isFinite(result) ? result : 0;
};

console.log('1. CÁLCULO NO CHECKOUT.JS:');
console.log('   cartTotal (string):', cartTotal);
console.log('   shippingCost (number):', shippingCost);
console.log('   priceToNumber(cartTotal):', priceToNumber(cartTotal));
console.log('   Total calculado (checkout):', priceToNumber(cartTotal) + shippingCost);
console.log('');

// Simular o que é enviado para a API
const orderData = {
    items: [
        {
            productId: 123,
            name: "Produto Teste",
            price: 199.90,
            qty: 1,
            totalPrice: "R$ 199,90"
        }
    ],
    total: priceToNumber(cartTotal) + shippingCost,
    shippingCost: shippingCost,
    shippingOption: selectedShipping
};

console.log('2. DADOS ENVIADOS PARA API create-link.js:');
console.log('   orderData.total:', orderData.total);
console.log('   orderData.shippingCost:', orderData.shippingCost);
console.log('');

// Simular o processamento na API create-link.js
const { total, items } = orderData;

// USAR O TOTAL DO SITE - NÃO RECALCULAR!
const finalOrderTotal = total ? parseFloat(total.toString()) : 0;

console.log('3. PROCESSAMENTO NA API create-link.js:');
console.log('   total recebido:', total);
console.log('   finalOrderTotal:', finalOrderTotal);

// Simular cálculo dos itens
const processItemForWooCommerce = (item) => {
    let itemPrice = item.price || 0;
    
    if (!itemPrice || isNaN(itemPrice) || itemPrice <= 0) {
        if (item.totalPrice) {
            const cleanPrice = item.totalPrice.replace(/[^\d.,\-]/g, '');
            const convertedPrice = cleanPrice.includes(',') ? 
                parseFloat(cleanPrice.replace(',', '.')) : parseFloat(cleanPrice);
            itemPrice = isNaN(convertedPrice) ? 0 : convertedPrice;
        }
    }
    
    return itemPrice;
};

// Calcular total dos itens
const itemsTotal = items.reduce((sum, item) => {
    const itemPrice = processItemForWooCommerce(item);
    return sum + (itemPrice * (item.quantity || item.qty || 1));
}, 0);

// Shipping = total do site - total dos itens
const shippingTotal = finalOrderTotal - itemsTotal;

console.log('   itemsTotal calculado:', itemsTotal);
console.log('   shippingTotal calculado (total - itens):', shippingTotal);
console.log('');

// Simular criação do pedido WooCommerce
const wooCommerceOrderData = {
    payment_method: 'infinitepay-checkout',
    payment_method_title: 'Infinitepay Checkout',
    set_paid: false,
    billing: {
        first_name: 'Cliente',
        last_name: 'Teste',
        email: 'teste@exemplo.com'
    },
    shipping: {
        first_name: 'Cliente',
        last_name: 'Teste'
    },
    line_items: items.map(item => ({
        product_id: item.productId,
        quantity: item.qty || 1,
        total: (processItemForWooCommerce(item) * (item.qty || 1)).toFixed(2)
    })),
    shipping_lines: [{
        method_id: 'flat_rate',
        method_title: 'Frete',
        total: Math.max(0, shippingTotal).toFixed(2)
    }]
};

console.log('4. DADOS PARA WOOCOMMERCE:');
console.log('   line_items[0].total:', wooCommerceOrderData.line_items[0].total);
console.log('   shipping_lines[0].total:', wooCommerceOrderData.shipping_lines[0].total);
console.log('');

// Calcular total do pedido no WooCommerce
const wooTotalItems = wooCommerceOrderData.line_items.reduce((sum, item) => 
    sum + parseFloat(item.total), 0);
const wooTotalShipping = wooCommerceOrderData.shipping_lines.reduce((sum, line) => 
    sum + parseFloat(line.total), 0);
const wooGrandTotal = wooTotalItems + wooTotalShipping;

console.log('5. TOTAL FINAL NO WOOCOMMERCE:');
console.log('   Total dos produtos:', wooTotalItems.toFixed(2));
console.log('   Total do frete:', wooTotalShipping.toFixed(2));
console.log('   TOTAL GERAL:', wooGrandTotal.toFixed(2));
console.log('');

// Verificação
const originalTotal = priceToNumber(cartTotal) + shippingCost;
const isCorrect = Math.abs(wooGrandTotal - originalTotal) < 0.01;

console.log('6. VERIFICAÇÃO:');
console.log('   Total esperado (checkout):', originalTotal.toFixed(2));
console.log('   Total no WooCommerce:', wooGrandTotal.toFixed(2));
console.log('   ✅ Total está correto?', isCorrect ? 'SIM' : 'NÃO');

if (!isCorrect) {
    console.log('   ❌ DIFERENÇA:', (wooGrandTotal - originalTotal).toFixed(2));
}

console.log('');
console.log('=== RESUMO DO FLUXO ===');
console.log('1. checkout.js calcula: produtos + frete');
console.log('2. create-link.js recebe o total já calculado');
console.log('3. create-link.js subtrai produtos do total para obter frete');
console.log('4. WooCommerce recebe produtos + frete separados');
console.log('5. WooCommerce soma tudo novamente');
console.log('');

if (isCorrect) {
    console.log('✅ A lógica está funcionando corretamente!');
    console.log('   O pedido no WooCommerce terá o valor total correto.');
} else {
    console.log('❌ PROBLEMA IDENTIFICADO!');
    console.log('   O pedido no WooCommerce não terá o valor total correto.');
    console.log('   Verifique se:');
    console.log('   - shippingCost está sendo definido corretamente no checkout');
    console.log('   - priceToNumber está convertendo cartTotal corretamente');
    console.log('   - processItemForWooCommerce está calculando preços corretos');
}
