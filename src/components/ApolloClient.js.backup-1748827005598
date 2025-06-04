import fetch from 'node-fetch';
import { ApolloClient, ApolloLink, InMemoryCache, createHttpLink } from "@apollo/client";

/**
 * Middleware operation
 * If we have a session token in localStorage, add it to the GraphQL request as a Session header.
 * Also handles JWT authentication tokens from cookies.
 */
export const middleware = new ApolloLink((operation, forward) => {
  /**
   * If session data exist in local storage, set value as session header.
   */
  const session = (typeof window !== 'undefined') ? localStorage.getItem("woo-session") : null;
  
  // Get JWT token from cookies - Implementação melhorada para detecção mais confiável
  const getJWTToken = () => {
    if (typeof window === 'undefined') return null;
    
    // Verifica se há algum sinal de autenticação antes de gerar logs
    const hasAuthCookies = document.cookie.includes('wordpress_logged_in') || 
                         document.cookie.includes('auth_token') ||
                         document.cookie.includes('refresh_token');
    
    // Só mostramos cookies disponíveis no debug se realmente detectarmos algum sinal de autenticação
    // para evitar logs enganosos em cada requisição
    if (hasAuthCookies) {
      console.log("[ApolloClient] Cookies disponíveis:", document.cookie);
    }
    
    const getCookieValue = (name) => {
      // Implementação mais robusta para detecção de cookies
      const cookies = document.cookie.split(';').map(cookie => cookie.trim());
      for (const cookie of cookies) {
        if (cookie.startsWith(`${name}=`)) {
          const value = cookie.substring(name.length + 1);
          console.log(`[ApolloClient] Cookie '${name}' encontrado com valor: ${value.substring(0, 20)}...`);
          return value;
        }
      }
      
      // Evitamos gerar logs "não encontrado" para cada cookie
      // para reduzir ruído quando o usuário está realmente logado
      if (hasAuthCookies) {
        console.log(`[ApolloClient] Cookie '${name}' não encontrado, mas há outros cookies de autenticação`);
      }
      return null;
    };
    
    // Tentar first client cookie (não-httpOnly)
    const clientToken = getCookieValue('auth_token_client');
    
    // Tentar httpOnly cookie como fallback (não funcionará no navegador)
    const httpOnlyToken = getCookieValue('auth_token');
    
    // Tentar ler do localStorage como último recurso
    const localStorageToken = typeof localStorage !== 'undefined' ? localStorage.getItem('auth_token_client') : null;
    
    // Verificar cookie wordpress_logged_in que indica sessão WP ativa mesmo sem JWT específico
    const wordpressLoggedIn = document.cookie.includes('wordpress_logged_in');
    
    // Usar qualquer token disponível, com prioridade para cookies
    const token = clientToken || httpOnlyToken || localStorageToken;
    
    if (token) {
      console.log("[ApolloClient] Token JWT encontrado:", `${token.substring(0, 20)}...`);
      return token;
    } else if (wordpressLoggedIn) {
      console.log("[ApolloClient] Nenhum token JWT explícito, mas cookie wordpress_logged_in detectado - usuário autenticado");
      // Retornamos 'wordpress_session' como um marcador para indicar autenticação mesmo sem JWT
      return 'wordpress_session';
    }
    
    return null;
  };

  // Get auth token dynamically for each request
  const authToken = getJWTToken();

  const headers = {};
  
  if (session) {
    headers["woocommerce-session"] = `Session ${session}`;
  }
  
  if (authToken) {
    // Se for o token especial 'wordpress_session', não enviamos como JWT mas apenas adicionamos informação no header
    if (authToken === 'wordpress_session') {
      headers["X-WordPress-Auth"] = "1";
      console.log('[ApolloClient] ✅ Sessão WordPress detectada, enviando header de autenticação');
    } else {
      headers["Authorization"] = `Bearer ${authToken}`;
      headers["X-JWT-Auth"] = authToken;
      console.log('[ApolloClient] ✅ Token JWT adicionado aos cabeçalhos:', authToken.substring(0, 20) + '...');
    }
    console.log('[ApolloClient] ✅ Headers que serão enviados:', Object.keys(headers));
  } else {
    // Verificar se temos qualquer outro cookie de autenticação antes de exibir mensagem de guest
    const hasAnyAuthCookie = typeof window !== 'undefined' && (
      document.cookie.includes('wordpress_logged_in') || 
      document.cookie.includes('refresh_token')
    );
    
    if (hasAnyAuthCookie) {
      console.log('[ApolloClient] ℹ️ Nenhum token JWT explícito, mas outros cookies de autenticação detectados');
    } else {
      console.log('[ApolloClient] ℹ️ Nenhum token JWT ou cookie de autenticação encontrado');
      console.log('[ApolloClient] ℹ️ Enviando requisição como guest');
    }
  }

  if (Object.keys(headers).length > 0) {
    operation.setContext(({ headers: existingHeaders = {} }) => ({
      headers: {
        ...existingHeaders,
        ...headers
      }
    }));
  }

  return forward(operation);
});

/**
 * Afterware operation.
 *
 * This catches the incoming session token and stores it in localStorage, for future GraphQL requests.
 */
export const afterware = new ApolloLink((operation, forward) => {
  return forward(operation).map(response => {
    if (typeof window === 'undefined') {
      return response;
    }

    /**
     * Check for session header and update session in local storage accordingly.
     */
    const context = operation.getContext();
    const { response: { headers } } = context;
    const session = headers.get("woocommerce-session");

    if (session) {
      // Remove session data if session destroyed.
      if ("false" === session) {
        localStorage.removeItem("woo-session");
      } 
      // Update session new data if changed.
      else if (localStorage.getItem("woo-session") !== session) {
        localStorage.setItem("woo-session", headers.get("woocommerce-session"));
        console.log("🔐 Sessão WooCommerce atualizada:", headers.get("woocommerce-session"));
      }
    }

    return response;
  });
});

// Cria um link HTTP com as configurações corretas e timeout
const httpLink = createHttpLink({
  uri: typeof window === 'undefined'
    ? 'https://rota.rotadoscelulares.com/graphql' // Use direct URL for server-side
    : '/api/graphql', // Use API route for client-side to avoid CORS
  fetch: fetch,
  credentials: 'same-origin',
  fetchOptions: {
    mode: 'cors',
    timeout: 10000, // 10 segundos timeout
  },
});

// Apollo GraphQL client.
const client = new ApolloClient({
  link: middleware.concat(afterware.concat(httpLink)),
  cache: new InMemoryCache({
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
      fetchPolicy: 'cache-first',
      errorPolicy: 'ignore',
      notifyOnNetworkStatusChange: false,
    },
    query: {
      fetchPolicy: 'cache-first',
      errorPolicy: 'ignore',
    },
    mutate: {
      fetchPolicy: 'no-cache',
      errorPolicy: 'ignore',
    },
  },
  connectToDevTools: process.env.NODE_ENV === 'development', // Ferramentas de desenvolvimento Apollo para debug
});

export default client;
