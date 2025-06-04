// API de refresh de token extremamente simplificada
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Método não permitido' });
  }

  try {
    console.log('[Refresh API] Iniciando processo de refresh de token...');
    
    // Extrair cookies de forma simples sem dependências externas
    const cookieHeader = req.headers.cookie || '';
    const cookies = {};
    
    if (cookieHeader) {
      cookieHeader.split(';').forEach(cookie => {
        const [name, value] = cookie.trim().split('=');
        if (name && value) {
          cookies[name] = value;
        }
      });
    }
    
    const authToken = cookies.auth_token;
    const authTokenClient = cookies.auth_token_client;
    
    console.log('[Refresh API] Tokens encontrados:', {
      authToken: authToken ? 'Presente' : 'Ausente',
      authTokenClient: authTokenClient ? 'Presente' : 'Ausente'
    });

    // Se temos um token, apenas retornar como válido (simplificado)
    if (authToken || authTokenClient) {
      const token = authToken || authTokenClient;
      
      console.log('[Refresh API] ✅ Token encontrado, retornando como válido');
      
      // Definir cookies novamente com tempo estendido
      const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas
      
      res.setHeader('Set-Cookie', [
        `auth_token=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Expires=${expires.toUTCString()}`,
        `auth_token_client=${token}; Path=/; Secure; SameSite=Lax; Expires=${expires.toUTCString()}`
      ]);
      
      return res.status(200).json({
        success: true,
        message: 'Token renovado com sucesso',
        user: { id: 'temp', username: 'temp' }, // Dados temporários
        token: token
      });
    }

    console.log('[Refresh API] ❌ Nenhum token encontrado');
    return res.status(401).json({
      success: false,
      message: 'Nenhum token de autenticação encontrado'
    });

  } catch (error) {
    console.error('[Refresh API] Erro interno:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
}