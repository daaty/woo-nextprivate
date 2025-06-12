/**
 * API Manager
 * Gerencia todas as chamadas de API, priorizando endpoints otimizados
 * quando disponíveis para melhor performance
 */

import { v4 } from 'uuid';
import axios from 'axios';
import cartPerformanceMonitor from './cart-performance-monitor';

class ApiManager {
  constructor() {
    this.axiosInstance = axios.create({
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json',
      }
    });

    // Interceptor para logging e manipulação de erros
    this.axiosInstance.interceptors.response.use(
      response => {
        return response;
      },
      error => {
        console.error('🔴 [ApiManager] Request failed:', error.message);
        return Promise.reject(error);
      }
    );

    // Estatísticas de performance
    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      lastResponseTime: 0,
      averageResponseTime: 0
    };
  }  /**
   * Adiciona produto ao carrinho usando o endpoint otimizado
   * CORREÇÃO: Melhor tratamento de erros e manipulação de retornos
   * OTIMIZADO: Integração com o monitoramento de performance
   */
  async addToCartFast(productId, quantity = 1, variationId = null) {
    const startTime = Date.now();
    const requestId = v4();
    this.stats.totalRequests++;
    
    // Iniciar medição de performance
    const perfMeasurement = cartPerformanceMonitor.startMeasurement('addToCartFast', productId);

    try {
      console.log(`🚀 [ApiManager] Iniciando addToCartFast para produto ${productId}`);

      const payload = {
        productId, 
        quantity,
        ...(variationId ? { variationId } : {})
      };

      // URL corrigida com caminho absoluto
      const url = window.location.origin + '/api/cart/add-to-cart-fast';
      console.log(`[ApiManager] URL do endpoint: ${url}`);

      const response = await this.axiosInstance.post(url, payload, {
        // Aumentar timeout para operações críticas de carrinho
        timeout: 15000,
        headers: {
          ...this.getAuthHeaders(),
          'Content-Type': 'application/json'
        }
      });
      
      const responseTime = Date.now() - startTime;
      this.stats.lastResponseTime = responseTime;
      this.stats.averageResponseTime = 
        (this.stats.averageResponseTime * (this.stats.successfulRequests) + responseTime) / 
        (this.stats.successfulRequests + 1);
      this.stats.successfulRequests++;

      console.log(`✅ [ApiManager] addToCartFast concluído em ${responseTime}ms`);
      
      // Finalizar medição de performance com sucesso
      cartPerformanceMonitor.endMeasurement(perfMeasurement, true);
      
      return {
        success: true,
        data: response.data,
        responseTime
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.stats.failedRequests++;

      console.error(`❌ [ApiManager] addToCartFast falhou após ${responseTime}ms:`, error.message);
      
      // Log detalhado para debug
      if (error.response) {
        console.error('[ApiManager] Detalhes da resposta de erro:', {
          status: error.response.status,
          data: error.response.data,
          headers: error.response.headers
        });
      } else if (error.request) {
        console.error('[ApiManager] Requisição feita mas sem resposta');
      }
      
      // Finalizar medição de performance com falha
      cartPerformanceMonitor.endMeasurement(
        perfMeasurement, 
        false, 
        error.response?.data?.error || error.message
      );
      
      // Prepare error response
      const errorResponse = {
        success: false,
        error: error.response?.data?.error || error.message || 'Erro desconhecido',
        statusCode: error.response?.status || 500,
        details: error.response?.data || {},
        requestId,
        responseTime
      };
      
      return errorResponse;
    }
  }

  /**
   * Executa uma query GraphQL usando o endpoint otimizado
   */
  async graphqlOptimized(query, variables = {}, headers = {}) {
    const startTime = Date.now();
    const requestId = v4();
    this.stats.totalRequests++;

    try {
      console.log(`🚀 [ApiManager] Iniciando graphqlOptimized`);

      const payload = {
        query,
        variables
      };

      const response = await this.axiosInstance.post('/api/graphql-optimized', payload, {
        headers
      });
      
      const responseTime = Date.now() - startTime;
      this.stats.lastResponseTime = responseTime;
      this.stats.averageResponseTime = 
        (this.stats.averageResponseTime * (this.stats.successfulRequests) + responseTime) / 
        (this.stats.successfulRequests + 1);
      this.stats.successfulRequests++;

      // Check for GraphQL errors
      if (response.data.errors && response.data.errors.length > 0) {
        console.warn(`⚠️ [ApiManager] graphqlOptimized retornou erros:`, response.data.errors);
        return {
          success: false,
          errors: response.data.errors,
          data: response.data.data,
          responseTime
        };
      }

      console.log(`✅ [ApiManager] graphqlOptimized concluído em ${responseTime}ms`);
      
      return {
        success: true,
        data: response.data.data,
        responseTime
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.stats.failedRequests++;

      console.error(`❌ [ApiManager] graphqlOptimized falhou após ${responseTime}ms:`, error.message);
      
      return {
        success: false,
        error: error.response?.data?.errors || error.message || 'Erro desconhecido',
        statusCode: error.response?.status || 500,
        requestId,
        responseTime
      };
    }
  }

  /**
   * Obtém estatísticas de performance da API
   */
  getPerformanceStats() {
    return {
      ...this.stats,
      successRate: this.stats.totalRequests > 0 
        ? (this.stats.successfulRequests / this.stats.totalRequests) * 100 
        : 0,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Retorna cabeçalhos de autenticação
   */
  getAuthHeaders() {
    // Implementar lógica de autenticação se necessário
    const headers = {};
    
    // Adicionar woocommerce-session se disponível no localStorage
    if (typeof window !== 'undefined') {
      const wooSession = localStorage.getItem('woo-session');
      if (wooSession) {
        headers['woocommerce-session'] = wooSession;
      }
    }
    
    return headers;
  }
}

// Singleton instance
const apiManager = new ApiManager();
export default apiManager;
