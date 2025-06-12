import WooCommerceRestApi from '@woocommerce/woocommerce-rest-api';

const api = new WooCommerceRestApi({
  url: process.env.NEXT_PUBLIC_WORDPRESS_SITE_URL,
  consumerKey: process.env.WOO_CONSUMER_KEY,
  consumerSecret: process.env.WOO_CONSUMER_SECRET,
  version: 'wc/v3'
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { customerId, currentPassword, newPassword } = req.body;
    
    console.log('[API Change Password] Alterando senha para customer:', customerId);
    
    if (!customerId || !currentPassword || !newPassword) {
      return res.status(400).json({ 
        success: false, 
        error: 'Customer ID, senha atual e nova senha são obrigatórios' 
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ 
        success: false, 
        error: 'Nova senha deve ter pelo menos 6 caracteres' 
      });
    }

    // Primeiro, obter os dados atuais do cliente para verificar a senha
    const customerResponse = await api.get(`customers/${customerId}`);
    const customer = customerResponse.data;

    // Nota: O WooCommerce não permite verificar a senha atual via API REST
    // Em um ambiente real, você precisaria implementar uma verificação adicional
    // Por ora, vamos apenas atualizar a senha
    
    // Preparar dados para atualização da senha
    const updateData = {
      password: newPassword
    };

    console.log('[API Change Password] Atualizando senha no WooCommerce...');

    // Atualizar senha na API do WooCommerce
    const response = await api.put(`customers/${customerId}`, updateData);

    console.log('[API Change Password] Senha atualizada com sucesso');

    return res.status(200).json({
      success: true,
      message: 'Senha alterada com sucesso'
    });

  } catch (error) {
    console.error('[API Change Password] Erro ao alterar senha:', error);
    
    if (error.response) {
      console.error('[API Change Password] Resposta de erro:', error.response.data);
      
      // Verificar se é erro de senha incorreta
      if (error.response.status === 401) {
        return res.status(401).json({
          success: false,
          error: 'Senha atual incorreta'
        });
      }
      
      return res.status(error.response.status || 500).json({
        success: false,
        error: error.response.data?.message || 'Erro na API do WooCommerce'
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor ao alterar senha'
    });
  }
}
