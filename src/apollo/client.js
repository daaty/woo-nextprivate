import { ApolloClient, InMemoryCache, createHttpLink, from, ApolloLink } from '@apollo/client';
import { onError } from '@apollo/client/link/error';
import { useMemo } from 'react';

// Link de tratamento de erros com suporte a renovação de token
const errorLink = onError(({ graphQLErrors, networkError, operation, forward }) => {
  // Log de erros para depuração
  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, locations, path }) => {
      console.error(
        `[GraphQL error]: Message: ${message}, Location: ${JSON.stringify(locations)}, Path: ${path}`
      );
      
      // Detectar erro de token expirado
      if (message.includes("Expired token") || message.toLowerCase().includes("invalid token")) {
        console.log("🔄 Token expirado detectado, removendo sessão atual e preparando renovação");
        
        // Remover token expirado do localStorage para forçar uma nova sessão
        if (typeof window !== 'undefined') {
          localStorage.removeItem('woo-session');
        }
        
        // O proxy GraphQL em /api/graphql vai tentar renovar a sessão automaticamente
      }
    });
  }
  
  if (networkError) console.error(`[Network error]: ${networkError}`);
});

// Middleware para gerenciar sessão do WooCommerce e autenticação
const sessionLink = new ApolloLink((operation, forward) => {
  // Se estamos no cliente, tentamos obter os tokens armazenados
  if (typeof window !== 'undefined') {
    const wooSession = localStorage.getItem('woo-session');
    
    // Tentar obter token de autenticação dos cookies
    const getCookieValue = (name) => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop().split(';').shift();
      return null;
    };
    
    const authToken = getCookieValue('auth_token');
    
    // Configurar headers
    const headers = {};
    
    // Se temos um token de sessão, adicioná-lo ao cabeçalho da requisição
    if (wooSession) {
      headers['woocommerce-session'] = `Session ${wooSession}`;
      console.log('[Apollo] Usando sessão WooCommerce do localStorage');
    }
    
    // Se temos um token de autenticação, adicioná-lo aos cabeçalhos necessários para WPGraphQL
    if (authToken) {
      // Cabeçalho padrão para autenticação JWT
      headers['Authorization'] = `Bearer ${authToken}`;
      // Cabeçalho específico do WPGraphQL JWT Authentication
      headers['X-JWT-Auth'] = authToken;
      console.log('[Apollo] Usando token de autenticação JWT:', authToken.substring(0, 20) + '...');
    }
    
    // Aplicar headers se houver algum
    if (Object.keys(headers).length > 0) {
      operation.setContext(({ headers: existingHeaders = {} }) => ({
        headers: {
          ...existingHeaders,
          ...headers
        }
      }));
    }
  }
  
  return forward(operation);
});

// AFTERWARE DESATIVADO: Estava causando erros de parsing
// Remoção temporária para estabilizar o sistema

// DESATIVADO: Retry link completamente removido para parar os erros
const retryLink = new ApolloLink((operation, forward) => {
  // SEM RETRY - apenas passa a operação adiante
  return forward(operation);
});

// Define a URL base para o GraphQL, utilizando uma URL completa e absoluta para evitar erros de parsing
const getGraphQLUri = () => {
  // Quando executando no servidor, usar a URL completa
  if (typeof window === 'undefined') {
    return process.env.NEXT_PUBLIC_WORDPRESS_URL 
      ? `${process.env.NEXT_PUBLIC_WORDPRESS_URL}/graphql`
      : 'https://rota.rotadoscelulares.com/graphql';
  }
  
  // Quando no browser, usar a rota local que será redirecionada pelo Next.js
  // Usar URL absoluta com o domínio atual para evitar erros de parsing
  const origin = window.location.origin;
  return `${origin}/api/graphql`;
};

// Link HTTP para o GraphQL com timeout para evitar requests pendurados
const httpLink = createHttpLink({
  uri: getGraphQLUri(), 
  credentials: 'same-origin',
  fetchOptions: {
    timeout: 10000, // 10 segundos timeout
  },
});

// Função para criar um cliente Apollo
function createApolloClient() {
    return new ApolloClient({
    ssrMode: typeof window === 'undefined',
    // CONFIGURAÇÃO DE EMERGÊNCIA: Apenas links essenciais
    link: from([
      errorLink,
      sessionLink,
      httpLink
    ]),    cache: new InMemoryCache({
      typePolicies: {
        Cart: {
          // Não mesclar resultados de cart, sempre usar o mais recente
          merge: false,
          // Campos que não devem ser normalizados
          fields: {
            contents: {
              merge: false
            },
            total: {
              merge: false
            }
          }
        }
      }
    }),
    defaultOptions: {
      watchQuery: {
        fetchPolicy: 'network-only', // Mudado para garantir dados frescos
        errorPolicy: 'all',
        notifyOnNetworkStatusChange: true,
      },
      query: {
        fetchPolicy: 'network-only', // Mudado para carrinho sempre atualizado
        errorPolicy: 'all',
      },
      mutate: {
        fetchPolicy: 'no-cache',
        errorPolicy: 'all',
      },
    },
  });
}

// Variável para armazenar a instância do cliente
let apolloClient;

// Função para inicializar o cliente Apollo
export function initializeApollo(initialState = null) {
  // Criar uma nova instância do cliente Apollo se não existir uma
  const _apolloClient = apolloClient ?? createApolloClient();
  
  // Se houver um estado inicial, restaurá-lo no cache
  if (initialState) {
    _apolloClient.cache.restore(initialState);
  }
  
  // Para SSG e SSR, sempre criar um novo cliente Apollo
  if (typeof window === 'undefined') return _apolloClient;
  
  // Criar o cliente Apollo apenas uma vez no lado do cliente
  if (!apolloClient) apolloClient = _apolloClient;
  
  return _apolloClient;
}

// Hook para usar o cliente Apollo com cache persistente
export function useApollo(initialState) {
  const store = useMemo(() => initializeApollo(initialState), [initialState]);
  return store;
}

// Cliente Apollo para uso no lado do cliente
export const client = initializeApollo();
