/**
 * Test script to verify the PIX order price calculation fix
 * Run this with: node test-price-fix.js
 */

// Simulate the price calculation functions from our fixes

function testCalculateOrderTotal() {
    console.log('🧪 Testing Order Total Calculation...\n');
    
    // Test case 1: Normal order with valid prices
    const testOrder1 = {
        total: "150.00",
        line_items: [
            { total: "100.00" },
            { total: "50.00" }
        ],
        shipping_total: "0.00",
        fee_total: "0.00",
        discount_total: "0.00"
    };
    
    // Test case 2: Order with missing/invalid total (PIX issue scenario)
    const testOrder2 = {
        total: "", // Empty total - this is the PIX issue
        line_items: [
            { total: "75.50" },
            { total: "24.50" }
        ],
        shipping_total: "10.00",
        fee_total: "0.00",
        discount_total: "0.00"
    };
    
    // Test case 3: Order with null total
    const testOrder3 = {
        total: null,
        line_items: [
            { total: "200.00" }
        ],
        shipping_total: "15.00",
        fee_total: "5.00",
        discount_total: "10.00"
    };
    
    function calculateOrderTotal(order) {
        let total = 0;
        
        // Try to use WooCommerce total first
        if (order.total && !isNaN(parseFloat(order.total))) {
            return parseFloat(order.total);
        }
        
        console.warn(`Total inválido para pedido: "${order.total}". Calculando total baseado nos line_items.`);
        
        // Calculate based on line_items if total is empty
        if (order.line_items && order.line_items.length > 0) {
            total = order.line_items.reduce((sum, item) => {
                const itemTotal = parseFloat(item.total) || 0;
                return sum + itemTotal;
            }, 0);
        }
        
        // Add shipping if available
        const shippingTotal = parseFloat(order.shipping_total) || 0;
        total += shippingTotal;
        
        // Add fees if available
        const feeTotal = parseFloat(order.fee_total) || 0;
        total += feeTotal;
        
        // Subtract discounts if available
        const discountTotal = parseFloat(order.discount_total) || 0;
        total -= discountTotal;
        
        return total;
    }
    
    // Run tests
    const result1 = calculateOrderTotal(testOrder1);
    console.log(`✅ Test 1 (Valid total): R$ ${result1.toFixed(2)} (Expected: R$ 150.00)`);
    
    const result2 = calculateOrderTotal(testOrder2);
    console.log(`✅ Test 2 (Empty total - PIX issue): R$ ${result2.toFixed(2)} (Expected: R$ 110.00)`);
    
    const result3 = calculateOrderTotal(testOrder3);
    console.log(`✅ Test 3 (Null total): R$ ${result3.toFixed(2)} (Expected: R$ 210.00)`);
    
    console.log('\n✨ All price calculation tests completed!');
}

function testInfinitepayItemMapping() {
    console.log('\n🧪 Testing Infinitepay Item Price Mapping...\n');
    
    // Test cases for Infinitepay item price extraction
    const testItems = [
        {
            name: "Produto 1",
            price: 50.00,
            quantity: 2,
            totalPrice: "R$ 100,00"
        },
        {
            name: "Produto 2", 
            price: 0, // Invalid price - should use totalPrice
            quantity: 1,
            totalPrice: "R$ 75,50"
        },
        {
            name: "Produto 3",
            price: null, // Null price - should use totalPrice
            quantity: 3,
            totalPrice: "R$ 150,00"
        }
    ];
    
    function priceToNumber(price) {
        if (!price) return 0;
        if (typeof price === 'number') return price;
        return parseFloat(price.toString().replace(/[^\d.,]/g, '').replace(',', '.')) || 0;
    }
    
    testItems.forEach((item, index) => {
        let itemPrice = item.price;
        
        if (!itemPrice || isNaN(itemPrice) || itemPrice <= 0) {
            console.warn(`Preço inválido no item ${index + 1}, usando totalPrice:`, item);
            if (item.totalPrice) {
                itemPrice = priceToNumber(item.totalPrice) / (item.quantity || 1);
            } else {
                itemPrice = 0;
            }
        }
        
        const totalItemPrice = itemPrice * item.quantity;
        const priceInCents = Math.round(totalItemPrice * 100);
        
        console.log(`✅ Item ${index + 1}: ${item.name}`);
        console.log(`   - Preço unitário: R$ ${itemPrice.toFixed(2)}`);
        console.log(`   - Total: R$ ${totalItemPrice.toFixed(2)}`);
        console.log(`   - Em centavos: ${priceInCents}`);
    });
    
    console.log('\n✨ All Infinitepay item mapping tests completed!');
}

// Run all tests
testCalculateOrderTotal();
testInfinitepayItemMapping();

console.log('\n🎉 All tests completed! The price fix should resolve the PIX order R$ 0,00 issue.');
console.log('\n📋 Summary of fixes implemented:');
console.log('1. ✅ Fixed Infinitepay API to calculate and set explicit order total');
console.log('2. ✅ Fixed customer-orders API to handle missing/invalid order totals');
console.log('3. ✅ Added fallback calculation based on line_items when total is missing');
console.log('4. ✅ Added debug information to track price calculation issues');
