import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNotification } from '../ui/Notification';
import { formatPrice } from '../../utils/format-price';
import LoadingSpinner from '../LoadingSpinner';

// Componentes auxiliares - ícones e spinners seguindo o padrão do cart.js
const Spinner = () => (
  <div className="inline-block w-4 h-4 border-2 border-gray-300 border-t-orange-500 rounded-full animate-spin"></div>
);

// Ícones simplificados seguindo o padrão do cart.js
const TrashIcon = () => <span className="text-red-600">🗑️</span>;
const RefreshIcon = () => <span>🔄</span>;
const EyeIcon = () => <span>👁️</span>;
const CheckIcon = () => <span className="text-green-500">✓</span>;
const ClockIcon = () => <span>⏰</span>;
const CreditCardIcon = () => <span>💳</span>;
const PackageIcon = () => <span>📦</span>;
const XIcon = () => <span className="text-red-500">❌</span>;
const ArrowIcon = () => <span>←</span>;
const AlertIcon = () => <span className="text-yellow-500">⚠️</span>;
const ShippingIcon = () => <span>🚚</span>;
const PendingIcon = () => <span className="text-yellow-500">⏳</span>;
const CompletedIcon = () => <span className="text-green-500">✅</span>;
const CancelledIcon = () => <span className="text-red-500">❌</span>;
const ProcessingIcon = () => <span className="text-blue-500">⚙️</span>;

// Placeholder para produto sem imagem
const DEFAULT_PLACEHOLDER = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiNFNUU3RUIiLz48cGF0aCBkPSJNMTAwIDg4QzEwNi42MjcgODggMTEyIDgyLjYyNyAxMTIgNzZDMTEyIDY5LjM3MyAxMDYuNjI3IDY0IDEwMCA2NEM5My4zNzMgNjQgODggNjkuMzczIDg4IDc2Qzg4IDgyLjYyNyA5My4zNzMgODggMTAwIDg4WiIgZmlsbD0iIzlDQTNBRiIvPjxwYXRoIGQ9Ik0xNDAgMTQ0VjEzNkMxNDAgMTIyLjc0NSAxMjkuMjU1IDExMiAxMTYgMTEySDg0QzcwLjc0NSAxMTIgNjAgMTIyLjc0NSA2MCAxMzZWMTQ0SDE0MFoiIGZpbGw9IiM5Q0EzQUYiLz48L3N2Zz4=';

