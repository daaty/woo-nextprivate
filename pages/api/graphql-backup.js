import fetch from 'node-fetch';
import cookie from 'cookie';

/**
 * Proxy para requisições GraphQL do WordPress WooCommerce
 * Esta implementação adiciona suporte à renovação de sessões expiradas
 */
export default async function handler(req, res) {
  // Verificar se a requisição é POST (GraphQL usa POST)
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método não permitido' });
  }
  try {
    // URL do WordPress
    const wordpressUrl = process.env.NEXT_PUBLIC_WORDPRESS_URL || 'https://rota.rotadoscelulares.com';
    const graphqlEndpoint = `${wordpressUrl}/graphql`;
    
    console.log(`[GraphQL Proxy] 🔗 Enviando requisição para: ${graphqlEndpoint}`);
    console.log(`[GraphQL Proxy] 🌐 WordPress URL configurada: ${process.env.NEXT_PUBLIC_WORDPRESS_URL}`);
    console.log(`[GraphQL Proxy] 📋 Variables de ambiente disponíveis:`);
    console.log(`   - NEXT_PUBLIC_WORDPRESS_URL: ${process.env.NEXT_PUBLIC_WORDPRESS_URL}`);
    console.log(`   - NEXT_PUBLIC_WORDPRESS_SITE_URL: ${process.env.NEXT_PUBLIC_WORDPRESS_SITE_URL}`);
    console.log(`   - NEXT_PUBLIC_SITE_URL: ${process.env.NEXT_PUBLIC_SITE_URL}`);
    
      // Preparar headers
    const headers = {
      'Content-Type': 'application/json',
    };
    
    // Transferir cookies do cliente para o WordPress para manter a sessão
    if (req.headers.cookie) {
      headers.Cookie = req.headers.cookie;
    }
    
    // Se temos um cabeçalho woocommerce-session, enviar para o WordPress também
    if (req.headers['woocommerce-session']) {
      headers['woocommerce-session'] = req.headers['woocommerce-session'];
    }
      // Se temos um cabeçalho Authorization, enviar para o WordPress também
    if (req.headers.authorization) {
      headers.Authorization = req.headers.authorization;
      console.log('[GraphQL Proxy] Repassando token de autenticação para WordPress');
    }
    
    // Se temos um cabeçalho X-JWT-Auth, enviar para o WordPress também (necessário para WPGraphQL JWT)
    if (req.headers['x-jwt-auth']) {
      headers['X-JWT-Auth'] = req.headers['x-jwt-auth'];
      console.log('[GraphQL Proxy] Repassando X-JWT-Auth header para WordPress');
    }

    // Flag para rastrear se estamos tentando fazer uma nova requisição com sessão renovada
    let isRetryingWithNewSession = false;
      // Função para fazer a requisição GraphQL com timeout
    const makeGraphQLRequest = async (includeSession = true) => {
      const requestHeaders = { ...headers };
      
      // Se estamos fazendo uma segunda tentativa sem sessão, remova o cabeçalho woocommerce-session
      if (!includeSession && requestHeaders['woocommerce-session']) {
        delete requestHeaders['woocommerce-session'];
      }
        // Timeout controller para evitar requests pendurados
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // Aumentado para 30 segundos
      
      try {
        console.log(`[GraphQL Proxy] ⏱️ Iniciando requisição com timeout de 30s para: ${graphqlEndpoint}`);
        
        const response = await fetch(graphqlEndpoint, {
          method: 'POST',
          headers: requestHeaders,
          body: JSON.stringify(req.body),
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        
        console.log(`[GraphQL Proxy] 📡 Resposta recebida - Status: ${response.status}`);
        
        // Verificar se a resposta é válida
        if (!response.ok) {
          console.error(`[GraphQL Proxy] ❌ Erro HTTP ${response.status}: ${response.statusText}`);
          throw new Error(`GraphQL server responded with status ${response.status}: ${response.statusText}`);
        }
        
        // Obter a resposta como texto para manipular os cabeçalhos primeiro
        const responseBody = await response.text();
        let parsedBody;
        
        try {
          // Verificar se o responseBody não está vazio
          if (!responseBody || responseBody.trim() === '') {
            throw new Error('Empty response from GraphQL server');
          }
          
          parsedBody = JSON.parse(responseBody);
        } catch (e) {
          console.error('Erro ao fazer parsing da resposta GraphQL:', e);
          console.error('Response body:', responseBody);
          throw new Error('Invalid JSON response from GraphQL server');
        }
        
        return { response, parsedBody };
      } catch (error) {
        clearTimeout(timeoutId);
          // Tratar erros específicos
        if (error.name === 'AbortError') {
          console.error('[GraphQL Proxy] ⏰ Timeout: WordPress server demorou mais de 30s para responder');
          throw new Error('Timeout: O servidor WordPress está demorando muito para responder. Tente novamente em alguns instantes.');
        }
        
        if (error.code === 'ECONNREFUSED') {
          console.error('[GraphQL Proxy] 🔌 Conexão recusada pelo servidor WordPress');
          throw new Error('Não foi possível conectar ao servidor WordPress. Verifique se o servidor está funcionando.');
        }
        
        if (error.code === 'ENOTFOUND') {
          console.error('[GraphQL Proxy] 🌐 Domínio não encontrado');
          throw new Error('Domínio do WordPress não encontrado. Verifique a configuração.');
        }
        
        console.error('[GraphQL Proxy] ❌ Erro na requisição:', error.message);
        throw error;
      }
    };
      // Fazer a requisição inicial para o WordPress com circuit breaker
    let { response, parsedBody } = await makeGraphQLRequest();
    
    // Verificar se temos um erro de token expirado (tentar apenas UMA vez)
    const hasExpiredTokenError = parsedBody?.errors?.some(error => 
      error.message?.includes('Expired token') || 
      error.message?.toLowerCase()?.includes('invalid token')
    );

    // CIRCUIT BREAKER: Se o token expirou e não estamos já em uma tentativa de renovação, tentar APENAS UMA VEZ
    if (hasExpiredTokenError && !isRetryingWithNewSession) {
      console.log('🔄 Token expirado detectado no proxy, tentando renovar a sessão (APENAS UMA VEZ)');
      isRetryingWithNewSession = true;
      
      try {
        // Fazer nova requisição sem o token de sessão para gerar um novo
        const newSessionResult = await makeGraphQLRequest(false);
        response = newSessionResult.response;
        parsedBody = newSessionResult.parsedBody;
      } catch (retryError) {
        console.error('Falha ao renovar sessão:', retryError);
        // Se a renovação falhar, usar a resposta original
      }
    }
    
    // Transferir cookies da resposta do WordPress para o cliente
    const setCookieHeader = response.headers.get('set-cookie');
    if (setCookieHeader) {
      res.setHeader('Set-Cookie', setCookieHeader);
    }
    
    // Transferir o cabeçalho woocommerce-session, se existir
    const wooSession = response.headers.get('woocommerce-session');
    if (wooSession) {
      res.setHeader('woocommerce-session', wooSession);
      
      // Se estávamos renovando a sessão, adicionar um cabeçalho especial indicando que a sessão foi renovada
      if (isRetryingWithNewSession) {
        res.setHeader('x-woo-session-renewed', 'true');
      }
    }
    
    // Retornar o status e corpo da resposta
    return res.status(response.status).json(parsedBody);
  } catch (error) {
    console.error('Erro no GraphQL Proxy:', error);
    return res.status(500).json({
      errors: [
        {
          message: error.message || 'Erro interno no servidor ao processar requisição GraphQL',
        },
      ],
    });
  }
}