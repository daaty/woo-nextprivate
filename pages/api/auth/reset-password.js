import { gql } from '@apollo/client';
import { getApolloClient } from '../../../src/apollo/client';

/**
 * API Handler para solicitar reset de senha
 * 
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      message: 'Método não permitido' 
    });
  }

  try {
    const { email } = req.body;

    // Validação básica
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email é obrigatório'
      });
    }

    // Validação de formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Formato de email inválido'
      });
    }

    console.log("[API Reset Password] Solicitação de reset para:", email);

    // Mutation GraphQL para solicitar reset de senha
    const RESET_PASSWORD_MUTATION = gql`
      mutation ResetUserPassword($input: ResetUserPasswordInput!) {
        resetUserPassword(input: $input) {
          success
          message
        }
      }
    `;

    const client = getApolloClient();

    const { data } = await client.mutate({
      mutation: RESET_PASSWORD_MUTATION,
      variables: {
        input: {
          username: email
        }
      }
    });

    if (data?.resetUserPassword?.success) {
      console.log("[API Reset Password] Reset solicitado com sucesso para:", email);
      
      return res.status(200).json({
        success: true,
        message: 'Um link para redefinir sua senha foi enviado para seu email'
      });
    } else {
      console.log("[API Reset Password] Falha no reset:", data?.resetUserPassword?.message);
      
      return res.status(400).json({
        success: false,
        message: data?.resetUserPassword?.message || 'Erro ao solicitar reset de senha'
      });
    }

  } catch (error) {
    console.error('[API Reset Password] Erro interno:', error);

    // Verificar se é um erro específico do GraphQL
    if (error.graphQLErrors && error.graphQLErrors.length > 0) {
      const graphQLError = error.graphQLErrors[0];
      console.error('[API Reset Password] Erro GraphQL:', graphQLError.message);
      
      return res.status(400).json({
        success: false,
        message: graphQLError.message
      });
    }

    // Verificar se é um erro de rede
    if (error.networkError) {
      console.error('[API Reset Password] Erro de rede:', error.networkError);
      
      return res.status(500).json({
        success: false,
        message: 'Erro de conexão. Tente novamente em alguns instantes.'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
}
