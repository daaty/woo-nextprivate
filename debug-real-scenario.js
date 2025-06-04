/**
 * Script para debugging do cenário real onde o frete não está sendo incluído
 * Vamos verificar cenários específicos que podem estar causando o problema
 */

// Cenários problemáticos possíveis:

console.log('=== DEBUGGING CENÁRIOS PROBLEMÁTICOS ===');
console.log('');

// 1. CENÁRIO: shippingCost é 0 ou undefined
console.log('1. CENÁRIO: shippingCost = 0 ou undefined');
const testShippingCost1 = 0;
const testCartTotal1 = "199.90";
const total1 = parseFloat(testCartTotal1) + testShippingCost1;
console.log(`   cartTotal: ${testCartTotal1}, shippingCost: ${testShippingCost1}`);
console.log(`   Total enviado: ${total1}`);
console.log(`   ❌ PROBLEMA: Se shippingCost for 0, o total será apenas dos produtos!`);
console.log('');

// 2. CENÁRIO: selectedShipping é null/undefined
console.log('2. CENÁRIO: selectedShipping não foi selecionado');
const testSelectedShipping2 = null;
const testShippingOptions2 = [
    { id: '04014', name: 'SEDEX', price: 15.50 },
    { id: '04510', name: 'PAC', price: 12.30 }
];
console.log(`   selectedShipping: ${testSelectedShipping2}`);
console.log(`   shippingOptions: ${JSON.stringify(testShippingOptions2)}`);
console.log(`   ❌ PROBLEMA: Se selectedShipping for null, shippingCost não será definido!`);
console.log('');

// 3. CENÁRIO: Opção de frete selecionada com preço 0 (frete grátis)
console.log('3. CENÁRIO: Frete grátis selecionado');
const testSelectedShipping3 = '04510';
const testShippingOptions3 = [
    { id: '04014', name: 'SEDEX', price: 15.50 },
    { id: '04510', name: 'PAC (Frete Grátis)', price: 0 }
];
const selectedOption3 = testShippingOptions3.find(opt => opt.id === testSelectedShipping3);
const shippingCost3 = selectedOption3 ? selectedOption3.price : 0;
console.log(`   selectedShipping: ${testSelectedShipping3}`);
console.log(`   Opção encontrada: ${JSON.stringify(selectedOption3)}`);
console.log(`   shippingCost calculado: ${shippingCost3}`);
console.log(`   ✅ VÁLIDO: Frete grátis legítimo deve resultar em shippingCost = 0`);
console.log('');

// 4. CENÁRIO: cartTotal não é um número válido
console.log('4. CENÁRIO: cartTotal inválido');
const testCartTotal4 = "NaN";
const testShippingCost4 = 15.50;

const priceToNumber = (price) => {
    if (typeof price === 'number') {
        return isFinite(price) ? price : 0;
    }
    
    if (!price || typeof price !== 'string') {
        return 0;
    }
    
    let cleanPrice = price.replace(/[^\d.,\-]/g, '');
    
    if (cleanPrice.includes(',') && cleanPrice.includes('.')) {
        cleanPrice = cleanPrice.replace(/\./g, '').replace(',', '.');
    } else if (cleanPrice.includes(',')) {
        cleanPrice = cleanPrice.replace(',', '.');
    }
    
    const result = parseFloat(cleanPrice) || 0;
    return isFinite(result) ? result : 0;
};

const convertedCartTotal4 = priceToNumber(testCartTotal4);
const total4 = convertedCartTotal4 + testShippingCost4;
console.log(`   cartTotal: "${testCartTotal4}"`);
console.log(`   priceToNumber(cartTotal): ${convertedCartTotal4}`);
console.log(`   shippingCost: ${testShippingCost4}`);
console.log(`   Total calculado: ${total4}`);
console.log(`   ❌ PROBLEMA: Se cartTotal for inválido, o total será apenas o frete!`);
console.log('');

// 5. CENÁRIO: Timing - usuário finaliza antes de selecionar frete
console.log('5. CENÁRIO: Usuário finaliza pedido antes de calcular/selecionar frete');
const testShippingCalculated5 = false;
const testSelectedShipping5 = null;
const testShippingCost5 = 0;
console.log(`   Frete foi calculado: ${testShippingCalculated5}`);
console.log(`   selectedShipping: ${testSelectedShipping5}`);
console.log(`   shippingCost: ${testShippingCost5}`);
console.log(`   ❌ PROBLEMA: Se usuário finalizar antes de calcular frete, shippingCost = 0!`);
console.log('');

// 6. CENÁRIO: Processamento incorreto na API create-link.js
console.log('6. CENÁRIO: API create-link.js recebe dados incorretos');
const testOrderData6 = {
    total: 199.90, // SEM frete incluído
    shippingCost: 15.50, // Frete separado (mas não usado na API)
    items: [{
        price: 199.90,
        qty: 1
    }]
};

const itemsTotal6 = testOrderData6.items.reduce((sum, item) => sum + (item.price * item.qty), 0);
const shippingTotal6 = testOrderData6.total - itemsTotal6;

console.log(`   total recebido: ${testOrderData6.total}`);
console.log(`   itemsTotal calculado: ${itemsTotal6}`);
console.log(`   shippingTotal (total - itens): ${shippingTotal6}`);
console.log(`   ❌ PROBLEMA: Se total não incluir frete, shippingTotal será 0!`);
console.log('');

// 7. CENÁRIO: Frete é adicionado como "line_item" em vez de "shipping_line"
console.log('7. CENÁRIO: Verificação de shipping_lines no WooCommerce');
const testWooData7 = {
    line_items: [
        { product_id: 123, quantity: 1, total: "199.90" }
    ],
    shipping_lines: [
        { method_id: 'flat_rate', method_title: 'Frete', total: "0.00" } // PROBLEMA!
    ]
};

console.log(`   line_items[0].total: ${testWooData7.line_items[0].total}`);
console.log(`   shipping_lines[0].total: ${testWooData7.shipping_lines[0].total}`);
console.log(`   ❌ PROBLEMA: shipping_lines com total 0.00!`);
console.log('');

// RESUMO DOS POSSÍVEIS PROBLEMAS
console.log('=== POSSÍVEIS CAUSAS DO PROBLEMA ===');
console.log('1. ❌ shippingCost não está sendo definido (selectedShipping = null)');
console.log('2. ❌ Usuário finaliza pedido antes de calcular frete');
console.log('3. ❌ cartTotal está corrompido/inválido');
console.log('4. ❌ Erro no cálculo de shippingTotal na API create-link.js');
console.log('5. ❌ shipping_lines está sendo criado com total 0');
console.log('');

console.log('=== PONTOS DE VERIFICAÇÃO ===');
console.log('✅ Verificar logs do checkout.js para valores de total enviado');
console.log('✅ Verificar se selectedShipping está definido antes de finalizar');
console.log('✅ Verificar logs da API create-link.js para shipping_lines');
console.log('✅ Verificar pedidos criados no WooCommerce admin');
console.log('✅ Adicionar validação no checkout para impedir finalização sem frete');
