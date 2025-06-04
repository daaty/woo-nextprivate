/**
 * Sistema de logs para debugging do fluxo de checkout real
 * Para identificar onde o frete está sendo perdido no processo
 */

const fs = require('fs');
const path = require('path');

// Função para criar logs com timestamp
const createLogger = (logFile) => {
    const logPath = path.join(__dirname, 'logs', logFile);
    
    // Criar diretório logs se não existir
    const logDir = path.dirname(logPath);
    if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
    }
    
    return {
        log: (message, data = null) => {
            const timestamp = new Date().toISOString();
            const logEntry = {
                timestamp,
                message,
                data
            };
            
            const logLine = JSON.stringify(logEntry, null, 2) + '\n';
            
            // Append ao arquivo
            fs.appendFileSync(logPath, logLine);
            
            // Também exibir no console durante desenvolvimento
            console.log(`[${timestamp}] ${message}`);
            if (data) {
                console.log('Data:', data);
            }
        },
        
        clear: () => {
            if (fs.existsSync(logPath)) {
                fs.unlinkSync(logPath);
            }
        }
    };
};

// Exportar loggers específicos
module.exports = {
    checkoutLogger: createLogger('checkout-debug.log'),
    apiLogger: createLogger('api-debug.log'),
    shippingLogger: createLogger('shipping-debug.log'),
    orderLogger: createLogger('order-debug.log')
};

// Função para analisar logs e identificar problemas
const analyzeLogs = () => {
    const logsDir = path.join(__dirname, 'logs');
    
    if (!fs.existsSync(logsDir)) {
        console.log('❌ Diretório de logs não encontrado');
        return;
    }
    
    console.log('=== ANÁLISE DOS LOGS ===\n');
    
    const logFiles = ['checkout-debug.log', 'api-debug.log', 'shipping-debug.log', 'order-debug.log'];
    
    logFiles.forEach(logFile => {
        const logPath = path.join(logsDir, logFile);
        
        if (fs.existsSync(logPath)) {
            console.log(`📄 ${logFile}:`);
            const content = fs.readFileSync(logPath, 'utf8');
            
            if (content.trim()) {
                const lines = content.trim().split('\n');
                console.log(`   ${lines.length} entradas encontradas`);
                
                // Mostrar últimas 3 entradas
                const lastEntries = lines.slice(-3);
                lastEntries.forEach((line, index) => {
                    try {
                        const entry = JSON.parse(line);
                        console.log(`   ${index + 1}. [${entry.timestamp}] ${entry.message}`);
                    } catch (e) {
                        console.log(`   ${index + 1}. ${line.substring(0, 100)}...`);
                    }
                });
            } else {
                console.log('   Arquivo vazio');
            }
            console.log('');
        } else {
            console.log(`❌ ${logFile}: não encontrado\n`);
        }
    });
};

// Se executado diretamente
if (require.main === module) {
    const command = process.argv[2];
    
    if (command === 'analyze') {
        analyzeLogs();
    } else if (command === 'clear') {
        const logsDir = path.join(__dirname, 'logs');
        if (fs.existsSync(logsDir)) {
            fs.rmSync(logsDir, { recursive: true });
            console.log('✅ Logs limpos');
        }
    } else {
        console.log('Uso:');
        console.log('  node debug-checkout-logs.js analyze  - Analisar logs existentes');
        console.log('  node debug-checkout-logs.js clear    - Limpar todos os logs');
    }
}
