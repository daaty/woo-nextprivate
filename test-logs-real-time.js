/**
 * Script para testar o sistema de logs em tempo real
 * Execute este script após fazer um pedido para verificar os logs
 */

const { analyzeLogs } = require('./debug-checkout-logs');

console.log('🔍 ANALISANDO LOGS DO ÚLTIMO PEDIDO...\n');

// Executar análise dos logs
try {
    const { execSync } = require('child_process');
    
    // Executar o comando de análise
    const result = execSync('node debug-checkout-logs.js analyze', { 
        encoding: 'utf8',
        cwd: __dirname 
    });
    
    console.log(result);
    
} catch (error) {
    console.log('⚠️  Erro ao executar análise automática, tentando método manual...\n');
    
    // Método manual usando require
    try {
        require('./debug-checkout-logs');
    } catch (err) {
        console.log('❌ Erro ao carregar logs:', err.message);
    }
}

console.log('\n=== PRÓXIMOS PASSOS ===');
console.log('1. Faça um pedido no site');
console.log('2. Execute novamente: node test-logs-real-time.js');
console.log('3. Verifique os logs para identificar onde o frete está sendo perdido');
console.log('\n=== COMANDOS ÚTEIS ===');
console.log('• Limpar logs: node debug-checkout-logs.js clear');
console.log('• Analisar logs: node debug-checkout-logs.js analyze');
console.log('• Ver logs em tempo real: tail -f logs/*.log (Linux/Mac) ou Get-Content logs/*.log -Wait (PowerShell)');
