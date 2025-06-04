import { UPDATE_CUSTOMER } from '../../../src/mutations/update-customer';
import { UPDATE_CUSTOMER_BILLING } from '../../../src/mutations/update-customer-billing';
import { gql } from "@apollo/client";
import { ApolloClient, InMemoryCache } from "@apollo/client";

const cookie = require("cookie");

/**
 * API endpoint para atualizar dados do usuário
 * Integra com GraphQL WooCommerce para atualizar customer data
 * Usa verificação de token WPGraphQL (compatível com o sistema de login)
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      message: 'Método não permitido' 
    });
  }

  try {
    // Extrair o token de autenticação dos cookies (método compatível com login/verify)
    const cookies = req.headers.cookie ? cookie.parse(req.headers.cookie) : {};
    let authToken = cookies.auth_token || cookies.auth_token_client;

    // Fallback: tentar no cabeçalho Authorization
    if (!authToken && req.headers.authorization) {
      const authHeader = req.headers.authorization;
      if (authHeader.startsWith('Bearer ')) {
        authToken = authHeader.substring(7);
        console.log('[UpdateUser] Token extraído do cabeçalho Authorization');
      }
    }
    
    if (!authToken) {
      console.error('[UpdateUser] Erro: Token de autenticação não encontrado');
      return res.status(401).json({ 
        success: false, 
        message: 'Token de autenticação não encontrado' 
      });
    }

    console.log("[UpdateUser] Token encontrado, verificando validade...");

    let userId;
    let userEmail;

    // Verificar se é um token de desenvolvimento
    if (authToken.startsWith('dev_fake_token_') && process.env.NODE_ENV === 'development') {
      console.log("[UpdateUser] Token de desenvolvimento detectado");
      // Para tokens de desenvolvimento, usar dados simulados
      userId = 'dev-user-' + Date.now();
      userEmail = 'dev@example.com';
    } else {
      // Verificar validade do token usando WPGraphQL (método correto para tokens do WordPress)
      const wpBaseUrl = process.env.NEXT_PUBLIC_WORDPRESS_URL || 'https://rota.rotadoscelulares.com';
      
      const authClient = new ApolloClient({
        uri: `${wpBaseUrl}/graphql`,
        cache: new InMemoryCache(),
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        defaultOptions: {
          watchQuery: { fetchPolicy: 'no-cache' },
          query: { fetchPolicy: 'no-cache' },
        }
      });

      // Verificar se o token é válido consultando o usuário atual
      const VERIFY_TOKEN = gql`
        query GetCurrentUser {
          viewer {
            id
            databaseId
            email
            username
          }
        }
      `;

      try {
        const { data: verifyData } = await authClient.query({
          query: VERIFY_TOKEN,
        });

        if (!verifyData?.viewer?.id) {
          console.log("[UpdateUser] Token inválido - não foi possível obter dados do usuário");
          return res.status(401).json({
            success: false,
            message: "Token inválido ou expirado",
          });
        }

        userId = verifyData.viewer.databaseId || verifyData.viewer.id;
        userEmail = verifyData.viewer.email;
        console.log("[UpdateUser] Token válido para usuário:", verifyData.viewer.username, "ID:", userId);
      } catch (tokenError) {
        console.log("[UpdateUser] Erro na verificação do token:", tokenError.message);
        return res.status(401).json({
          success: false,
          message: "Token inválido ou expirado",
          detail: tokenError.message
        });
      }
    }

    const { firstName, lastName, email, phone, cpf } = req.body;
    
    console.log('[UpdateUser] Dados recebidos:', { firstName, lastName, email, phone, cpf });
    console.log('[UpdateUser] User ID:', userId, 'Email:', userEmail);

    // Preparar input para atualização básica do customer
    const updateCustomerInput = {
      id: userId,
      firstName: firstName || '',
      lastName: lastName || '',
      email: email || userEmail || ''
    };

    // Preparar input para atualização de billing (CPF e telefone)
    const updateBillingInput = {
      id: userId,
      billing: {
        firstName: firstName || '',
        lastName: lastName || '',
        email: email || '',
        phone: phone || '',
      },
      // Adicionar metaData para CPF se fornecido
      ...(cpf && {
        metaData: [
          {
            key: 'cpf',
            value: cpf
          }
        ]
      })
    };

    // Criar client Apollo com autenticação
    const { createApolloClient } = require('../../../src/apollo/client');
    const authenticatedClient = createApolloClient(null, {
      authorization: `Bearer ${authToken}`
    });

    console.log('[UpdateUser] Update customer input:', updateCustomerInput);
    console.log('[UpdateUser] Update billing input:', updateBillingInput);

    // Executar mutations com cliente autenticado
    const customerUpdatePromise = authenticatedClient.mutate({
      mutation: UPDATE_CUSTOMER,
      variables: {
        input: updateCustomerInput
      }
    });

    const billingUpdatePromise = authenticatedClient.mutate({
      mutation: UPDATE_CUSTOMER_BILLING,
      variables: {
        input: updateBillingInput
      }
    });

    // Executar ambas as mutations
    const [customerResult, billingResult] = await Promise.all([
      customerUpdatePromise,
      billingUpdatePromise
    ]);

    console.log('[UpdateUser] Customer update result:', customerResult.data);
    console.log('[UpdateUser] Billing update result:', billingResult.data);

    // Construir dados do usuário atualizado
    const updatedCustomer = billingResult.data.updateCustomer.customer;
    
    const updatedUser = {
      id: updatedCustomer.id,
      databaseId: updatedCustomer.databaseId || userId,
      firstName: updatedCustomer.firstName,
      lastName: updatedCustomer.lastName,
      email: updatedCustomer.email,
      billing: {
        ...updatedCustomer.billing,
        cpf: cpf || '' // Adicionar CPF que foi salvo nos metaData
      },
      shipping: updatedCustomer.shipping
    };

    console.log('[UpdateUser] Dados do usuário atualizados:', updatedUser);

    res.status(200).json({
      success: true,
      message: 'Dados atualizados com sucesso',
      user: updatedUser
    });

  } catch (error) {
    console.error('[UpdateUser] Erro ao atualizar dados:', error);
    
    let errorMessage = 'Erro interno do servidor';
    let statusCode = 500;
    
    if (error.graphQLErrors && error.graphQLErrors.length > 0) {
      errorMessage = error.graphQLErrors[0].message;
    } else if (error.networkError) {
      errorMessage = 'Erro de conexão com o servidor';
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    // Ajustar código de status para resposta mais precisa
    if (error.message && (
      error.message.includes('invalid signature') || 
      error.message.includes('jwt') ||
      error.message.includes('token')
    )) {
      statusCode = 401;
      errorMessage = 'Erro de autenticação: ' + errorMessage;
    }

    res.status(statusCode).json({
      success: false,
      message: errorMessage,
      detail: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
