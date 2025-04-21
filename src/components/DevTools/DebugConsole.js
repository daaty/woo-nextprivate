import React, { useState, useEffect } from 'react';
import styles from './DebugConsole.module.css';

const DebugConsole = () => {
  const [logs, setLogs] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState('');
  
  useEffect(() => {
    // Interceptar console.log, console.warn e console.error
    const originalConsoleLog = console.log;
    const originalConsoleWarn = console.warn;
    const originalConsoleError = console.error;
    const originalConsoleGroup = console.group;
    const originalConsoleGroupEnd = console.groupEnd;
    
    let groupLevel = 0;
    let groupName = '';
    
    console.group = (...args) => {
      originalConsoleGroup.apply(console, args);
      groupLevel++;
      groupName = args[0] || '';
    };
    
    console.groupEnd = () => {
      originalConsoleGroupEnd.apply(console);
      groupLevel = Math.max(0, groupLevel - 1);
    };
    
    const addLog = (type, args) => {
      const timestamp = new Date().toLocaleTimeString();
      
      // Converter argumentos para string
      const message = args.map(arg => {
        if (typeof arg === 'object') {
          try {
            return JSON.stringify(arg, null, 2);
          } catch (e) {
            return String(arg);
          }
        }
        return String(arg);
      }).join(' ');
      
      // Adicionar indentação para grupos
      const prefix = groupLevel > 0 ? '  '.repeat(groupLevel) + (groupName ? `[${groupName}] ` : '') : '';
      
      // Adicionar o log à lista
      setLogs(prevLogs => [
        { type, message: prefix + message, timestamp },
        ...prevLogs.slice(0, 99) // Manter apenas os 100 logs mais recentes
      ]);
    };
    
    console.log = (...args) => {
      originalConsoleLog.apply(console, args);
      addLog('info', args);
    };
    
    console.warn = (...args) => {
      originalConsoleWarn.apply(console, args);
      addLog('warn', args);
    };
    
    console.error = (...args) => {
      originalConsoleError.apply(console, args);
      addLog('error', args);
    };
    
    return () => {
      console.log = originalConsoleLog;
      console.warn = originalConsoleWarn;
      console.error = originalConsoleError;
      console.group = originalConsoleGroup;
      console.groupEnd = originalConsoleGroupEnd;
    };
  }, []);
  
  const filteredLogs = logs.filter(log => 
    !filter || log.message.toLowerCase().includes(filter.toLowerCase())
  );
  
  // Só mostrar em ambiente de desenvolvimento
  if (process.env.NODE_ENV !== 'production') {
    return (
      <div className={styles.debugContainer}>
        <button 
          className={styles.toggleButton}
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? 'Fechar Debug' : 'Abrir Debug'}
        </button>
        
        {isOpen && (
          <div className={styles.consoleContainer}>
            <div className={styles.header}>
              <h3>Console de Depuração</h3>
              <input 
                type="text" 
                placeholder="Filtrar logs..." 
                value={filter}
                onChange={e => setFilter(e.target.value)}
                className={styles.filterInput}
              />
              <button 
                className={styles.clearButton}
                onClick={() => setLogs([])}
              >
                Limpar
              </button>
            </div>
            
            <div className={styles.logContainer}>
              {filteredLogs.length === 0 ? (
                <div className={styles.emptyState}>Nenhum log para exibir</div>
              ) : (
                filteredLogs.map((log, index) => (
                  <div 
                    key={index} 
                    className={`${styles.logItem} ${styles[log.type]}`}
                  >
                    <span className={styles.timestamp}>{log.timestamp}</span>
                    <pre className={styles.message}>{log.message}</pre>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    );
  }
  
  return null; // Em produção não mostra nada
};

export default DebugConsole;
