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
    const { customerId, profileData } = req.body;
    
    console.log('[API Update Profile] Atualizando perfil para customer:', customerId);
    console.log('[API Update Profile] Dados do perfil:', profileData);
    
    if (!customerId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Customer ID é obrigatório' 
      });
    }

    if (!profileData) {
      return res.status(400).json({ 
        success: false, 
        error: 'Dados do perfil são obrigatórios' 
      });
    }

    // Preparar dados para atualização
    const updateData = {
      first_name: profileData.firstName || '',
      last_name: profileData.lastName || '',
      display_name: profileData.displayName || `${profileData.firstName || ''} ${profileData.lastName || ''}`.trim(),
      email: profileData.email || '',
      meta_data: []
    };

    // Adicionar telefone e CPF aos metadados
    if (profileData.phone) {
      updateData.meta_data.push({
        key: 'phone',
        value: profileData.phone
      });
      
      // Também atualizar no billing
      updateData.billing = {
        phone: profileData.phone
      };
    }

    if (profileData.cpf) {
      updateData.meta_data.push({
        key: 'cpf',
        value: profileData.cpf
      });
      
      // Também atualizar no billing
      if (!updateData.billing) updateData.billing = {};
      updateData.billing.cpf = profileData.cpf;
    }

    if (profileData.birthDate) {
      updateData.meta_data.push({
        key: 'birth_date',
        value: profileData.birthDate
      });
    }

    console.log('[API Update Profile] Dados formatados para WooCommerce:', updateData);

    // Atualizar customer na API do WooCommerce
    const response = await api.put(`customers/${customerId}`, updateData);

    console.log('[API Update Profile] Resposta do WooCommerce:', response.status);

    return res.status(200).json({
      success: true,
      message: 'Perfil atualizado com sucesso',
      data: response.data
    });

  } catch (error) {
    console.error('[API Update Profile] Erro ao atualizar perfil:', error);
    
    if (error.response) {
      console.error('[API Update Profile] Resposta de erro:', error.response.data);
      return res.status(error.response.status || 500).json({
        success: false,
        error: error.response.data?.message || 'Erro na API do WooCommerce'
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor ao atualizar perfil'
    });
  }
}
