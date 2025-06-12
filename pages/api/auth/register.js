import { gql, InMemoryCache } from "@apollo/client";
import { ApolloClient } from "@apollo/client";
import client from "../../../src/components/ApolloClient";

// Importação mais robusta da biblioteca cookie usando require direto
const cookie = require("cookie");

/**
 * Endpoint para registrar novos usuários no WooCommerce usando GraphQL
 * Usando a mesma abordagem WPGraphQL JWT que funciona para login
 */
export default async function handler(req, res) {
  // Apenas aceitar requisições POST
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Método não permitido" });
  }

  try {
    const { 
      email, 
      username, 
      firstName, 
      lastName, 
      password,
      shipping, 
      billing 
    } = req.body;

    // Validação básica
    if (!email || !username || !password) {
      return res.status(400).json({
        success: false,
        message: "Email, nome de usuário e senha são obrigatórios",
      });
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Formato de email inválido",
      });
    }

    // Validar força da senha
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "A senha deve ter pelo menos 6 caracteres",
      });
    }

    // URL base do WordPress
    const wpBaseUrl = process.env.NEXT_PUBLIC_WORDPRESS_URL || 'https://rota.rotadoscelulares.com';

    // Criar cliente Apollo específico para operações de registro/autenticação
    const authClient = new ApolloClient({
      uri: `${wpBaseUrl}/graphql`,
      cache: new InMemoryCache(),
      defaultOptions: {
        watchQuery: {
          fetchPolicy: 'no-cache',
          errorPolicy: 'all',
        },
        query: {
          fetchPolicy: 'no-cache',
          errorPolicy: 'all',
        },
        mutate: {
          fetchPolicy: 'no-cache',
          errorPolicy: 'all',
        },
      }
    });

    // Consulta GraphQL para registro (apenas campos básicos do usuário)
    const REGISTER_MUTATION = gql`
      mutation RegisterUser($input: RegisterUserInput!) {
        registerUser(input: $input) {
          user {
            id
            databaseId
            firstName
            lastName
            email
            username
            name
          }
        }
      }
    `;

    // Preparar os dados de entrada para a mutation de registro
    const registrationInput = {
      email,
      username,
      firstName,
      lastName,
      password,
    };

    console.log("[Register] Tentando registrar usuário:", username);

    // Executar a mutação de registro
    const { data, errors } = await authClient.mutate({
      mutation: REGISTER_MUTATION,
      variables: {
        input: registrationInput
      },
    });

    // Verificar se há erros no registro
    if (errors || !data?.registerUser?.user) {
      console.error("[Register] Erro ao registrar usuário:", errors);
      
      // Verificar se é um erro de usuário já existente
      const errorMessage = errors?.[0]?.message || "Erro ao criar conta";
      if (errorMessage.includes("email address is already registered") || 
          errorMessage.includes("username already exists")) {
        return res.status(409).json({
          success: false,
          message: "Email ou nome de usuário já estão em uso",
        });
      }
      
      return res.status(400).json({
        success: false,
        message: errorMessage,
      });
    }

    // Dados do usuário registrado
    const { user } = data.registerUser;
    console.log("[Register] Usuário registrado com sucesso:", user.username);

    // Após registrar o usuário, fazemos login para obter tokens de autenticação
    // Usando a mesma mutation confirmada como funcional no teste
    const LOGIN_MUTATION = gql`
      mutation LoginUser($input: LoginInput!) {
        login(input: $input) {
          authToken
          refreshToken
          user {
            id
            databaseId
            email
            username
            firstName
            lastName
            name
          }
        }
      }
    `;

    console.log("[Register] Tentando login automático após registro");

    // Fazer login para obter tokens de autenticação
    const loginResponse = await authClient.mutate({
      mutation: LOGIN_MUTATION,
      variables: {
        input: {
          username,
          password
        }
      }
    });

    // Verificar se o login foi bem-sucedido
    if (!loginResponse.data?.login?.authToken) {
      console.log("[Register] Registro bem-sucedido, mas falha no login automático");
      return res.status(201).json({
        success: true,
        user: user,
        message: "Conta criada, mas falha ao autenticar automaticamente. Por favor, faça login manualmente."
      });
    }

    // Extrair dados de autenticação
    const authToken = loginResponse.data.login.authToken;
    const refreshToken = loginResponse.data.login.refreshToken || "";
    const authUser = loginResponse.data.login.user;

    console.log("[Register] Login automático bem-sucedido após registro");

    // Configuração de duração dos cookies
    const authTokenMaxAge = 60 * 60 * 24 * 7; // 1 semana
    const refreshTokenMaxAge = 60 * 60 * 24 * 30; // 30 dias    // Definir cookies para autenticação
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV !== "development",
      sameSite: "lax",
      path: "/",
    };
      res.setHeader(
      "Set-Cookie",
      [
        // HttpOnly version for server-side security
        cookie.serialize("auth_token", authToken, {
          ...cookieOptions,
          maxAge: authTokenMaxAge,
        }),        // Non-HttpOnly version for client-side Apollo Client access
        cookie.serialize("auth_token_client", authToken, {
          // Don't use ...cookieOptions, which includes httpOnly: true
          secure: process.env.NODE_ENV !== "development",
          sameSite: "lax",
          path: "/",
          httpOnly: false, // Allow JavaScript access - MUST be false
          maxAge: authTokenMaxAge,
        }),
        cookie.serialize("refresh_token", refreshToken, {
          ...cookieOptions,
          maxAge: refreshTokenMaxAge,
        }),
      ]
    );

    // Se temos informações de endereço, tentar atualizá-las
    // Usando o token de autenticação que acabamos de obter
    if (shipping || billing) {
      try {
        console.log("[Register] Tentando atualizar endereços");
        
        // Criar cliente com autenticação
        const authorizedClient = new ApolloClient({
          uri: `${wpBaseUrl}/graphql`,
          cache: new InMemoryCache(),
          headers: {
            Authorization: `Bearer ${authToken}`
          }
        });

        // Mutation para atualizar endereços do cliente
        const UPDATE_CUSTOMER_MUTATION = gql`
          mutation UpdateCustomer($input: UpdateCustomerInput!) {
            updateCustomer(input: $input) {
              customer {
                id
                billing {
                  firstName
                  lastName
                  address1
                  address2
                  city
                  state
                  postcode
                  country
                  email
                  phone
                }
                shipping {
                  firstName
                  lastName
                  address1
                  address2
                  city
                  state
                  postcode
                  country
                }
              }
            }
          }
        `;

        const customerUpdateInput = {
          clientMutationId: 'update_' + Date.now(),
        };

        // Adicionar informações de endereço de entrega se fornecidas
        if (shipping) {
          customerUpdateInput.shipping = {
            firstName: shipping.firstName || firstName,
            lastName: shipping.lastName || lastName,
            address1: shipping.address1,
            address2: shipping.address2 || "",
            city: shipping.city,
            state: shipping.state,
            postcode: shipping.postcode,
            country: shipping.country || "BR",
          };
        }

        // Adicionar informações de endereço de cobrança se fornecidas
        if (billing) {
          customerUpdateInput.billing = {
            firstName: billing.firstName || firstName,
            lastName: billing.lastName || lastName,
            address1: billing.address1,
            address2: billing.address2 || "",
            city: billing.city,
            state: billing.state,
            postcode: billing.postcode,
            country: billing.country || "BR",
            email: billing.email || email,
            phone: billing.phone || "",
          };
        }

        // Tentativa de atualizar informações de endereço
        const updateResponse = await authorizedClient.mutate({
          mutation: UPDATE_CUSTOMER_MUTATION,
          variables: {
            input: customerUpdateInput
          }
        });

        if (updateResponse.data?.updateCustomer?.customer) {
          console.log("[Register] Endereços atualizados com sucesso");
        }
      } catch (addressError) {
        console.error("[Register] Erro ao atualizar endereços:", addressError.message);
        // Continuamos, mesmo com erro de atualização de endereço
      }
    }

    // Retornar informações do usuário 
    return res.status(200).json({
      success: true,
      user: authUser || user,
      message: "Conta criada com sucesso!"
    });

  } catch (error) {
    console.error("[Register] Erro no processo de registro:", error);
    return res.status(500).json({
      success: false,
      message: "Erro interno no servidor",
      detail: error.message
    });
  }
}