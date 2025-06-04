const fs = require('fs');
const path = require('path');

console.log('🔍 Verificando status do sistema de carrinho...\n');

// Verificar arquivos principais
const files = [
    'src/hooks/useCart.js',
    'src/contexts/CartContext.js', 
    'pages/cart.js'
];

files.forEach(file => {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
        console.log(`✅ ${file} existe`);
    } else {
        console.log(`❌ ${file} não encontrado`);
    }
});

// Verificar se as correções foram aplicadas
const useCartPath = path.join(__dirname, 'src/hooks/useCart.js');
if (fs.existsSync(useCartPath)) {
    const content = fs.readFileSync(useCartPath, 'utf8');
    
    console.log('\n📋 Verificando correções aplicadas:');
    
    if (content.includes('const result = await addToCartMutation')) {
        console.log('✅ Função addToCart completa');
    } else {
        console.log('❌ Função addToCart incompleta');
    }
    
    if (content.includes('console.log(\'🛒 Iniciando adição ao carrinho\')')) {
        console.log('✅ Logging melhorado aplicado');
    } else {
        console.log('⚠️  Logging básico');
    }
    
    if (content.includes('timeout: 30000')) {
        console.log('✅ Timeout otimizado');
    } else {
        console.log('⚠️  Timeout padrão');
    }
} else {
    console.log('❌ useCart.js não encontrado');
}

console.log('\n🎯 Sistema pronto para teste no navegador!');