const OrdersTab = () => {
  console.log('[OrdersTab] Inicializando componente com API direta');
  const { user, isLoggedIn } = useAuth();
  const { notification } = useNotification();
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [deletingOrder, setDeletingOrder] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

  console.log('[OrdersTab] Dados do usuário disponíveis:', user ? true : false);
  console.log('[OrdersTab] ID do usuário:', user?.id);
  console.log('[OrdersTab] Database ID do usuário:', user?.databaseId);
  console.log('[OrdersTab] Email do usuário:', user?.email);
  console.log('[OrdersTab] Usuário logado:', isLoggedIn);

  // Função para verificar se um pedido está expirado (mais de 30 minutos)
  const isOrderExpired = (order) => {
    if (!order?.date || order.status !== 'pending') return false;
    
    const orderDate = new Date(order.date);
    const now = new Date();
    const diffMinutes = (now - orderDate) / (1000 * 60);
    
    return diffMinutes > 30;
  };

  // Função para calcular tempo restante até expiração
  const getTimeUntilExpiration = (order) => {
    if (!order?.date || order.status !== 'pending') return null;
    
    const orderDate = new Date(order.date);
    const expirationDate = new Date(orderDate.getTime() + 30 * 60000); // 30 minutos
    const now = new Date();
    const remainingMs = expirationDate - now;
    
    if (remainingMs <= 0) return 'Expirado';
    
    const remainingMinutes = Math.floor(remainingMs / (1000 * 60));
    return `${remainingMinutes} min restantes`;
  };

  // Função para verificar se um pedido usa Infinitepay
  const isInfinitepayOrder = (order) => {
    const paymentChecks = [
      order?.paymentMethod === 'infinitepay-checkout',
      order?.payment_method === 'infinitepay-checkout',
      order?.paymentMethodTitle?.toLowerCase().includes('infinitepay'),
      order?.payment_method_title?.toLowerCase().includes('infinitepay')
    ];
    
    const result = paymentChecks.some(check => check);
    console.log('[OrdersTab] Verificando se é pedido Infinitepay:', {
      orderId: order?.id,
      paymentMethod: order?.paymentMethod || order?.payment_method,
      paymentMethodTitle: order?.paymentMethodTitle || order?.payment_method_title,
      isInfinitepay: result
    });
    
    return result;
  };

  // Função para verificar se um pedido está cancelado
  const isCancelledOrder = (order) => {
    return order?.status === 'cancelled' || order?.status === 'canceled';
  };

  // Função para obter pedidos expirados
  const getExpiredOrders = () => {
    return orders.filter(order => isOrderExpired(order));
  };

  // Função para obter pedidos cancelados
  const getCancelledOrders = () => {
    return orders.filter(order => isCancelledOrder(order));
  };

  // Função para excluir pedido individual
  const handleDeleteOrder = async (orderId) => {
    console.log('[OrdersTab] Tentando excluir pedido:', orderId);
    setDeletingOrder(orderId);
    try {
      const response = await fetch(`/api/orders/delete/${orderId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('[OrdersTab] Response da exclusão:', response.status);
      
      if (response.ok) {
        setOrders(prev => prev.filter(order => order.id !== orderId));
        notification.success('Pedido excluído com sucesso');
        console.log('[OrdersTab] Pedido excluído com sucesso:', orderId);
      } else {
        const errorData = await response.text();
        console.error('[OrdersTab] Erro ao excluir pedido:', errorData);
        notification.error('Erro ao excluir pedido: ' + errorData);
      }
    } catch (error) {
      console.error('[OrdersTab] Erro na requisição de exclusão:', error);
      notification.error('Erro ao excluir pedido');
    } finally {
      setDeletingOrder(null);
      setShowDeleteConfirm(null);
    }
  };

  // Função para excluir todos os pedidos expirados
  const handleDeleteAllExpired = async () => {
    const expiredOrders = getExpiredOrders();
    if (expiredOrders.length === 0) {
      notification.info('Não há pedidos expirados para excluir');
      return;
    }

    setUpdatingStatus(true);
    try {
      for (const order of expiredOrders) {
        await handleDeleteOrder(order.id);
      }
      notification.success(`${expiredOrders.length} pedido(s) expirado(s) excluído(s)`);
    } catch (error) {
      notification.error('Erro ao excluir pedidos expirados');
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Função para excluir todos os pedidos cancelados
  const handleDeleteAllCancelled = async () => {
    const cancelledOrders = getCancelledOrders();
    if (cancelledOrders.length === 0) {
      notification.info('Não há pedidos cancelados para excluir');
      return;
    }

    setUpdatingStatus(true);
    try {
      for (const order of cancelledOrders) {
        await handleDeleteOrder(order.id);
      }
      notification.success(`${cancelledOrders.length} pedido(s) cancelado(s) excluído(s)`);
    } catch (error) {
      notification.error('Erro ao excluir pedidos cancelados');
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Função para buscar pedidos usando API direta do WooCommerce - CORRIGIDA
  const fetchOrdersDirect = async () => {
    // CORREÇÃO: Verificar múltiplos campos de ID do usuário
    const userDatabaseId = user?.databaseId || user?.id;
    
    if (!userDatabaseId) {
      console.log('[OrdersTab] Database ID do usuário não encontrado');
      console.log('[OrdersTab] User object:', user);
      setError('ID do usuário não encontrado');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('[OrdersTab] Buscando pedidos para usuário:', userDatabaseId);
      
      // CORREÇÃO: Adicionar headers de autenticação
      const headers = {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      };

      // Adicionar token de autenticação se disponível
      const token = typeof window !== 'undefined' ? 
        localStorage.getItem('auth-token') || 
        document.cookie.split('; ').find(row => row.startsWith('auth-token='))?.split('=')[1] : 
        null;

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        console.log('[OrdersTab] Token de autenticação adicionado');
      }

      const response = await fetch(`/api/orders/user/${userDatabaseId}`, {
        method: 'GET',
        credentials: 'include',
        headers: headers
      });

      console.log('[OrdersTab] Response status:', response.status);
      console.log('[OrdersTab] Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[OrdersTab] Erro HTTP:', response.status, errorText);
        
        // CORREÇÃO: Tratar erro 404 especificamente
        if (response.status === 404) {
          throw new Error('API de pedidos não encontrada. Verifique se a rota /api/orders/user/[userId].js existe.');
        }
        
        throw new Error(`Erro HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('[OrdersTab] Resposta da API completa:', data);

      if (data.success && Array.isArray(data.orders)) {
        let fetchedOrders = data.orders;
        
        console.log('[OrdersTab] Pedidos encontrados:', fetchedOrders.length);
        console.log('[OrdersTab] Primeiro pedido (exemplo):', fetchedOrders[0]);
        
        // Verificar e atualizar status de pedidos Infinitepay se necessário
        if (fetchedOrders.some(order => isInfinitepayOrder(order))) {
          console.log('[OrdersTab] Encontrados pedidos Infinitepay, verificando status...');
          fetchedOrders = await checkAndUpdateInfinitepayStatus(fetchedOrders);
        }

        setOrders(fetchedOrders);
        console.log('[OrdersTab] Pedidos carregados com sucesso:', fetchedOrders.length);
        
        if (fetchedOrders.length === 0) {
          console.log('[OrdersTab] Nenhum pedido encontrado para este usuário');
        }
      } else {
        console.log('[OrdersTab] Resposta não contém pedidos válidos:', data);
        setOrders([]);
      }
    } catch (error) {
      console.error('[OrdersTab] Erro ao buscar pedidos:', error);
      console.error('[OrdersTab] Stack trace:', error.stack);
      setError(error.message);
      
      // Notificação mais específica baseada no tipo de erro
      if (error.message.includes('404')) {
        notification.error('API de pedidos não encontrada. A funcionalidade está sendo configurada.');
      } else if (error.message.includes('403')) {
        notification.error('Acesso negado. Verifique suas credenciais.');
      } else if (error.message.includes('500')) {
        notification.error('Erro interno do servidor. Tente novamente em alguns minutos.');
      } else {
        notification.error('Erro ao carregar pedidos: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // Função para atualizar status manualmente - MELHORADA
  const refreshOrdersStatus = async () => {
    console.log('[OrdersTab] Atualizando status dos pedidos manualmente...');
    setUpdatingStatus(true);
    try {
      await fetchOrdersDirect();
      notification.success('Status dos pedidos atualizado com sucesso!');
    } catch (error) {
      console.error('[OrdersTab] Erro ao atualizar status:', error);
      notification.error('Erro ao atualizar status dos pedidos');
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Carregar pedidos quando usuário estiver logado - MELHORADO
  useEffect(() => {
    // CORREÇÃO: Verificar múltiplos campos de ID
    const userDatabaseId = user?.databaseId || user?.id;
    
    console.log('[OrdersTab] useEffect executado:', { 
      isLoggedIn, 
      userDatabaseId,
      userObject: user 
    });
    
    if (isLoggedIn && userDatabaseId) {
      console.log('[OrdersTab] Condições atendidas, buscando pedidos...');
      fetchOrdersDirect();
    } else {
      console.log('[OrdersTab] Condições não atendidas:', {
        isLoggedIn,
        hasUserDatabaseId: !!userDatabaseId,
        user: user ? 'presente' : 'ausente',
        userKeys: user ? Object.keys(user) : []
      });
    }
  }, [isLoggedIn, user?.databaseId, user?.id]);

  const toggleOrderDetails = (orderId) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Data não disponível';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Data inválida';
      
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Data inválida';
    }
  };

  const getStatusColor = (status) => {
    const statusColors = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'processing': 'bg-blue-100 text-blue-800',
      'on-hold': 'bg-gray-100 text-gray-800',
      'completed': 'bg-green-100 text-green-800',
      'cancelled': 'bg-red-100 text-red-800',
      'refunded': 'bg-purple-100 text-purple-800',
      'failed': 'bg-red-100 text-red-800'
    };
    
    return statusColors[status] || 'bg-gray-100 text-gray-800';
  };

  // Função para verificar e atualizar status de pedidos Infinitepay - MELHORADA
  const checkAndUpdateInfinitepayStatus = async (orders) => {
    const infinitepayOrders = orders.filter(order => isInfinitepayOrder(order));
    
    if (infinitepayOrders.length === 0) {
      console.log('[OrdersTab] Nenhum pedido Infinitepay encontrado');
      return orders;
    }

    console.log('[OrdersTab] Verificando status de pedidos Infinitepay:', infinitepayOrders.length);

    try {
      for (const order of infinitepayOrders) {
        if (order.status === 'pending') {
          console.log(`[OrdersTab] Verificando status do pedido ${order.id}...`);
          
          try {
            // Verificar status no Infinitepay
            const response = await fetch(`/api/infinitepay/check-status/${order.id}`, {
              method: 'GET',
              credentials: 'include',
              headers: {
                'Cache-Control': 'no-cache'
              }
            });

            if (response.ok) {
              const statusData = await response.json();
              console.log(`[OrdersTab] Status response para pedido ${order.id}:`, statusData);
              
              if (statusData.success && statusData.status !== order.status) {
                // Atualizar status do pedido
                order.status = statusData.status;
                console.log(`[OrdersTab] Status do pedido ${order.id} atualizado de 'pending' para: ${statusData.status}`);
              }
            } else {
              console.log(`[OrdersTab] Falha ao verificar status do pedido ${order.id}:`, response.status);
            }
          } catch (statusError) {
            console.error(`[OrdersTab] Erro ao verificar status do pedido ${order.id}:`, statusError);
            // Continuar com outros pedidos mesmo se um falhar
          }
        }
      }
    } catch (error) {
      console.error('[OrdersTab] Erro geral ao verificar status Infinitepay:', error);
    }

    return orders;
  };

  // Função para formatar status do pedido
  const formatOrderStatus = (status) => {
    const statusMap = {
      'pending': 'Aguardando Pagamento',
      'processing': 'Processando',
      'on-hold': 'Em Espera',
      'completed': 'Concluído',
      'cancelled': 'Cancelado',
      'refunded': 'Reembolsado',
      'failed': 'Falhou'
    };
    
    return statusMap[status] || status;
  };

  // Função para obter ícone do status
  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <PendingIcon />;
      case 'processing':
        return <ProcessingIcon />;
      case 'completed':
        return <CompletedIcon />;
      case 'cancelled':
      case 'failed':
        return <CancelledIcon />;
      default:
        return <ClockIcon />;
    }
  };

  // Debug: Log do estado atual dos pedidos
  useEffect(() => {
    const userDatabaseId = user?.databaseId || user?.id;
    
    console.log('[OrdersTab] Estado atual:', {
      ordersCount: orders.length,
      loading,
      error,
      isLoggedIn,
      userDatabaseId: userDatabaseId,
      userObject: user
    });
  }, [orders, loading, error, isLoggedIn, user]);

  if (loading) {
    const userDatabaseId = user?.databaseId || user?.id;
    
    return (
      <div className="content-card">
        <div className="text-center py-12">
          <LoadingSpinner />
          <p className="mt-4 text-gray-600">Carregando seus pedidos...</p>
          <p className="mt-2 text-sm text-gray-500">
            Buscando pedidos para usuário ID: {userDatabaseId || 'N/A'}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    const userDatabaseId = user?.databaseId || user?.id;
    
    return (
      <div className="content-card">
        <div className="text-center py-12">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Erro ao carregar pedidos</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="text-sm text-gray-500 mb-4">
            <p>Debug info:</p>
            <p>Usuário ID: {userDatabaseId || 'N/A'}</p>
            <p>Database ID: {user?.databaseId || 'N/A'}</p>
            <p>User ID: {user?.id || 'N/A'}</p>
            <p>Logado: {isLoggedIn ? 'Sim' : 'Não'}</p>
            <p>Chaves do user: {user ? Object.keys(user).join(', ') : 'Nenhuma'}</p>
          </div>
          <button
            onClick={fetchOrdersDirect}
            className="action-button"
          >
            <RefreshIcon />
            <span>Tentar Novamente</span>
          </button>
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    const userDatabaseId = user?.databaseId || user?.id;
    
    return (
      <div className="content-card">
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">📦</div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Nenhum pedido encontrado</h3>
          <p className="text-gray-600 mb-6">
            {userDatabaseId 
              ? `Não encontramos pedidos para o usuário ${userDatabaseId}. Você ainda não fez nenhuma compra conosco.`
              : 'Você ainda não fez nenhuma compra conosco.'
            }
          </p>
          <div className="flex gap-4 justify-center">
            <a href="/" className="action-button">
              <span>🛍️</span>
              <span>Começar a Comprar</span>
            </a>
            <button
              onClick={fetchOrdersDirect}
              className="action-button secondary"
            >
              <RefreshIcon />
              <span>Recarregar</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const expiredOrders = getExpiredOrders();
  const cancelledOrders = getCancelledOrders();

  return (
    <>
      {/* CSS específico para OrdersTab seguindo o padrão moderno */}
      <style jsx>{`
        /* Container principal dos pedidos */
        .orders-container {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        /* Header com ações */
        .orders-header {
          display: flex;
          justify-content: between;
          align-items: center;
          flex-wrap: wrap;
          gap: 16px;
          margin-bottom: 24px;
        }

        .orders-title {
          font-size: 24px;
          font-weight: 700;
          color: #1e293b;
          margin: 0;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .orders-count {
          background: linear-gradient(135deg, #ff6900 0%, #00a8e1 100%);
          color: white;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 14px;
          font-weight: 600;
        }

        /* Ações dos pedidos */
        .orders-actions {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        /* Card de pedido */
        .order-card {
          background: white;
          border-radius: 16px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
          border: 1px solid #f1f5f9;
          overflow: hidden;
          transition: all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1);
          position: relative;
        }

        .order-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
          border-color: #ff6900;
        }

        /* Header do card */
        .order-card-header {
          padding: 20px 24px;
          background: linear-gradient(135deg, rgba(255, 105, 0, 0.05) 0%, rgba(0, 168, 225, 0.05) 100%);
          border-bottom: 1px solid #f1f5f9;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 12px;
        }

        .order-number {
          font-size: 18px;
          font-weight: 700;
          color: #1e293b;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .order-date {
          font-size: 14px;
          color: #64748b;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        /* Status badge */
        .status-badge {
          padding: 8px 16px;
          border-radius: 25px;
          font-size: 13px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 6px;
          text-transform: capitalize;
        }

        /* Corpo do card */
        .order-card-body {
          padding: 24px;
        }

        .order-summary {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin-bottom: 20px;
        }

        .summary-item {
          text-align: center;
          padding: 16px;
          background: #f8fafc;
          border-radius: 12px;
          transition: all 0.2s ease;
        }

        .summary-item:hover {
          background: #f1f5f9;
          transform: translateY(-2px);
        }

        .summary-icon {
          font-size: 24px;
          margin-bottom: 8px;
        }

        .summary-label {
          font-size: 12px;
          color: #64748b;
          margin-bottom: 4px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .summary-value {
          font-size: 16px;
          font-weight: 600;
          color: #1e293b;
        }

        /* Botões de ação */
        .order-actions {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          justify-content: center;
          padding-top: 20px;
          border-top: 1px solid #f1f5f9;
        }

        /* Detalhes expandidos */
        .order-details {
          background: #f8fafc;
          padding: 24px;
          border-top: 1px solid #f1f5f9;
          animation: slideDown 0.3s ease-out;
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            max-height: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            max-height: 1000px;
            transform: translateY(0);
          }
        }

        .details-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 24px;
        }

        .detail-section {
          background: white;
          padding: 20px;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }

        .detail-title {
          font-size: 16px;
          font-weight: 600;
          color: #1e293b;
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        /* Items do pedido */
        .order-items {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .order-item {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 12px;
          background: white;
          border-radius: 8px;
          border: 1px solid #f1f5f9;
        }

        .item-image {
          width: 60px;
          height: 60px;
          border-radius: 8px;
          object-fit: cover;
          border: 1px solid #e2e8f0;
        }

        .item-info {
          flex: 1;
        }

        .item-name {
          font-size: 14px;
          font-weight: 500;
          color: #1e293b;
          margin-bottom: 4px;
        }

        .item-details {
          font-size: 12px;
          color: #64748b;
        }

        .item-price {
          font-size: 14px;
          font-weight: 600;
          color: #ff6900;
        }

        /* Alerta de expiração */
        .expiration-alert {
          background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
          border: 1px solid #f59e0b;
          color: #92400e;
          padding: 12px 16px;
          border-radius: 8px;
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          font-weight: 500;
        }

        /* Responsivo */
        @media (max-width: 768px) {
          .orders-header {
            flex-direction: column;
            align-items: stretch;
          }

          .orders-actions {
            justify-content: center;
          }

          .order-card-header {
            flex-direction: column;
            align-items: stretch;
            gap: 16px;
          }

          .order-summary {
            grid-template-columns: 1fr;
            gap: 16px;
          }

          .order-actions {
            flex-direction: column;
          }

          .details-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="orders-container">
        {/* Header com título e ações */}
        <div className="orders-header">
          <h1 className="orders-title">
            <PackageIcon />
            Meus Pedidos
            <span className="orders-count">{orders.length}</span>
          </h1>
          
          <div className="orders-actions">
            <button
              onClick={refreshOrdersStatus}
              className="action-button secondary"
              disabled={updatingStatus}
              title="Atualizar status dos pedidos"
            >
              {updatingStatus ? <Spinner /> : <RefreshIcon />}
              <span>Atualizar Status</span>
            </button>

            {expiredOrders.length > 0 && (
              <button
                onClick={handleDeleteAllExpired}
                className="action-button danger"
                disabled={updatingStatus}
                title={`Excluir ${expiredOrders.length} pedido(s) expirado(s)`}
              >
                <TrashIcon />
                <span>Limpar Expirados ({expiredOrders.length})</span>
              </button>
            )}

            {cancelledOrders.length > 0 && (
              <button
                onClick={handleDeleteAllCancelled}
                className="action-button danger"
                disabled={updatingStatus}
                title={`Excluir ${cancelledOrders.length} pedido(s) cancelado(s)`}
              >
                <TrashIcon />
                <span>Limpar Cancelados ({cancelledOrders.length})</span>
              </button>
            )}
          </div>
        </div>

        {/* Debug info para desenvolvimento */}
        {process.env.NODE_ENV === 'development' && (
          <div className="content-card mb-4" style={{ background: '#f8f9fa', border: '1px solid #dee2e6' }}>
            <h4 className="text-sm font-semibold mb-2">Debug Info (dev only):</h4>
            <div className="text-xs text-gray-600">
              <p>Usuário logado: {isLoggedIn ? 'Sim' : 'Não'}</p>
              <p>Database ID: {user?.databaseId || 'Não encontrado'}</p>
              <p>Total de pedidos: {orders.length}</p>
              <p>Última atualização: {new Date().toLocaleTimeString()}</p>
            </div>
          </div>
        )}

        {/* Lista de pedidos */}
        {orders.map((order) => (
          <div key={order.id} className="order-card">
            {/* Alerta de expiração */}
            {isOrderExpired(order) && (
              <div className="expiration-alert">
                <AlertIcon />
                <span>Este pedido expirou e pode ser removido</span>
              </div>
            )}

            {/* Header do card */}
            <div className="order-card-header">
              <div>
                <div className="order-number">
                  <span>#{order.number || order.id}</span>
                </div>
                <div className="order-date">
                  <ClockIcon />
                  <span>{formatDate(order.date)}</span>
                </div>
              </div>

              <div className={`status-badge ${getStatusColor(order.status)}`}>
                {getStatusIcon(order.status)}
                <span>{formatOrderStatus(order.status)}</span>
              </div>
            </div>

            {/* Corpo do card */}
            <div className="order-card-body">
              {/* Resumo do pedido */}
              <div className="order-summary">
                <div className="summary-item">
                  <div className="summary-icon">💰</div>
                  <div className="summary-label">Total</div>
                  <div className="summary-value">{formatPrice(order.total || 0)}</div>
                </div>

                <div className="summary-item">
                  <div className="summary-icon">📦</div>
                  <div className="summary-label">Itens</div>
                  <div className="summary-value">{order.line_items?.length || 0}</div>
                </div>

                <div className="summary-item">
                  <div className="summary-icon">💳</div>
                  <div className="summary-label">Pagamento</div>
                  <div className="summary-value">
                    {order.payment_method_title || order.paymentMethodTitle || 'N/A'}
                  </div>
                </div>

                <div className="summary-item">
                  <div className="summary-icon">🚚</div>
                  <div className="summary-label">Entrega</div>
                  <div className="summary-value">
                    {order.shipping_lines?.[0]?.method_title || 'N/A'}
                  </div>
                </div>
              </div>

              {/* Tempo restante para pedidos pendentes */}
              {order.status === 'pending' && !isOrderExpired(order) && (
                <div className="expiration-alert">
                  <ClockIcon />
                  <span>{getTimeUntilExpiration(order)}</span>
                </div>
              )}

              {/* Ações do pedido */}
              <div className="order-actions">
                <button
                  onClick={() => toggleOrderDetails(order.id)}
                  className="action-button"
                >
                  <EyeIcon />
                  <span>{expandedOrder === order.id ? 'Ocultar Detalhes' : 'Ver Detalhes'}</span>
                </button>

                {(isOrderExpired(order) || isCancelledOrder(order)) && (
                  <button
                    onClick={() => setShowDeleteConfirm(order.id)}
                    className="action-button danger"
                    disabled={deletingOrder === order.id}
                  >
                    {deletingOrder === order.id ? <Spinner /> : <TrashIcon />}
                    <span>Excluir</span>
                  </button>
                )}

                {order.status === 'pending' && isInfinitepayOrder(order) && (
                  <a
                    href={`/pedido/pagamento/${order.id}`}
                    className="action-button"
                    style={{ textDecoration: 'none' }}
                  >
                    <CreditCardIcon />
                    <span>Pagar Agora</span>
                  </a>
                )}
              </div>
            </div>

            {/* Detalhes expandidos */}
            {expandedOrder === order.id && (
              <div className="order-details">
                <div className="details-grid">
                  {/* Itens do pedido */}
                  <div className="detail-section">
                    <h3 className="detail-title">
                      <PackageIcon />
                      Itens do Pedido
                    </h3>
                    <div className="order-items">
                      {order.line_items?.map((item, index) => (
                        <div key={index} className="order-item">
                          <img
                            src={item.image?.src || DEFAULT_PLACEHOLDER}
                            alt={item.name}
                            className="item-image"
                            onError={(e) => {
                              e.target.src = DEFAULT_PLACEHOLDER;
                            }}
                          />
                          <div className="item-info">
                            <div className="item-name">{item.name}</div>
                            <div className="item-details">
                              Quantidade: {item.quantity} | Preço: {formatPrice(item.price)}
                            </div>
                          </div>
                          <div className="item-price">
                            {formatPrice(item.total)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Endereços */}
                  <div className="detail-section">
                    <h3 className="detail-title">
                      <ShippingIcon />
                      Endereço de Entrega
                    </h3>
                    {order.shipping ? (
                      <div className="text-sm text-gray-600">
                        <p><strong>{order.shipping.first_name} {order.shipping.last_name}</strong></p>
                        <p>{order.shipping.address_1}</p>
                        {order.shipping.address_2 && <p>{order.shipping.address_2}</p>}
                        <p>{order.shipping.city}, {order.shipping.state}</p>
                        <p>{order.shipping.postcode}</p>
                      </div>
                    ) : (
                      <p className="text-gray-500">Endereço não disponível</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Modal de confirmação de exclusão */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <div className="text-center">
                <div className="text-red-500 text-4xl mb-4">⚠️</div>
                <h3 className="text-lg font-semibold mb-2">Confirmar Exclusão</h3>
                <p className="text-gray-600 mb-6">
                  Tem certeza que deseja excluir este pedido? Esta ação não pode ser desfeita.
                </p>
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={() => setShowDeleteConfirm(null)}
                    className="action-button secondary"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => handleDeleteOrder(showDeleteConfirm)}
                    className="action-button danger"
                  >
                    <TrashIcon />
                    Confirmar Exclusão
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default OrdersTab;
