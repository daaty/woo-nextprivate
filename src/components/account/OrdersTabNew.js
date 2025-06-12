import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Link from 'next/link';
import LoadingSpinner from '../LoadingSpinner';

const OrdersTab = () => {
  console.log('[OrdersTab] Inicializando componente com API direta');
  const { user, isLoggedIn } = useAuth();
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  console.log('[OrdersTab] Dados do usuário disponíveis:', user ? true : false);
  console.log('[OrdersTab] ID do usuário:', user?.id);
  console.log('[OrdersTab] Database ID do usuário:', user?.databaseId);
  console.log('[OrdersTab] Email do usuário:', user?.email);
  console.log('[OrdersTab] Usuário logado:', isLoggedIn);

  // Função para buscar pedidos usando API direta do WooCommerce
  const fetchOrdersDirect = async () => {
    if (!isLoggedIn || !user?.databaseId) {
      console.log('[OrdersTab] Usuário não logado ou sem databaseId');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      console.log('[OrdersTab] Buscando pedidos via API direta para customer:', user.databaseId);
      
      const response = await fetch(`/api/orders/customer-orders?customerId=${user.databaseId}`);
      const result = await response.json();
      console.log('[OrdersTab] Resultado da API direta:', result);

      if (result.success && result.orders) {
        setOrders(result.orders);
        console.log('[OrdersTab] Pedidos carregados:', result.orders.length);
      } else {
        setError(result.error || 'Erro ao carregar pedidos');
        console.error('[OrdersTab] Erro ao carregar pedidos:', result.error);
      }
    } catch (error) {
      console.error('[OrdersTab] Erro na requisição:', error);
      setError('Erro de conexão ao carregar pedidos');
    } finally {
      setLoading(false);
    }
  };

  // Carregar pedidos quando usuário estiver logado
  useEffect(() => {
    console.log('[OrdersTab] useEffect - verificação de dados do usuário');
    if (isLoggedIn && user?.databaseId) {
      console.log('[OrdersTab] Usuário logado, buscando pedidos via API direta...');
      fetchOrdersDirect();
    } else {
      console.log('[OrdersTab] Usuário não logado ou sem databaseId, pulando busca');
      setOrders([]);
    }
  }, [isLoggedIn, user?.databaseId]);

  const toggleOrderDetails = (orderId) => {
    console.log('[OrdersTab] Alternando detalhes do pedido:', orderId);
    if (expandedOrder === orderId) {
      setExpandedOrder(null);
    } else {
      setExpandedOrder(orderId);
    }
  };

  const formatDate = (dateString) => {
    const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('pt-BR', options);
  };

  const getStatusColor = (status) => {
    switch(status.toLowerCase()) {
      case 'completed':
      case 'concluído':
        return 'bg-green-100 text-green-800';
      case 'processing':
      case 'processando':
        return 'bg-blue-100 text-blue-800';
      case 'on-hold':
      case 'aguardando':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
      case 'cancelado':
        return 'bg-red-100 text-red-800';
      case 'pending':
      case 'pendente':
        return 'bg-gray-100 text-gray-800';
      case 'refunded':
      case 'reembolsado':
        return 'bg-purple-100 text-purple-800';
      case 'failed':
      case 'falhou':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-md">
        <h3 className="text-lg font-medium text-red-800">Erro ao carregar pedidos</h3>
        <p className="mt-2 text-red-700">Ocorreu um erro ao carregar seus pedidos. Por favor, tente novamente mais tarde.</p>
        <p className="mt-1 text-xs text-red-500">Erro: {error}</p>
        <button 
          onClick={() => {
            console.log('[OrdersTab] Tentando refetch após erro');
            fetchOrdersDirect();
          }} 
          className="mt-3 text-red-600 hover:text-red-800 font-medium"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  if (orders.length === 0) {
    console.log('[OrdersTab] Nenhum pedido encontrado');
    return (
      <div>
        <h2 className="text-2xl font-bold mb-6">Meus Pedidos</h2>
        <div className="bg-yellow-50 p-4 rounded-md">
          <p className="text-yellow-700">Você ainda não realizou nenhum pedido.</p>
          <Link href="/smartphones" className="mt-3 inline-block text-orange-600 hover:text-orange-800 font-medium">
            Começar a comprar
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Meus Pedidos</h2>
      
      {/* Debug info - temporário */}
      <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded">
        <p className="text-sm text-green-700">
          ✅ API Direta funcionando! Encontrados {orders.length} pedidos para customer ID: {user?.databaseId}
        </p>
      </div>
      
      <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Pedido
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Data
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {orders.map((order) => (
              <React.Fragment key={order.id}>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    #{order.orderNumber}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(order.date)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {order.total}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => toggleOrderDetails(order.id)}
                      className="text-orange-600 hover:text-orange-900 mr-3"
                    >
                      {expandedOrder === order.id ? 'Ocultar detalhes' : 'Ver detalhes'}
                    </button>
                    <Link 
                      href={`/pedido/${order.id}`}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Ver pedido
                    </Link>
                  </td>
                </tr>
                
                {/* Detalhes do pedido expandidos */}
                {expandedOrder === order.id && (
                  <tr>
                    <td colSpan="5" className="px-6 py-4">
                      <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                        <h4 className="font-medium text-lg mb-4">Detalhes do Pedido #{order.orderNumber}</h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Produtos */}
                          <div>
                            <h5 className="font-medium text-gray-700 mb-3">Produtos</h5>
                            <div className="space-y-2">
                              {order.items && order.items.length > 0 ? (
                                order.items.map((item, index) => (
                                  <div key={index} className="flex justify-between items-center p-2 bg-white rounded border">
                                    <div>
                                      <p className="font-medium">{item.name}</p>
                                      <p className="text-sm text-gray-500">Qtd: {item.quantity}</p>
                                    </div>
                                    <div className="text-right">
                                      <p className="font-medium">{item.total}</p>
                                      <p className="text-sm text-gray-500">Unit: {item.price}</p>
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <p className="text-gray-500">Itens não disponíveis</p>
                              )}
                            </div>
                          </div>
                          
                          {/* Informações do pedido */}
                          <div>
                            <h5 className="font-medium text-gray-700 mb-3">Informações de Entrega</h5>
                            <div className="bg-white p-3 rounded border">
                              {order.shipping ? (
                                <div>
                                  <p className="font-medium">
                                    {order.shipping.firstName} {order.shipping.lastName}
                                  </p>
                                  <p className="text-sm text-gray-600">
                                    {order.shipping.address}<br/>
                                    {order.shipping.city}, {order.shipping.state} - {order.shipping.postcode}
                                  </p>
                                </div>
                              ) : (
                                <p className="text-gray-500">Endereço não disponível</p>
                              )}
                            </div>
                            
                            <div className="mt-4">
                              <h5 className="font-medium text-gray-700 mb-2">Pagamento</h5>
                              <div className="bg-white p-3 rounded border">
                                <p className="text-sm">
                                  <strong>Método:</strong> {order.paymentMethod || 'Não informado'}
                                </p>
                                <p className="text-sm">
                                  <strong>Status:</strong> {order.status}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center">
                          <div>
                            <p className="text-sm text-gray-600">
                              Pedido criado em: {formatDate(order.date)}
                            </p>
                          </div>
                          <div>
                            <span className="font-bold text-lg">Total: {order.total}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OrdersTab;
