/**
 * Painel Admin para Monitoramento da Performance do Carrinho
 * 
 * Este componente permite aos administradores visualizar métricas
 * de performance e resolver problemas do carrinho.
 */

import React, { useState, useEffect } from 'react';
import cartPerformanceMonitor from '../../utils/cart-performance-monitor';
import LoadingSpinner from '../LoadingSpinner';

const CartPerformanceDashboard = () => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
    // Carregar relatório de performance
  useEffect(() => {
    // Certifique-se de que estamos no navegador antes de carregar métricas
    if (typeof window === 'undefined') {
      return;
    }
    
    const loadReport = () => {
      try {
        const performanceReport = cartPerformanceMonitor.getPerformanceReport();
        setReport(performanceReport);
      } catch (error) {
        console.error('Erro ao carregar relatório de performance:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadReport();
    
    // Atualizar a cada 30 segundos
    const interval = setInterval(loadReport, 30000);
    return () => clearInterval(interval);
  }, []);
  
  // Resetar métricas
  const handleReset = () => {
    if (window.confirm('Tem certeza que deseja resetar as métricas de performance?')) {
      cartPerformanceMonitor.resetMetrics();
      setReport(cartPerformanceMonitor.getPerformanceReport());
    }
  };
  
  // Forçar endpoint rápido
  const handleForceEndpoint = (type) => {
    if (type === 'fast') {
      localStorage.removeItem('disable_fast_cart');
      localStorage.setItem('cart_endpoint', 'fast');
    } else {
      localStorage.setItem('disable_fast_cart', 'true');
      localStorage.setItem('cart_endpoint', 'standard');
    }
    
    window.location.reload();
  };
  
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <LoadingSpinner />
        <p className="mt-4 text-gray-600">Carregando métricas do carrinho...</p>
      </div>
    );
  }
  
  // Status de saúde baseado no score
  const getHealthStatus = (score) => {
    if (score >= 90) return { label: 'Excelente', color: '#4CAF50' };
    if (score >= 70) return { label: 'Bom', color: '#8BC34A' };
    if (score >= 50) return { label: 'Regular', color: '#FFC107' };
    if (score >= 30) return { label: 'Problemático', color: '#FF9800' };
    return { label: 'Crítico', color: '#F44336' };
  };
  
  const healthStatus = getHealthStatus(report?.healthScore || 0);
  
  return (
    <div className="cart-performance-dashboard">
      <h2>Monitoramento de Performance do Carrinho</h2>
      
      {/* Resumo */}
      <div className="dashboard-header">
        <div className="health-score-card" style={{ borderColor: healthStatus.color }}>
          <div className="score-value" style={{ color: healthStatus.color }}>
            {report?.healthScore || 0}%
          </div>
          <div className="score-label">
            Status de Saúde: <span style={{ color: healthStatus.color }}>{healthStatus.label}</span>
          </div>
        </div>
        
        <div className="summary-stats">
          <div className="stat-item">
            <label>Total de operações:</label>
            <span>{report?.totalOperations || 0}</span>
          </div>
          <div className="stat-item">
            <label>Operações lentas:</label>
            <span>{report?.slowOperations || 0} ({report?.slowPercentage?.toFixed(1) || 0}%)</span>
          </div>
          <div className="stat-item">
            <label>Operações críticas:</label>
            <span>{report?.criticalOperations || 0} ({report?.criticalPercentage?.toFixed(1) || 0}%)</span>
          </div>
          <div className="stat-item">
            <label>Endpoint atual:</label>
            <span>{report?.currentEndpoint === 'fast' ? 'Rápido (otimizado)' : 'Padrão'}</span>
          </div>
        </div>
        
        <div className="action-buttons">
          <button className="reset-button" onClick={handleReset}>Resetar Métricas</button>
          <button 
            className="endpoint-button" 
            onClick={() => handleForceEndpoint('fast')}
            disabled={report?.currentEndpoint === 'fast'}
          >
            Forçar Endpoint Rápido
          </button>
          <button 
            className="endpoint-button" 
            onClick={() => handleForceEndpoint('standard')}
            disabled={report?.currentEndpoint === 'standard'}
          >
            Forçar Endpoint Padrão
          </button>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="dashboard-tabs">
        <button 
          className={activeTab === 'overview' ? 'active' : ''} 
          onClick={() => setActiveTab('overview')}
        >
          Visão Geral
        </button>
        <button 
          className={activeTab === 'operations' ? 'active' : ''} 
          onClick={() => setActiveTab('operations')}
        >
          Operações Recentes
        </button>
        <button 
          className={activeTab === 'fixes' ? 'active' : ''} 
          onClick={() => setActiveTab('fixes')}
        >
          Soluções
        </button>
      </div>
      
      {/* Conteúdo da tab */}
      <div className="tab-content">
        {activeTab === 'overview' && (
          <div className="overview-tab">
            <div className="performance-metrics">
              <h3>Tempos Médios</h3>
              
              <div className="metrics-grid">
                <div className="metric-card">
                  <div className="metric-title">Adicionar ao Carrinho</div>
                  <div className="metric-value">{(report?.averageAddToCartTime || 0).toFixed(0)}ms</div>
                  <div className="metric-status" style={{ 
                    color: report?.averageAddToCartTime > 3000 ? '#F44336' : '#4CAF50' 
                  }}>
                    {report?.averageAddToCartTime > 3000 ? 'Lento' : 'Bom'}
                  </div>
                </div>
                
                <div className="metric-card">
                  <div className="metric-title">Atualizar Carrinho</div>
                  <div className="metric-value">{(report?.averageCartUpdateTime || 0).toFixed(0)}ms</div>
                  <div className="metric-status" style={{ 
                    color: report?.averageCartUpdateTime > 2000 ? '#F44336' : '#4CAF50' 
                  }}>
                    {report?.averageCartUpdateTime > 2000 ? 'Lento' : 'Bom'}
                  </div>
                </div>
                
                <div className="metric-card">
                  <div className="metric-title">Remover do Carrinho</div>
                  <div className="metric-value">{(report?.averageCartRemoveTime || 0).toFixed(0)}ms</div>
                  <div className="metric-status" style={{ 
                    color: report?.averageCartRemoveTime > 2000 ? '#F44336' : '#4CAF50' 
                  }}>
                    {report?.averageCartRemoveTime > 2000 ? 'Lento' : 'Bom'}
                  </div>
                </div>
              </div>
              
              <div className="performance-chart">
                {/* Gráfico de performance poderia ser implementado aqui */}
                <div className="chart-placeholder">
                  Gráfico de performance seria exibido aqui
                </div>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'operations' && (
          <div className="operations-tab">
            <h3>Operações Recentes</h3>
            
            <table className="operations-table">
              <thead>
                <tr>
                  <th>Operação</th>
                  <th>Produto</th>
                  <th>Tempo</th>
                  <th>Status</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {report?.operations?.slice().reverse().map(op => (
                  <tr key={op.id} className={op.performanceCategory.toLowerCase()}>
                    <td>{op.operation}</td>
                    <td>{op.productId || '-'}</td>
                    <td>{op.duration}ms</td>
                    <td>
                      <span className={`status-badge ${op.success ? 'success' : 'error'}`}>
                        {op.success ? 'Sucesso' : 'Erro'}
                      </span>
                    </td>
                    <td>{new Date(op.timestamp).toLocaleString()}</td>
                  </tr>
                ))}
                
                {(!report?.operations || report.operations.length === 0) && (
                  <tr>
                    <td colSpan="5" className="empty-message">
                      Nenhuma operação registrada ainda
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
        
        {activeTab === 'fixes' && (
          <div className="fixes-tab">
            <h3>Soluções para Problemas Comuns</h3>
            
            <div className="fixes-list">
              <div className="fix-card">
                <h4>Performance Lenta do Carrinho</h4>
                <p>Se o carrinho estiver demorando mais de 5 segundos para adicionar produtos:</p>
                <ol>
                  <li>Verifique se o endpoint rápido está ativo</li>
                  <li>Reinicie os contadores de performance</li>
                  <li>Tente limpar o carrinho e adicionar os produtos novamente</li>
                </ol>
                <button 
                  className="fix-button" 
                  onClick={() => handleForceEndpoint('fast')}
                >
                  Ativar Endpoint Rápido
                </button>
              </div>
              
              <div className="fix-card">
                <h4>Contagem Incorreta de Itens</h4>
                <p>Se a contagem de itens no mini-carrinho estiver incorreta:</p>
                <ol>
                  <li>Sincronize o carrinho com o servidor</li>
                  <li>Limpe o cache do navegador</li>
                  <li>Verifique a função calculateCartCount no console</li>
                </ol>
                <button 
                  className="fix-button" 
                  onClick={() => {
                    // Executar sincronização do carrinho
                    if (typeof window.__CART_CONTEXT !== 'undefined') {
                      window.__CART_CONTEXT.syncWithServer().then(() => {
                        alert('Carrinho sincronizado com sucesso!');
                      });
                    } else {
                      alert('Contexto do carrinho não disponível. Tente recarregar a página.');
                    }
                  }}
                >
                  Sincronizar Carrinho
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <style jsx>{`
        .cart-performance-dashboard {
          background: #fff;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          padding: 20px;
          margin-bottom: 20px;
        }
        
        h2 {
          margin-top: 0;
          color: #333;
        }
        
        .dashboard-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }
        
        .health-score-card {
          border: 2px solid #ccc;
          border-radius: 8px;
          padding: 15px;
          text-align: center;
          min-width: 150px;
        }
        
        .score-value {
          font-size: 42px;
          font-weight: bold;
        }
        
        .score-label {
          font-size: 14px;
        }
        
        .summary-stats {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          grid-gap: 10px;
          margin: 0 15px;
        }
        
        .stat-item {
          background: #f5f5f5;
          padding: 10px;
          border-radius: 4px;
        }
        
        .stat-item label {
          font-weight: bold;
          display: block;
          margin-bottom: 5px;
        }
        
        .action-buttons {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        
        button {
          padding: 8px 16px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-weight: bold;
          transition: background 0.2s;
        }
        
        .reset-button {
          background: #f5f5f5;
          color: #333;
        }
        
        .endpoint-button {
          background: #2196F3;
          color: white;
        }
        
        button:hover {
          opacity: 0.9;
        }
        
        button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .dashboard-tabs {
          display: flex;
          border-bottom: 1px solid #ddd;
          margin-bottom: 20px;
        }
        
        .dashboard-tabs button {
          padding: 10px 20px;
          background: transparent;
          border: none;
          border-bottom: 2px solid transparent;
          color: #666;
          cursor: pointer;
        }
        
        .dashboard-tabs button.active {
          border-bottom-color: #2196F3;
          color: #2196F3;
        }
        
        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          grid-gap: 15px;
          margin-bottom: 20px;
        }
        
        .metric-card {
          background: #f9f9f9;
          border-radius: 6px;
          padding: 15px;
          text-align: center;
        }
        
        .metric-title {
          font-size: 14px;
          color: #666;
        }
        
        .metric-value {
          font-size: 24px;
          font-weight: bold;
          margin: 8px 0;
        }
        
        .operations-table {
          width: 100%;
          border-collapse: collapse;
        }
        
        .operations-table th, .operations-table td {
          padding: 10px;
          text-align: left;
          border-bottom: 1px solid #eee;
        }
        
        .operations-table tr:nth-child(even) {
          background: #f9f9f9;
        }
        
        .operations-table tr.critical {
          background: rgba(244, 67, 54, 0.1);
        }
        
        .operations-table tr.slow {
          background: rgba(255, 152, 0, 0.1);
        }
        
        .status-badge {
          display: inline-block;
          padding: 3px 10px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: bold;
        }
        
        .status-badge.success {
          background: rgba(76, 175, 80, 0.2);
          color: #4CAF50;
        }
        
        .status-badge.error {
          background: rgba(244, 67, 54, 0.2);
          color: #F44336;
        }
        
        .empty-message {
          text-align: center;
          padding: 20px;
          color: #999;
        }
        
        .fixes-list {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          grid-gap: 20px;
        }
        
        .fix-card {
          background: #f9f9f9;
          border-radius: 8px;
          padding: 15px;
        }
        
        .fix-card h4 {
          margin-top: 0;
          color: #333;
        }
        
        .fix-card ol {
          margin-bottom: 15px;
        }
        
        .fix-button {
          background: #4CAF50;
          color: white;
          margin-top: 10px;
        }
        
        @media (max-width: 768px) {
          .dashboard-header {
            flex-direction: column;
          }
          
          .health-score-card, .summary-stats, .action-buttons {
            margin-bottom: 15px;
            width: 100%;
          }
          
          .metrics-grid {
            grid-template-columns: 1fr;
          }
          
          .fixes-list {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default CartPerformanceDashboard;
