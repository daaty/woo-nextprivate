import React, { useState } from 'react';
import { useQuery, gql } from '@apollo/client';
import { useAuth } from '../src/hooks/useAuth';
import Layout from '../src/components/Layout';

// Query específica para testar pedidos
const GET_CUSTOMER_ORDERS = gql`
  query GetCustomerOrders {
    customer {
      id
      databaseId
      email
      orders {
        nodes {
          id
          databaseId
          orderNumber
          date
          status
          total
        }
      }
    }
  }
`;

// Query para testar pedido específico
const GET_ORDER_BY_ID = gql`
  query GetOrderById($id: ID!) {
    order(id: $id, idType: DATABASE_ID) {
      id
      databaseId
      orderNumber
      date
      status
      total
      customerId
    }
  }
`;

export default function TestOrders() {
  const { user, isLoggedIn } = useAuth();
  const [orderId, setOrderId] = useState('151');
  
  const { loading: customerLoading, error: customerError, data: customerData, refetch: refetchCustomer } = useQuery(GET_CUSTOMER_ORDERS, {
    skip: !isLoggedIn,
    fetchPolicy: 'network-only',
  });

  const { loading: orderLoading, error: orderError, data: orderData, refetch: refetchOrder } = useQuery(GET_ORDER_BY_ID, {
    variables: { id: orderId },
    fetchPolicy: 'network-only',
  });

  const testDirectAPI = async () => {
    try {
      console.log('🧪 Testando API direta do WooCommerce...');
      const response = await fetch(`/api/test-order/${orderId}`);
      const result = await response.json();
      console.log('📦 Resultado da API direta:', result);
      alert(`Resultado: ${JSON.stringify(result, null, 2)}`);
    } catch (error) {
      console.error('❌ Erro na API direta:', error);
      alert(`Erro: ${error.message}`);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">🔍 Teste de Debug - Pedidos</h1>
        
        {/* Estado de Autenticação */}
        <div className="bg-blue-50 p-4 rounded mb-6">
          <h2 className="text-xl font-semibold mb-4">📋 Estado da Autenticação</h2>
          <p><strong>Logado:</strong> {isLoggedIn ? '✅ Sim' : '❌ Não'}</p>
          <p><strong>Usuário:</strong> {user?.email || 'Não disponível'}</p>
          <p><strong>ID do usuário:</strong> {user?.databaseId || 'Não disponível'}</p>
        </div>

        {/* Teste de Pedidos do Cliente */}
        <div className="bg-green-50 p-4 rounded mb-6">
          <h2 className="text-xl font-semibold mb-4">🛒 Pedidos do Cliente (GraphQL)</h2>
          <button 
            onClick={() => refetchCustomer()} 
            className="bg-green-500 text-white px-4 py-2 rounded mb-4"
          >
            🔄 Recarregar Pedidos
          </button>
          
          {customerLoading && <p>⏳ Carregando pedidos do cliente...</p>}
          {customerError && (
            <div className="text-red-600">
              <p>❌ Erro: {customerError.message}</p>
              <pre className="bg-red-100 p-2 rounded text-sm mt-2">
                {JSON.stringify(customerError, null, 2)}
              </pre>
            </div>
          )}
          {customerData && (
            <div>
              <p><strong>Cliente ID:</strong> {customerData.customer?.databaseId}</p>
              <p><strong>Email:</strong> {customerData.customer?.email}</p>
              <p><strong>Número de pedidos:</strong> {customerData.customer?.orders?.nodes?.length || 0}</p>
              <pre className="bg-gray-100 p-2 rounded text-sm mt-2">
                {JSON.stringify(customerData, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Teste de Pedido Específico */}
        <div className="bg-yellow-50 p-4 rounded mb-6">
          <h2 className="text-xl font-semibold mb-4">🎯 Teste de Pedido Específico</h2>
          <div className="flex gap-2 mb-4">
            <input 
              type="text" 
              value={orderId} 
              onChange={(e) => setOrderId(e.target.value)}
              className="border px-3 py-2 rounded"
              placeholder="ID do pedido"
            />
            <button 
              onClick={() => refetchOrder()} 
              className="bg-yellow-500 text-white px-4 py-2 rounded"
            >
              🔍 Buscar Pedido
            </button>
          </div>
          
          {orderLoading && <p>⏳ Carregando pedido específico...</p>}
          {orderError && (
            <div className="text-red-600">
              <p>❌ Erro: {orderError.message}</p>
              <pre className="bg-red-100 p-2 rounded text-sm mt-2">
                {JSON.stringify(orderError, null, 2)}
              </pre>
            </div>
          )}
          {orderData && (
            <pre className="bg-gray-100 p-2 rounded text-sm">
              {JSON.stringify(orderData, null, 2)}
            </pre>
          )}
        </div>

        {/* Teste de API Direta */}
        <div className="bg-purple-50 p-4 rounded">
          <h2 className="text-xl font-semibold mb-4">🚀 Teste API Direta WooCommerce</h2>
          <button 
            onClick={testDirectAPI}
            className="bg-purple-500 text-white px-4 py-2 rounded"
          >
            🧪 Testar API Direta
          </button>
        </div>
      </div>
    </Layout>
  );
}
