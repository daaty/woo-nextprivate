import fetch from 'node-fetch';
import cookie from 'cookie';

/**
 * Proxy melhorado para requisições GraphQL do WordPress WooCommerce
 * Inclui retry logic, melhor tratamento de timeout e error handling robusto
 */
export default async function handler(req, res) {
  // Verificar se a requisição é POST (GraphQL usa POST)
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

  const startTime = Date.now();
  console.log(`[GraphQL Proxy] 🚀 Iniciando processamento da requisição`);

  try {
    // URL do WordPress
    const wordpressUrl = process.env.NEXT_PUBLIC_WORDPRESS_URL || 'https://rota.rotadoscelulares.com';
    const graphqlEndpoint = `${wordpressUrl}/graphql`;
    
    console.log(`[GraphQL Proxy] 🔗 Endpoint: ${graphqlEndpoint}`);
    console.log(`[GraphQL Proxy] 🌐 WordPress URL: ${process.env.NEXT_PUBLIC_WORDPRESS_URL}`);
    
    // Preparar headers base
    const headers = {
      'Content-Type': 'application/json',
      'User-Agent': 'NextJS-GraphQL-Proxy/1.0',
    };
    
    // Transferir headers relevantes do cliente
    if (req.headers.cookie) {
      headers.Cookie = req.headers.cookie;
    }
    
    if (req.headers['woocommerce-session']) {
      headers['woocommerce-session'] = req.headers['woocommerce-session'];
    }
      
    if (req.headers.authorization) {
      headers.Authorization = req.headers.authorization;
      console.log('[GraphQL Proxy] 🔐 Token de autenticação incluído');
    }
    
    if (req.headers['x-jwt-auth']) {
      headers['X-JWT-Auth'] = req.headers['x-jwt-auth'];
      console.log('[GraphQL Proxy] 🎫 X-JWT-Auth header incluído');
    }

    // Flag para controle de renovação de sessão
    let isRetryingWithNewSession = false;

    /**
     * Função para fazer requisição GraphQL com retry logic e timeout
     */
    const makeGraphQLRequest = async (includeSession = true, retryAttempt = 0) => {
      const requestHeaders = { ...headers };
      
      // Se estamos fazendo retry sem sessão, remover header de sessão
      if (!includeSession && requestHeaders['woocommerce-session']) {
        delete requestHeaders['woocommerce-session'];
        console.log('[GraphQL Proxy] 🔄 Removendo header de sessão para retry');
      }
      
      // Timeout progressivo: primeira tentativa 30s, retry 45s
      const timeoutDuration = retryAttempt === 0 ? 30000 : 45000;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutDuration);
      
      try {
        console.log(`[GraphQL Proxy] ⏱️ Tentativa ${retryAttempt + 1} - Timeout: ${timeoutDuration/1000}s`);
        
        const response = await fetch(graphqlEndpoint, {
          method: 'POST',
          headers: requestHeaders,
          body: JSON.stringify(req.body),
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        
        const responseTime = Date.now() - startTime;
        console.log(`[GraphQL Proxy] 📡 Resposta recebida em ${responseTime}ms - Status: ${response.status}`);
        
        // Verificar se a resposta é válida
        if (!response.ok) {
          console.error(`[GraphQL Proxy] ❌ Erro HTTP ${response.status}: ${response.statusText}`);
          
          // Para alguns erros HTTP, vale a pena tentar novamente (apenas uma vez)
          if (retryAttempt === 0 && (response.status === 502 || response.status === 503 || response.status === 504)) {
            console.log(`[GraphQL Proxy] 🔄 Retry devido ao erro ${response.status}...`);
            await new Promise(resolve => setTimeout(resolve, 2000)); // Aguardar 2s
            return makeGraphQLRequest(includeSession, retryAttempt + 1);
          }
          
          throw new Error(`GraphQL server responded with status ${response.status}: ${response.statusText}`);
        }
        
        // Processar resposta
        const responseBody = await response.text();
        let parsedBody;
        
        try {
          if (!responseBody || responseBody.trim() === '') {
            throw new Error('Empty response from GraphQL server');
          }
          
          parsedBody = JSON.parse(responseBody);
          console.log(`[GraphQL Proxy] ✅ Resposta processada com sucesso`);
        } catch (parseError) {
          console.error('[GraphQL Proxy] ❌ Erro ao fazer parsing da resposta:', parseError);
          console.error('[GraphQL Proxy] Response body preview:', responseBody.substring(0, 200));
          throw new Error('Invalid JSON response from GraphQL server');
        }
        
        return { response, parsedBody };
        
      } catch (error) {
        clearTimeout(timeoutId);
        
        // Tratamento específico de erros
        if (error.name === 'AbortError') {
          console.error(`[GraphQL Proxy] ⏰ Timeout após ${timeoutDuration/1000}s`);
          
          // Se for primeira tentativa e teve timeout, tentar novamente com timeout maior
          if (retryAttempt === 0) {
            console.log('[GraphQL Proxy] 🔄 Retry devido ao timeout...');
            await new Promise(resolve => setTimeout(resolve, 1000)); // Aguardar 1s
            return makeGraphQLRequest(includeSession, retryAttempt + 1);
          }
          
          throw new Error('Timeout: O servidor WordPress está demorando muito para responder. Tente novamente em alguns instantes.');
        }
        
        if (error.code === 'ECONNREFUSED') {
          console.error('[GraphQL Proxy] 🔌 Conexão recusada pelo servidor');
          throw new Error('Não foi possível conectar ao servidor WordPress. Verifique se o servidor está funcionando.');
        }
        
        if (error.code === 'ENOTFOUND') {
          console.error('[GraphQL Proxy] 🌐 Domínio não encontrado');
          throw new Error('Domínio do WordPress não encontrado. Verifique a configuração.');
        }
        
        if (error.code === 'ECONNRESET') {
          console.error('[GraphQL Proxy] 🔌 Conexão resetada pelo servidor');
          throw new Error('Conexão com o servidor foi interrompida. Tente novamente.');
        }
        
        console.error('[GraphQL Proxy] ❌ Erro na requisição:', error.message);
        throw error;
      }
    };

    // Fazer a requisição inicial
    let { response, parsedBody } = await makeGraphQLRequest();
    
    // Verificar se temos erro de token expirado
    const hasExpiredTokenError = parsedBody?.errors?.some(error => 
      error.message?.includes('Expired token') || 
      error.message?.toLowerCase()?.includes('invalid token')
    );

    // CIRCUIT BREAKER: Tentar renovar sessão apenas UMA vez
    if (hasExpiredTokenError && !isRetryingWithNewSession) {
      console.log('[GraphQL Proxy] 🔄 Token expirado detectado, tentando renovar sessão...');
      isRetryingWithNewSession = true;
      
      try {
        // Fazer nova requisição sem o token de sessão para gerar um novo
        const newSessionResult = await makeGraphQLRequest(false);
        response = newSessionResult.response;
        parsedBody = newSessionResult.parsedBody;
        console.log('[GraphQL Proxy] ✅ Sessão renovada com sucesso');
      } catch (retryError) {
        console.error('[GraphQL Proxy] ❌ Falha ao renovar sessão:', retryError);
        // Se a renovação falhar, usar a resposta original
      }
    }
    
    // Transferir cookies da resposta do WordPress para o cliente
    const setCookieHeader = response.headers.get('set-cookie');
    if (setCookieHeader) {
      res.setHeader('Set-Cookie', setCookieHeader);
    }
    
    // Transferir o cabeçalho woocommerce-session
    const wooSession = response.headers.get('woocommerce-session');
    if (wooSession) {
      res.setHeader('woocommerce-session', wooSession);
      
      // Indicar se a sessão foi renovada
      if (isRetryingWithNewSession) {
        res.setHeader('x-woo-session-renewed', 'true');
      }
    }
    
    const totalTime = Date.now() - startTime;
    console.log(`[GraphQL Proxy] ✅ Requisição concluída em ${totalTime}ms`);
    
    // Retornar resposta
    return res.status(response.status).json(parsedBody);
    
  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error(`[GraphQL Proxy] ❌ Erro após ${totalTime}ms:`, error.message);
    
    // Determinar status code apropriado baseado no tipo de erro
    let statusCode = 500;
    let errorMessage = error.message || 'Erro interno no servidor ao processar requisição GraphQL';
    
    if (error.message?.includes('Timeout')) {
      statusCode = 504; // Gateway Timeout
    } else if (error.message?.includes('Não foi possível conectar')) {
      statusCode = 502; // Bad Gateway
    } else if (error.message?.includes('Domínio não encontrado')) {
      statusCode = 502; // Bad Gateway
    }
    
    return res.status(statusCode).json({
      errors: [
        {
          message: errorMessage,
          extensions: {
            code: 'GRAPHQL_PROXY_ERROR',
            timestamp: new Date().toISOString(),
            duration: totalTime
          }
        },
      ],
    });
  }
}
