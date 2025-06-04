// Arquivo de teste para debug da query de pedidos
import { useQuery, gql } from '@apollo/client';
import { useAuth } from '../../contexts/AuthContext';
import { useEffect } from 'react';

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

export const TestOrdersQuery = () => {
  const { user, isLoggedIn } = useAuth();
  
  const { loading, error, data } = useQuery(GET_CUSTOMER_ORDERS, {
    skip: !isLoggedIn,
    fetchPolicy: 'network-only',
    onCompleted: (data) => {
      console.log('[TEST] Query completada:', data);
    },
    onError: (error) => {
      console.error('[TEST] Erro na query:', error);
    }
  });

  useEffect(() => {
    console.log('[TEST] Auth status:', { isLoggedIn, user });
    console.log('[TEST] Query status:', { loading, error, data });
  }, [isLoggedIn, user, loading, error, data]);

  if (!isLoggedIn) {
    return <div>Usuário não logado</div>;
  }

  if (loading) {
    return <div>Carregando...</div>;
  }

  if (error) {
    return <div>Erro: {error.message}</div>;
  }

  return (
    <div>
      <h3>Teste de Query de Pedidos</h3>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
};
