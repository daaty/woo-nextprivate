/**
 * Test API route to verify Melhor Envio API token
 * Call this endpoint at /api/test/melhor-envio-status
 */
import { checkMelhorEnvioStatus } from '../../../src/services/melhorEnvioApi';

export default async function handler(req, res) {
  const isSandbox = process.env.MELHORENVIO_SANDBOX === 'true';
  const token = process.env.MELHORENVIO_TOKEN;
  
  try {
    // Verify environment configuration
    const config = {
      cepOrigem: process.env.CEP_ORIGEM || 'Não configurado',
      melhorEnvioMode: isSandbox ? 'Sandbox' : 'Produção',
      tokenConfigured: token ? 'Sim' : 'Não'
    };
    
    // Test API connection
    const isApiAvailable = await checkMelhorEnvioStatus(isSandbox, token);
    
    if (isApiAvailable) {
      return res.status(200).json({ 
        status: 'success', 
        message: 'API do Melhor Envio conectada com sucesso!',
        config
      });
    } else {
      return res.status(200).json({ 
        status: 'error', 
        message: 'Falha na conexão com a API do Melhor Envio. Verifique seu token e configurações.',
        config
      });
    }
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: `Erro ao testar API do Melhor Envio: ${error.message}`,
      isSandbox,
      tokenProvided: !!token
    });
  }
}
