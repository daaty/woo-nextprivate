/**
 * Logger para debugging do checkout - Versão Frontend
 * Esta versão funciona no navegador usando localStorage e console
 */

// Função para criar logs com timestamp no frontend
const createFrontendLogger = (logType) => {
    return {
        log: (message, data = null) => {
            const timestamp = new Date().toISOString();
            const logEntry = {
                timestamp,
                message,
                data,
                type: logType
            };
            
            // Log no console para debugging imediato
            console.log(`[${logType.toUpperCase()}] ${message}`);
            if (data) {
                console.log('Data:', data);
            }
            
            // Salvar no localStorage para análise posterior (apenas no browser)
            if (typeof window !== 'undefined') {
                try {
                    const storageKey = `debug_${logType}_logs`;
                    const existingLogs = JSON.parse(localStorage.getItem(storageKey) || '[]');
                    existingLogs.push(logEntry);
                    
                    // Manter apenas os últimos 50 logs para evitar overflow
                    if (existingLogs.length > 50) {
                        existingLogs.splice(0, existingLogs.length - 50);
                    }
                    
                    localStorage.setItem(storageKey, JSON.stringify(existingLogs));
                } catch (error) {
                    console.warn('Erro ao salvar log no localStorage:', error);
                }
            }
        },
        
        clear: () => {
            if (typeof window !== 'undefined') {
                const storageKey = `debug_${logType}_logs`;
                localStorage.removeItem(storageKey);
                console.log(`Logs ${logType} limpos do localStorage`);
            }
        },
        
        getLogs: () => {
            if (typeof window !== 'undefined') {
                const storageKey = `debug_${logType}_logs`;
                return JSON.parse(localStorage.getItem(storageKey) || '[]');
            }
            return [];
        }
    };
};

// Exportar loggers específicos para frontend
const checkoutLogger = createFrontendLogger('checkout');
const apiLogger = createFrontendLogger('api');
const shippingLogger = createFrontendLogger('shipping');
const orderLogger = createFrontendLogger('order');

// Função para analisar todos os logs (apenas no browser)
const analyzeLogs = () => {
    if (typeof window === 'undefined') {
        console.log('Análise de logs só funciona no navegador');
        return;
    }
    
    console.log('=== ANÁLISE DOS LOGS FRONTEND ===\n');
    
    const logTypes = ['checkout', 'api', 'shipping', 'order'];
    
    logTypes.forEach(logType => {
        const logs = JSON.parse(localStorage.getItem(`debug_${logType}_logs`) || '[]');
        
        console.log(`📄 ${logType}-debug.log:`);
        
        if (logs.length > 0) {
            console.log(`   ${logs.length} entradas encontradas`);
            
            // Mostrar últimas 3 entradas
            const lastEntries = logs.slice(-3);
            lastEntries.forEach((entry, index) => {
                console.log(`   ${index + 1}. [${entry.timestamp}] ${entry.message}`);
                if (entry.data) {
                    console.log(`      Data:`, entry.data);
                }
            });
        } else {
            console.log('   Nenhum log encontrado');
        }
        console.log('');
    });
};

// Função para limpar todos os logs
const clearAllLogs = () => {
    if (typeof window !== 'undefined') {
        const logTypes = ['checkout', 'api', 'shipping', 'order'];
        logTypes.forEach(logType => {
            localStorage.removeItem(`debug_${logType}_logs`);
        });
        console.log('✅ Todos os logs limpos');
    }
};

// Adicionar funções globais para fácil acesso no console do navegador
if (typeof window !== 'undefined') {
    window.debugLogs = {
        analyze: analyzeLogs,
        clear: clearAllLogs,
        checkout: checkoutLogger,
        api: apiLogger,
        shipping: shippingLogger,
        order: orderLogger
    };
    
    console.log('🔧 Debug logs disponíveis globalmente:');
    console.log('  window.debugLogs.analyze() - Analisar logs');
    console.log('  window.debugLogs.clear() - Limpar logs');
    console.log('  window.debugLogs.checkout - Logger do checkout');
}

// Para compatibilidade com require() no Node.js (quando usado no servidor)
module.exports = {
    checkoutLogger,
    apiLogger,
    shippingLogger,
    orderLogger,
    analyzeLogs,
    clearAllLogs
};
