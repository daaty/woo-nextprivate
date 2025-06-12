/**
 * Cart Performance Monitoring
 * 
 * Este arquivo implementa um sistema de monitoramento de performance para detectar
 * problemas como o de 21 segundos para adicionar um item ao carrinho.
 * 
 * Recursos:
 * 1. Registro de tempo de todas as operações do carrinho
 * 2. Detectar operações lentas (>3s)
 * 3. Log de métricas para análise posterior
 * 4. Toggle automático para endpoint rápido/lento baseado em performance
 */

import { v4 as uuidv4 } from 'uuid';

// Configurações
const PERFORMANCE_THRESHOLD = {
  FAST: 1000,     // Operações rápidas: <1s
  ACCEPTABLE: 3000, // Operações aceitáveis: 1-3s
  SLOW: 5000,     // Operações lentas: 3-5s
  CRITICAL: 10000  // Operações críticas: >10s
};

class CartPerformanceMonitor {
  constructor() {
    this.metrics = {
      operations: [],
      lastOperation: null,
      averageAddToCartTime: 0,
      averageCartUpdateTime: 0,
      averageCartRemoveTime: 0,
      totalOperations: 0,
      slowOperations: 0,
      criticalOperations: 0
    };
    
    this.lastEndpointSwitch = Date.now();
    this.currentEndpoint = 'fast'; // Default value
    
    // Check if we're in browser environment before accessing localStorage
    if (typeof window !== 'undefined') {
      this.currentEndpoint = localStorage.getItem('cart_endpoint') || 'fast';
      
      // Inicializar com dados salvos se disponíveis
      this.loadMetrics();
    }
  }
  
  /**
   * Iniciar medição de tempo para operação
   */
  startMeasurement(operation, productId = null) {
    const operationId = uuidv4();
    const startTime = Date.now();
    
    console.log(`🕒 [CartPerformance] Iniciando medição: ${operation}${productId ? ` (produto ${productId})` : ''}`);
    
    return { operationId, startTime, operation, productId };
  }
  
  /**
   * Finalizar medição e registrar métrica
   */
  endMeasurement(measurement, success = true, errorDetails = null) {
    const { operationId, startTime, operation, productId } = measurement;
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    // Registrar operação
    const operationData = {
      id: operationId,
      operation,
      productId,
      startTime,
      endTime,
      duration,
      success,
      errorDetails,
      timestamp: new Date().toISOString(),
      performanceCategory: this.categorizePerformance(duration)
    };
    
    // Adicionar aos logs
    this.metrics.operations.push(operationData);
    this.metrics.lastOperation = operationData;
    this.metrics.totalOperations++;
    
    // Atualizar médias
    this.updateAverages(operation, duration);
    
    // Registrar operações lentas
    if (duration > PERFORMANCE_THRESHOLD.SLOW) {
      this.metrics.slowOperations++;
      console.warn(`⚠️ [CartPerformance] Operação lenta detectada: ${operation} levou ${duration}ms`);
    }
    
    if (duration > PERFORMANCE_THRESHOLD.CRITICAL) {
      this.metrics.criticalOperations++;
      console.error(`🚨 [CartPerformance] Operação CRÍTICA detectada: ${operation} levou ${duration}ms`);
      
      // Mudar endpoint se tiver problema crítico com o atual
      this.evaluateEndpointSwitch(operationData);
    }
    
    // Registrar no console
    const performanceEmoji = this.getPerformanceEmoji(operationData.performanceCategory);
    console.log(`${performanceEmoji} [CartPerformance] ${operation} completada em ${duration}ms`);
    
    // Salvar métricas
    this.saveMetrics();
    
    return operationData;
  }
  
  /**
   * Categorizar performance baseado no tempo
   */
  categorizePerformance(duration) {
    if (duration <= PERFORMANCE_THRESHOLD.FAST) return 'FAST';
    if (duration <= PERFORMANCE_THRESHOLD.ACCEPTABLE) return 'ACCEPTABLE';
    if (duration <= PERFORMANCE_THRESHOLD.SLOW) return 'SLOW';
    return 'CRITICAL';
  }
  
  /**
   * Obter emoji para categoria de performance
   */
  getPerformanceEmoji(category) {
    switch(category) {
      case 'FAST': return '🟢';
      case 'ACCEPTABLE': return '🟡';
      case 'SLOW': return '🟠';
      case 'CRITICAL': return '🔴';
      default: return '⚪';
    }
  }
  
  /**
   * Atualizar médias de tempo por tipo de operação
   */
  updateAverages(operation, duration) {
    const opType = operation.toLowerCase();
    
    if (opType.includes('add')) {
      this.updateAverage('averageAddToCartTime', duration);
    } else if (opType.includes('update')) {
      this.updateAverage('averageCartUpdateTime', duration);
    } else if (opType.includes('remove')) {
      this.updateAverage('averageCartRemoveTime', duration);
    }
  }
  
