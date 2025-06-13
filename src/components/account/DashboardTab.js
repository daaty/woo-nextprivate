import React, { useState, useEffect } from 'react';
import { useQuery } from '@apollo/client';
import { useAuth } from '../../hooks/useAuth';
import { useCart } from '../../v2/cart/hooks/useCart'; // Using Cart v2
import { GET_ORDERS } from '../../queries/get-orders'; // Usar a mesma query do OrdersTab
import { formatPrice } from '../../utils/format-price';
import LoadingSpinner from '../LoadingSpinner';

// Ícones modernos seguindo o padrão do projeto
const DashboardIcon = () => <span className="text-blue-600">📊</span>;
const OrdersIcon = () => <span className="text-green-600">📦</span>;
const MoneyIcon = () => <span className="text-yellow-600">💰</span>;
const TrendUpIcon = () => <span className="text-emerald-600">📈</span>;
const TrendDownIcon = () => <span className="text-red-600">📉</span>;
const CalendarIcon = () => <span className="text-purple-600">📅</span>;
const ClockIcon = () => <span className="text-indigo-600">⏰</span>;
const StarIcon = () => <span className="text-orange-600">⭐</span>;
const GiftIcon = () => <span className="text-pink-600">🎁</span>;
const ShippingIcon = () => <span className="text-blue-600">🚚</span>;
const HeartIcon = () => <span className="text-red-600">❤️</span>;
const CreditCardIcon = () => <span className="text-gray-600">💳</span>;
const CheckIcon = () => <span className="text-green-600">✅</span>;
const PendingIcon = () => <span className="text-yellow-600">⏳</span>;
const CancelledIcon = () => <span className="text-red-600">❌</span>;
const ProcessingIcon = () => <span className="text-blue-600">⚙️</span>;

// Componente de gráfico circular simples
const CircularProgress = ({ percentage, size = 120, strokeWidth = 8, color = '#ff6900' }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="circular-progress" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="circular-progress-svg">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="progress-circle"
        />
      </svg>
      <div className="progress-text">
        <span className="progress-percentage">{Math.round(percentage)}%</span>
      </div>
    </div>
  );
};

// Componente de mini gráfico de barras
const MiniBarChart = ({ data, height = 40 }) => {
  const maxValue = Math.max(...data.map(d => d.value));
  
  return (
    <div className="mini-bar-chart" style={{ height }}>
      {data.map((item, index) => (
        <div 
          key={index} 
          className="bar"
          style={{ 
            height: `${(item.value / maxValue) * 100}%`,
            backgroundColor: item.color || '#ff6900'
          }}
          title={`${item.label}: ${item.value}`}
        />
      ))}
    </div>
  );
};

