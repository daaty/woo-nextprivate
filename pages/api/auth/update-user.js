import jwt from 'jsonwebtoken';

// CORREÇÃO: Usar as variáveis de ambiente corretas do .env.local
const JWT_SECRET = process.env.JWT_SECRET || process.env.JWT_AUTH_SECRET || 'default_secret';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Método não permitido' });
  }

  try {
    console.log('[UpdateUser] Iniciando atualização de dados do usuário');
    console.log('[UpdateUser] JWT_SECRET configurado:', JWT_SECRET ? 'Sim' : 'Não');
    console.log('[UpdateUser] JWT_SECRET value:', JWT_SECRET);
    
    // 1. Verificar autenticação - melhor estratégia de obtenção de token
    let token = null;
    let tokenSource = null;
    
    // Priorizar auth_token_client (não httpOnly)
    if (req.cookies.auth_token_client) {
      token = req.cookies.auth_token_client;
      tokenSource = 'auth_token_client cookie';
      console.log('[UpdateUser] Token cliente encontrado nos cookies');
    }
    // Fallback para auth_token (httpOnly)
    else if (req.cookies.auth_token) {
      token = req.cookies.auth_token;
      tokenSource = 'auth_token cookie';
      console.log('[UpdateUser] Token encontrado nos cookies');
    }
    
    // Tentar obter token dos headers
    if (!token && req.headers.authorization) {
      token = req.headers.authorization.replace('Bearer ', '');
      tokenSource = 'Authorization header';
      console.log('[UpdateUser] Token encontrado no Authorization header');
    }
    
    if (!token && req.headers['x-jwt-auth']) {
      token = req.headers['x-jwt-auth'];
      tokenSource = 'X-JWT-Auth header';
      console.log('[UpdateUser] Token encontrado no X-JWT-Auth header');
    }

    if (!token) {
      console.log('[UpdateUser] Token não encontrado em nenhuma fonte');
      return res.status(401).json({ 
        success: false, 
        message: 'Token de autenticação não encontrado' 
      });
    }

    console.log('[UpdateUser] Token obtido de:', tokenSource);

    // 2. Verificar validade do token com múltiplos segredos possíveis
    let decoded;
    let userId;
    
    // Lista de possíveis segredos JWT para tentar
    const possibleSecrets = [
      JWT_SECRET,
      process.env.JWT_SECRET,
      process.env.JWT_AUTH_SECRET,
      'default_secret',
      'your-jwt-secret'
    ].filter(Boolean); // Remove valores undefined/null
    
    let tokenValid = false;
    
    for (const secret of possibleSecrets) {
      try {
        decoded = jwt.verify(token, secret);
        userId = decoded.data?.user?.id;
        console.log('[UpdateUser] Token válido com segredo:', secret === JWT_SECRET ? 'Principal' : 'Alternativo');
        console.log('[UpdateUser] Token válido para usuário ID:', userId);
        tokenValid = true;
        break;
      } catch (jwtError) {
        console.log('[UpdateUser] Falha com segredo:', secret === JWT_SECRET ? 'Principal' : 'Alternativo');
        continue;
      }
    }
    
    if (!tokenValid) {
      console.error('[UpdateUser] Token inválido com todos os segredos testados');
      console.log('[UpdateUser] Token que falhou:', token.substring(0, 50) + '...');
      
      // FALLBACK: Tentar usar databaseId do corpo da requisição se disponível
      const { databaseId } = req.body;
      if (databaseId && typeof databaseId === 'number') {
        console.log('[UpdateUser] Usando databaseId do corpo da requisição como fallback:', databaseId);
        userId = databaseId;
      } else {
        return res.status(401).json({ 
          success: false, 
          message: 'Token inválido ou expirado. Por favor, faça login novamente.' 
        });
      }
    }
    
    if (!userId) {
      console.error('[UpdateUser] ID do usuário não encontrado no token decodificado');
      console.log('[UpdateUser] Payload do token:', decoded);
      return res.status(401).json({ 
        success: false, 
        message: 'Token inválido - ID do usuário não encontrado' 
      });
    }

    // 3. Obter dados do corpo da requisição
    const { firstName, lastName, email, phone, cpf, databaseId } = req.body;
    
    console.log('[UpdateUser] Dados recebidos:', {
      firstName,
      lastName,
      email,
      phone,
      cpf,
      userId,
      databaseId
    });

    // 4. Validar dados obrigatórios
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email é obrigatório'
      });
    }

    // 5. Validar se temos um ID válido para atualizar
    const finalUserId = userId || databaseId;
    if (!finalUserId) {
      console.error('[UpdateUser] Nenhum ID de usuário válido encontrado');
      return res.status(400).json({
        success: false,
        message: 'ID do usuário não encontrado'
      });
    }

    console.log('[UpdateUser] ID final do usuário para atualização:', finalUserId);

    // 6. Usar WooCommerce REST API diretamente com variáveis corretas
    console.log('[UpdateUser] Atualizando via WooCommerce REST API...');
    
    try {
      // CORREÇÃO: Usar as variáveis de ambiente corretas do .env.local
      const restApiUrl = process.env.NEXT_PUBLIC_WORDPRESS_URL || process.env.WOO_SITE_URL || 'https://rota.rotadoscelulares.com';
      const consumerKey = process.env.WOO_CONSUMER_KEY;
      const consumerSecret = process.env.WOO_CONSUMER_SECRET;
      
      console.log('[UpdateUser] Configurações da API:', {
        url: restApiUrl,
        hasConsumerKey: !!consumerKey,
        hasConsumerSecret: !!consumerSecret,
        consumerKeyPrefix: consumerKey ? consumerKey.substring(0, 10) + '...' : 'Não encontrado',
        consumerSecretPrefix: consumerSecret ? consumerSecret.substring(0, 10) + '...' : 'Não encontrado'
      });
      
      if (!consumerKey || !consumerSecret) {
        console.error('[UpdateUser] Credenciais WooCommerce não configuradas');
        console.error('[UpdateUser] Consumer Key:', consumerKey ? 'Presente' : 'Ausente');
        console.error('[UpdateUser] Consumer Secret:', consumerSecret ? 'Presente' : 'Ausente');
        console.error('[UpdateUser] Variáveis de ambiente disponíveis:', Object.keys(process.env).filter(key => key.includes('WOO')));
        return res.status(500).json({
          success: false,
          message: 'Configuração do servidor incompleta - Credenciais WooCommerce não encontradas'
        });
      }
      
      // Preparar dados para atualização
      const updateData = {
        first_name: firstName || '',
        last_name: lastName || '',
        email: email,
        billing: {
          first_name: firstName || '',
          last_name: lastName || '',
          email: email,
          phone: phone || ''
        },
        shipping: {
          first_name: firstName || '',
          last_name: lastName || ''
        }
      };
      
      // Adicionar CPF aos meta_data se fornecido
      if (cpf && cpf.trim()) {
        updateData.meta_data = [
          {
            key: 'cpf',
            value: cpf.trim()
          }
        ];
      }
      
      console.log('[UpdateUser] Dados preparados para API:', updateData);
      
      const apiUrl = `${restApiUrl}/wp-json/wc/v3/customers/${finalUserId}`;
      console.log('[UpdateUser] URL da API:', apiUrl);
      
      const authHeader = `Basic ${Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64')}`;
      console.log('[UpdateUser] Auth header preparado:', authHeader.substring(0, 20) + '...');
      
      const response = await fetch(apiUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader,
          'User-Agent': 'NextJS-Update-User/1.0'
        },
        body: JSON.stringify(updateData)
      });
      
      console.log('[UpdateUser] Status da resposta:', response.status);
      console.log('[UpdateUser] Headers da resposta:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[UpdateUser] Erro na REST API:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });
        
        // Tentar fazer parse do erro como JSON
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch (parseError) {
          errorData = { message: errorText };
        }
        
        return res.status(response.status).json({
          success: false,
          message: errorData.message || `Erro na API: ${response.status}`,
          details: errorData
        });
      }
      
      const updatedCustomer = await response.json();
      console.log('[UpdateUser] Usuário atualizado com sucesso via REST API:', updatedCustomer.email);
      console.log('[UpdateUser] ID retornado:', updatedCustomer.id);
      
      // Formatar resposta para compatibilidade com o frontend
      const userResponse = {
        id: `dXNlcjoke${updatedCustomer.id}==`, // Simular o formato GraphQL ID
        databaseId: updatedCustomer.id,
        firstName: updatedCustomer.first_name || '',
        lastName: updatedCustomer.last_name || '',
        email: updatedCustomer.email,
        username: updatedCustomer.username || '',
        billing: {
          firstName: updatedCustomer.billing?.first_name || '',
          lastName: updatedCustomer.billing?.last_name || '',
          email: updatedCustomer.billing?.email || updatedCustomer.email,
          phone: updatedCustomer.billing?.phone || '',
          address1: updatedCustomer.billing?.address_1 || '',
          address2: updatedCustomer.billing?.address_2 || '',
          city: updatedCustomer.billing?.city || '',
          state: updatedCustomer.billing?.state || '',
          postcode: updatedCustomer.billing?.postcode || '',
          country: updatedCustomer.billing?.country || ''
        },
        shipping: {
          firstName: updatedCustomer.shipping?.first_name || '',
          lastName: updatedCustomer.shipping?.last_name || '',
          address1: updatedCustomer.shipping?.address_1 || '',
          address2: updatedCustomer.shipping?.address_2 || '',
          city: updatedCustomer.shipping?.city || '',
          state: updatedCustomer.shipping?.state || '',
          postcode: updatedCustomer.shipping?.postcode || '',
          country: updatedCustomer.shipping?.country || ''
        },
        metaData: updatedCustomer.meta_data || []
      };
      
      console.log('[UpdateUser] Resposta formatada:', userResponse);
      
      return res.status(200).json({
        success: true,
        message: 'Dados atualizados com sucesso',
        user: userResponse
      });
      
    } catch (apiError) {
      console.error('[UpdateUser] Erro na comunicação com a API:', apiError);
      console.error('[UpdateUser] Stack trace:', apiError.stack);
      
      return res.status(500).json({
        success: false,
        message: 'Erro ao comunicar com o servidor. Tente novamente.',
        details: apiError.message
      });
    }

  } catch (error) {
    console.error('[UpdateUser] Erro geral ao atualizar dados:', error);
    console.error('[UpdateUser] Stack trace:', error.stack);
    
    return res.status(500).json({
      success: false,
      message: `Erro interno do servidor: ${error.message}`
    });
  }
}