  /**
   * Atualizar um valor médio específico
   */
  updateAverage(metricName, newValue) {
    // Se for primeira operação, usar valor direto
    if (!this.metrics[metricName]) {
      this.metrics[metricName] = newValue;
      return;
    }
    
    // Atualizar média ponderada
    this.metrics[metricName] = (this.metrics[metricName] * 0.7) + (newValue * 0.3);
  }
  /**
   * Decidir se deve mudar entre endpoints rápido/padrão
   */
  evaluateEndpointSwitch(operationData) {
    const now = Date.now();
    
    // Verificar se estamos no navegador
    if (typeof window === 'undefined') {
      console.log('⚠️ [CartPerformance] Ignorando avaliação de endpoint no ambiente servidor');
      return;
    }
    
    // Não mudar mais frequente que a cada 5 minutos
    if (now - this.lastEndpointSwitch < 300000) {
      return;
    }
    
    // Se endpoint atual é 'fast' e temos problema crítico, tentar padrão
    if (this.currentEndpoint === 'fast' && operationData.performanceCategory === 'CRITICAL') {
      console.log('🔄 [CartPerformance] Mudando para endpoint padrão após problema crítico');
      localStorage.setItem('disable_fast_cart', 'true');
      this.currentEndpoint = 'standard';
      this.lastEndpointSwitch = now;
    } 
    // Se endpoint atual é padrão e temos problema crítico, tentar rápido
    else if (this.currentEndpoint === 'standard' && operationData.performanceCategory === 'CRITICAL') {
      console.log('🔄 [CartPerformance] Mudando para endpoint rápido após problema crítico');
      localStorage.removeItem('disable_fast_cart');
      this.currentEndpoint = 'fast';
      this.lastEndpointSwitch = now;
    }
    
    localStorage.setItem('cart_endpoint', this.currentEndpoint);
  }
  
  /**
   * Salvar métricas em localStorage para persistência
   */
  saveMetrics() {
    const metricsToSave = {
      ...this.metrics,
      // Limitar operações para não sobrecarregar o localStorage
      operations: this.metrics.operations.slice(-30)
    };
    
    // Salvar em localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('cart_performance_metrics', JSON.stringify(metricsToSave));
    }
  }
  
  /**
   * Carregar métricas do localStorage
   */
  loadMetrics() {
    if (typeof window !== 'undefined') {
      const savedMetrics = localStorage.getItem('cart_performance_metrics');
      if (savedMetrics) {
        try {
          const parsed = JSON.parse(savedMetrics);
          this.metrics = {
            ...this.metrics,
            ...parsed
          };
          console.log('📊 [CartPerformance] Métricas carregadas do localStorage');
        } catch (e) {
          console.error('❌ [CartPerformance] Erro ao carregar métricas:', e);
        }
      }
    }
  }
  
  /**
   * Obter relatório de performance
   */
  getPerformanceReport() {
    const { totalOperations, slowOperations, criticalOperations } = this.metrics;
    
    return {
      ...this.metrics,
      currentEndpoint: this.currentEndpoint,
      healthScore: this.calculateHealthScore(),
      slowPercentage: totalOperations ? (slowOperations / totalOperations) * 100 : 0,
      criticalPercentage: totalOperations ? (criticalOperations / totalOperations) * 100 : 0,
      timestamp: new Date().toISOString()
    };
  }
  
  /**
   * Calcular pontuação de saúde do carrinho (0-100)
   */
  calculateHealthScore() {
    const { totalOperations, slowOperations, criticalOperations, 
      averageAddToCartTime, averageCartUpdateTime } = this.metrics;
    
    if (totalOperations === 0) return 100;
    
    // Fator de operações lentas
    const slowFactor = 1 - ((slowOperations / totalOperations) * 0.5);
    
    // Fator de operações críticas (impacto maior)
    const criticalFactor = 1 - ((criticalOperations / totalOperations) * 0.8);
    
    // Fator de tempo média de addToCart (penalidade se >5s)
    const addTimeFactor = averageAddToCartTime > 5000 
      ? 1 - ((averageAddToCartTime - 5000) / 20000)
      : 1;
    
    // Fator de tempo de atualização (penalidade se >3s)
    const updateTimeFactor = averageCartUpdateTime > 3000
      ? 1 - ((averageCartUpdateTime - 3000) / 10000)
      : 1;
    
    // Calcular score ponderado
    let score = (slowFactor * 0.25) + (criticalFactor * 0.35) + 
                (addTimeFactor * 0.25) + (updateTimeFactor * 0.15);
    
    // Normalizar entre 0-100
    score = Math.max(0, Math.min(1, score)) * 100;
    
    return Math.round(score);
  }
  
  /**
   * Limpar métricas (manter apenas configurações)
   */
  resetMetrics() {
    this.metrics = {
      operations: [],
      lastOperation: null,
      averageAddToCartTime: 0,
      averageCartUpdateTime: 0,
      averageCartRemoveTime: 0,
      totalOperations: 0,
      slowOperations: 0,
      criticalOperations: 0
    };
    
    this.saveMetrics();
    console.log('🧹 [CartPerformance] Métricas resetadas');
  }
}

// Criar instância singleton
const cartPerformanceMonitor = new CartPerformanceMonitor();
export default cartPerformanceMonitor;