const DashboardTab = ({ user }) => {
  console.log("[DashboardTab] Inicializando dashboard para usuário:", user);

  // Estados para estatísticas e dados
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalSpent: 0,
    pendingOrders: 0,
    completedOrders: 0,
    averageOrderValue: 0,
    lastOrderDate: null,
    favoriteCategory: 'Smartphones',
    loyaltyPoints: 0
  });

  const [recentActivity, setRecentActivity] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);

  // Query para buscar pedidos do cliente - CORRIGIDA para usar a mesma query do OrdersTab
  const { data: ordersData, loading: ordersLoading, error: ordersError } = useQuery(GET_ORDERS, {
    skip: !user?.id && !user?.databaseId,
    variables: {
      customerId: user?.databaseId || user?.id || null
    },
    fetchPolicy: 'cache-and-network',
    onCompleted: (data) => {
      console.log("[DashboardTab] Pedidos carregados:", data);
    },
    onError: (error) => {
      console.error("[DashboardTab] Erro ao carregar pedidos:", error);
    }
  });

  // Processar dados dos pedidos - CORRIGIDO para usar a estrutura real da query
  useEffect(() => {
    if (ordersData?.orders?.nodes) {
      const orders = ordersData.orders.nodes;
      console.log("[DashboardTab] Processando", orders.length, "pedidos dos dados reais");

      // Calcular estatísticas REAIS
      const totalOrders = orders.length;
      
      // Calcular total gasto somando os valores dos pedidos
      const totalSpent = orders.reduce((sum, order) => {
        const orderTotal = parseFloat(order.total?.replace(/[^\d.,]/g, '').replace(',', '.')) || 0;
        return sum + orderTotal;
      }, 0);
      
      // Contar pedidos por status
      const completedOrders = orders.filter(order => 
        order.status === 'COMPLETED' || 
        order.status === 'PROCESSING' || 
        order.status === 'SHIPPED'
      ).length;
      
      const pendingOrders = orders.filter(order => 
        order.status === 'PENDING' || 
        order.status === 'ON_HOLD' || 
        order.status === 'AWAITING_PAYMENT'
      ).length;
      
      const averageOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;
      
      // Última data de pedido (primeiro da lista já vem ordenado por data)
      const lastOrderDate = orders.length > 0 ? orders[0].date : null;

      // Calcular pontos de fidelidade baseado no valor gasto (1 ponto a cada R$ 10)
      const loyaltyPoints = Math.floor(totalSpent / 10);

      // Analisar categoria favorita baseada nos produtos dos pedidos
      const categoryCount = {};
      orders.forEach(order => {
        if (order.lineItems?.nodes) {
          order.lineItems.nodes.forEach(item => {
            if (item.product?.productCategories?.nodes) {
              item.product.productCategories.nodes.forEach(category => {
                categoryCount[category.name] = (categoryCount[category.name] || 0) + 1;
              });
            }
          });
        }
      });
      
      const favoriteCategory = Object.keys(categoryCount).length > 0 
        ? Object.keys(categoryCount).reduce((a, b) => categoryCount[a] > categoryCount[b] ? a : b)
        : 'Smartphones';

      setStats({
        totalOrders,
        totalSpent,
        pendingOrders,
        completedOrders,
        averageOrderValue,
        lastOrderDate,
        favoriteCategory,
        loyaltyPoints
      });

      // Criar atividade recente baseada nos pedidos reais
      const activities = orders.slice(0, 5).map(order => {
        const statusMap = {
          'COMPLETED': { text: 'Entregue', icon: <CheckIcon /> },
          'PROCESSING': { text: 'Em processamento', icon: <ProcessingIcon /> },
          'SHIPPED': { text: 'Enviado', icon: <ShippingIcon /> },
          'PENDING': { text: 'Aguardando pagamento', icon: <PendingIcon /> },
          'ON_HOLD': { text: 'Em espera', icon: <PendingIcon /> },
          'CANCELLED': { text: 'Cancelado', icon: <CancelledIcon /> },
          'REFUNDED': { text: 'Reembolsado', icon: <CancelledIcon /> },
          'FAILED': { text: 'Falhou', icon: <CancelledIcon /> }
        };

        const statusInfo = statusMap[order.status] || { text: 'Status desconhecido', icon: <PendingIcon /> };

        return {
          id: order.id,
          type: 'order',
          title: `Pedido #${order.orderNumber || order.databaseId}`,
          description: `${statusInfo.text} - ${order.total}`,
          date: order.date,
          status: order.status,
          icon: statusInfo.icon
        };
      });

      setRecentActivity(activities);

      // Criar dados mensais baseados nos pedidos reais
      const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'];
      const now = new Date();
      const monthlyOrders = monthNames.map((month, index) => {
        const monthDate = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
        const ordersInMonth = orders.filter(order => {
          const orderDate = new Date(order.date);
          return orderDate.getMonth() === monthDate.getMonth() && 
                 orderDate.getFullYear() === monthDate.getFullYear();
        }).length;

        return {
          label: month,
          value: ordersInMonth,
          color: index % 2 === 0 ? '#ff6900' : '#00a8e1'
        };
      });

      setMonthlyData(monthlyOrders);
    } else {
      console.log("[DashboardTab] Nenhum pedido encontrado ou dados ainda carregando");
      
      // Se não há pedidos, zerar as estatísticas
      setStats({
        totalOrders: 0,
        totalSpent: 0,
        pendingOrders: 0,
        completedOrders: 0,
        averageOrderValue: 0,
        lastOrderDate: null,
        favoriteCategory: 'Smartphones',
        loyaltyPoints: 0
      });
      setRecentActivity([]);
      
      // Dados mensais vazios
      const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'];
      const monthlyOrders = monthNames.map((month, index) => ({
        label: month,
        value: 0,
        color: index % 2 === 0 ? '#ff6900' : '#00a8e1'
      }));
      setMonthlyData(monthlyOrders);
    }
  }, [ordersData]);

  // Formatação de data
  const formatDate = (dateString) => {
    if (!dateString) return 'Nunca';
    try {
      return new Date(dateString).toLocaleDateString('pt-BR');
    } catch {
      return 'Data inválida';
    }
  };

  // Calcular progresso para próximo nível
  const getProgressToNextLevel = () => {
    const spent = stats.totalSpent;
    const levels = [
      { name: 'Bronze', min: 0, max: 500, color: '#cd7f32', benefits: 'Frete grátis em compras acima de R$ 1.000 (MT)' },
      { name: 'Prata', min: 500, max: 1500, color: '#c0c0c0', benefits: 'Frete grátis (MT) + 5% desconto' },
      { name: 'Ouro', min: 1500, max: 5000, color: '#ffd700', benefits: 'Frete grátis (MT) + 10% desconto + Suporte prioritário' },
      { name: 'Diamante', min: 5000, max: Infinity, color: '#b9f2ff', benefits: 'Todos os benefícios + Acesso antecipado' }
    ];

    const currentLevel = levels.find(level => spent >= level.min && spent < level.max) || levels[levels.length - 1];
    const nextLevel = levels[levels.indexOf(currentLevel) + 1];
    
    if (!nextLevel) {
      return { current: currentLevel, progress: 100, nextTarget: null };
    }

    const progress = ((spent - currentLevel.min) / (nextLevel.min - currentLevel.min)) * 100;
    return { current: currentLevel, progress, nextLevel, nextTarget: nextLevel.min - spent };
  };

  const levelInfo = getProgressToNextLevel();

  // Estados de loading e erro
  if (ordersLoading && !ordersData) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <LoadingSpinner />
        <p className="mt-4 text-gray-600">Carregando seu dashboard...</p>
      </div>
    );
  }

  if (ordersError) {
    console.error("[DashboardTab] Erro na query:", ordersError);
  }

  return (
    <>
      {/* CSS específico para o Dashboard */}
      <style jsx>{`
        /* Container principal do dashboard */
        .dashboard-container {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        /* Header de boas-vindas */
        .dashboard-welcome {
          background: linear-gradient(135deg, #ff6900 0%, #00a8e1 100%);
          color: white;
          padding: 32px;
          border-radius: 16px;
          text-align: center;
          box-shadow: 0 8px 32px rgba(255, 105, 0, 0.3);
          position: relative;
          overflow: hidden;
        }

        .dashboard-welcome::before {
          content: '';
          position: absolute;
          top: -50%;
          right: -20%;
          width: 200px;
          height: 200px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 50%;
          animation: float 6s ease-in-out infinite;
        }

        .dashboard-welcome::after {
          content: '';
          position: absolute;
          bottom: -30%;
          left: -10%;
          width: 150px;
          height: 150px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 50%;
          animation: float 8s ease-in-out infinite reverse;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }

        .welcome-content {
          position: relative;
          z-index: 1;
        }

        .welcome-title {
          font-size: 28px;
          font-weight: 700;
          margin-bottom: 8px;
        }

        .welcome-subtitle {
          font-size: 16px;
          opacity: 0.9;
          margin-bottom: 20px;
        }

        .welcome-time {
          font-size: 14px;
          opacity: 0.8;
        }

        /* Grid de estatísticas */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 20px;
        }

        .stat-card {
          background: white;
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
          border: 1px solid #f1f5f9;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }

        .stat-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
        }

        .stat-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 4px;
          height: 100%;
          background: linear-gradient(180deg, #ff6900 0%, #00a8e1 100%);
        }

        .stat-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
        }

        .stat-icon {
          width: 48px;
          height: 48px;
          background: linear-gradient(135deg, rgba(255, 105, 0, 0.1) 0%, rgba(0, 168, 225, 0.1) 100%);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
        }

        .stat-trend {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 12px;
          font-weight: 500;
          padding: 4px 8px;
          border-radius: 20px;
        }

        .stat-trend.up {
          background: #dcfce7;
          color: #166534;
        }

        .stat-trend.down {
          background: #fef2f2;
          color: #991b1b;
        }

        .stat-value {
          font-size: 32px;
          font-weight: 700;
          color: #1e293b;
          margin-bottom: 4px;
        }

        .stat-label {
          font-size: 14px;
          color: #64748b;
          font-weight: 500;
        }

        .stat-description {
          font-size: 12px;
          color: #94a3b8;
          margin-top: 8px;
        }

        /* Seção de progresso de nível */
        .level-section {
          background: white;
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
          border: 1px solid #f1f5f9;
        }

        .level-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
        }

        .level-badge {
          background: linear-gradient(135deg, #ff6900 0%, #00a8e1 100%);
          color: white;
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 14px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .level-progress-container {
          display: flex;
          align-items: center;
          gap: 24px;
        }

        .level-details {
          flex: 1;
        }

        .level-progress-bar {
          width: 100%;
          height: 8px;
          background: #f1f5f9;
          border-radius: 4px;
          overflow: hidden;
          margin: 12px 0;
        }

        .level-progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #ff6900 0%, #00a8e1 100%);
          border-radius: 4px;
          transition: width 0.3s ease;
        }

        .level-info {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          color: #64748b;
        }

        /* Gráfico circular */
        .circular-progress {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .circular-progress-svg {
          transform: rotate(-90deg);
        }

        .progress-circle {
          transition: stroke-dashoffset 0.5s ease;
        }

        .progress-text {
          position: absolute;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }

        .progress-percentage {
          font-size: 24px;
          font-weight: 700;
          color: #1e293b;
        }

        /* Grid de conteúdo */
        .dashboard-grid {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 24px;
        }

        @media (max-width: 1024px) {
          .dashboard-grid {
            grid-template-columns: 1fr;
          }
        }

        /* Seção de atividade recente */
        .activity-section {
          background: white;
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
          border: 1px solid #f1f5f9;
        }

        .activity-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
        }

        .activity-title {
          font-size: 18px;
          font-weight: 600;
          color: #1e293b;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .activity-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .activity-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 16px;
          background: #f8fafc;
          border-radius: 12px;
          transition: all 0.3s ease;
        }

        .activity-item:hover {
          background: #f1f5f9;
          transform: translateY(-2px);
        }

        .activity-icon {
          width: 40px;
          height: 40px;
          background: white;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          flex-shrink: 0;
        }

        .activity-content {
          flex: 1;
        }

        .activity-title-text {
          font-size: 14px;
          font-weight: 600;
          color: #1e293b;
          margin-bottom: 4px;
        }

        .activity-description {
          font-size: 12px;
          color: #64748b;
          margin-bottom: 4px;
        }

        .activity-date {
          font-size: 11px;
          color: #94a3b8;
        }

        /* Widgets laterais */
        .widgets-container {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .widget {
          background: white;
          border-radius: 16px;
          padding: 20px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
          border: 1px solid #f1f5f9;
        }

        .widget-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
        }

        .widget-title {
          font-size: 16px;
          font-weight: 600;
          color: #1e293b;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        /* Mini gráfico de barras */
        .mini-bar-chart {
          display: flex;
          align-items: end;
          gap: 4px;
          padding: 8px 0;
        }

        .bar {
          flex: 1;
          min-height: 8px;
          border-radius: 2px;
          transition: all 0.3s ease;
        }

        .bar:hover {
          opacity: 0.8;
          transform: scaleY(1.1);
        }

        /* Status badges */
        .status-badge {
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 500;
        }

        .status-badge.completed {
          background: #dcfce7;
          color: #166534;
        }

        .status-badge.pending {
          background: #fef3c7;
          color: #92400e;
        }

        .status-badge.processing {
          background: #dbeafe;
          color: #1e40af;
        }

        /* Responsivo */
        @media (max-width: 768px) {
          .dashboard-welcome {
            padding: 20px;
          }

          .welcome-title {
            font-size: 24px;
          }

          .stats-grid {
            grid-template-columns: 1fr;
          }

          .level-progress-container {
            flex-direction: column;
            align-items: center;
            text-align: center;
          }

          .dashboard-grid {
            grid-template-columns: 1fr;
          }
        }

        /* Animações */
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .stat-card,
        .activity-item,
        .widget {
          animation: slideIn 0.5s ease forwards;
        }

        /* Estados vazios */
        .empty-state {
          text-align: center;
          padding: 40px 20px;
          color: #64748b;
        }

        .empty-icon {
          font-size: 48px;
          margin-bottom: 16px;
          opacity: 0.5;
        }

        /* Action buttons - CSS que estava faltando */
        .action-button {
          background: linear-gradient(135deg, #ff6900 0%, #ff8f00 100%);
          color: white;
          border: none;
          padding: 12px 20px;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          font-size: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: 100%;
          text-decoration: none;
        }

        .action-button:hover {
          background: linear-gradient(135deg, #ff8f00 0%, #ff6900 100%);
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(255, 105, 0, 0.4);
        }

        .action-button.secondary {
          background: linear-gradient(135deg, #64748b 0%, #475569 100%);
        }

        .action-button.secondary:hover {
          background: linear-gradient(135deg, #475569 0%, #64748b 100%);
          box-shadow: 0 6px 20px rgba(100, 116, 139, 0.4);
        }

        .action-button:active {
          transform: translateY(0);
          box-shadow: 0 2px 8px rgba(255, 105, 0, 0.3);
        }
      `}</style>

      <div className="dashboard-container">
        {/* Header de Boas-vindas */}
        <div className="dashboard-welcome">
          <div className="welcome-content">
            <div className="welcome-title">
              Olá, {user?.firstName || user?.displayName || 'Usuário'}! 👋
            </div>
            <div className="welcome-subtitle">
              Bem-vindo ao seu painel de controle
            </div>
            <div className="welcome-time">
              {new Date().toLocaleDateString('pt-BR', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </div>
          </div>
        </div>

        {/* Grid de Estatísticas */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-header">
              <div className="stat-icon">
                <OrdersIcon />
              </div>
              <div className="stat-trend up">
                <TrendUpIcon />
                <span>+{stats.totalOrders > 0 ? '12' : '0'}%</span>
              </div>
            </div>
            <div className="stat-value">{stats.totalOrders}</div>
            <div className="stat-label">Total de Pedidos</div>
            <div className="stat-description">
              {stats.completedOrders} entregues, {stats.pendingOrders} em andamento
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <div className="stat-icon">
                <MoneyIcon />
              </div>
              <div className="stat-trend up">
                <TrendUpIcon />
                <span>+{stats.totalSpent > 0 ? '8' : '0'}%</span>
              </div>
            </div>
            <div className="stat-value">{formatPrice(stats.totalSpent)}</div>
            <div className="stat-label">Total Gasto</div>
            <div className="stat-description">
              Valor médio por pedido: {formatPrice(stats.averageOrderValue)}
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <div className="stat-icon">
                <StarIcon />
              </div>
              <div className="stat-trend up">
                <TrendUpIcon />
                <span>+{stats.loyaltyPoints > 0 ? '25' : '0'}</span>
              </div>
            </div>
            <div className="stat-value">{stats.loyaltyPoints}</div>
            <div className="stat-label">Pontos de Fidelidade</div>
            <div className="stat-description">
              Ganhe 1 ponto a cada R$ 10 gastos
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <div className="stat-icon">
                <CalendarIcon />
              </div>
            </div>
            <div className="stat-value">
              {stats.lastOrderDate ? formatDate(stats.lastOrderDate) : 'Nunca'}
            </div>
            <div className="stat-label">Último Pedido</div>
            <div className="stat-description">
              Categoria favorita: {stats.favoriteCategory}
            </div>
          </div>
        </div>

        {/* Seção de Nível de Fidelidade */}
        <div className="level-section">
          <div className="level-header">
            <h3 className="widget-title">
              <GiftIcon />
              Programa de Fidelidade
            </h3>
            <div 
              className="level-badge" 
              style={{ background: levelInfo.current.color }}
            >
              <StarIcon />
              Nível {levelInfo.current.name}
            </div>
          </div>

          <div className="level-progress-container">
            <div className="level-details">
              <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '8px' }}>
                {levelInfo.current.benefits}
              </p>
              
              {levelInfo.nextLevel && (
                <>
                  <div className="level-progress-bar">
                    <div 
                      className="level-progress-fill"
                      style={{ width: `${levelInfo.progress}%` }}
                    />
                  </div>
                  <div className="level-info">
                    <span>Progresso para {levelInfo.nextLevel.name}</span>
                    <span>Faltam {formatPrice(levelInfo.nextTarget)}</span>
                  </div>
                </>
              )}
            </div>

            <CircularProgress 
              percentage={levelInfo.progress} 
              color={levelInfo.current.color}
              size={100}
            />
          </div>
        </div>

        {/* Grid Principal */}
        <div className="dashboard-grid">
          {/* Atividade Recente */}
          <div className="activity-section">
            <div className="activity-header">
              <h3 className="activity-title">
                <ClockIcon />
                Atividade Recente
              </h3>
            </div>

            <div className="activity-list">
              {recentActivity.length > 0 ? (
                recentActivity.map((activity) => (
                  <div key={activity.id} className="activity-item">
                    <div className="activity-icon">
                      {activity.icon}
                    </div>
                    <div className="activity-content">
                      <div className="activity-title-text">{activity.title}</div>
                      <div className="activity-description">{activity.description}</div>
                      <div className="activity-date">{formatDate(activity.date)}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  <div className="empty-icon">📭</div>
                  <p>Nenhuma atividade recente</p>
                  <p style={{ fontSize: '12px' }}>Suas atividades aparecerão aqui</p>
                </div>
              )}
            </div>
          </div>

          {/* Widgets Laterais */}
          <div className="widgets-container">
            {/* Widget de Tendência Mensal */}
            <div className="widget">
              <div className="widget-header">
                <h4 className="widget-title">
                  <TrendUpIcon />
                  Pedidos por Mês
                </h4>
              </div>
              <MiniBarChart data={monthlyData} height={60} />
              <p style={{ fontSize: '12px', color: '#64748b', marginTop: '8px' }}>
                Últimos 6 meses
              </p>
            </div>

            {/* Widget de Ações Rápidas */}
            <div className="widget">
              <div className="widget-header">
                <h4 className="widget-title">
                  <DashboardIcon />
                  Ações Rápidas
                </h4>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <button className="action-button">
                  <OrdersIcon />
                  <span>Ver Todos os Pedidos</span>
                </button>
                <button className="action-button secondary">
                  <HeartIcon />
                  <span>Lista de Desejos</span>
                </button>
                <button className="action-button secondary">
                  <ShippingIcon />
                  <span>Rastrear Entregas</span>
                </button>
              </div>
            </div>

            {/* Widget de Suporte */}
            <div className="widget">
              <div className="widget-header">
                <h4 className="widget-title">
                  <span className="text-blue-600">💬</span>
                  Precisa de Ajuda?
                </h4>
              </div>
              <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '12px' }}>
                Nossa equipe está sempre pronta para ajudar!
              </div>
              <button className="action-button">
                <span>📞</span>
                <span>Contatar Suporte</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default DashboardTab;
