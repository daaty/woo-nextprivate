import { gql } from "@apollo/client";
import { ApolloClient, InMemoryCache } from "@apollo/client";
import client from "../../../src/components/ApolloClient";

// Importação mais robusta da biblioteca cookie usando require direto
const cookie = require("cookie");

/**
 * Endpoint para verificar a validade do token de autenticação
 * Compatível com diferentes métodos de autenticação (WPGraphQL, WooCommerce, REST API)
 * Com tratamento robusto para problemas com a biblioteca cookie
 */
export default async function handler(req, res) {
  // Apenas aceitar requisições GET e POST
  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({ message: "Método não permitido" });
  }

  try {
    // Função de fallback para parsear cookies manualmente se a biblioteca falhar
    const parseCookiesManually = (cookieString = '') => {
      if (!cookieString) return {};
      
      const cookies = {};
      const cookiePairs = cookieString.split(';');
      
      for (const cookiePair of cookiePairs) {
        const [key, value] = cookiePair.trim().split('=');
        if (key && value) {
          cookies[key] = decodeURIComponent(value);
        }
      }
      
      return cookies;
    };    // Obter tokens dos cookies
    let authToken, refreshToken;
    
    try {
      const cookies = req.headers.cookie ? cookie.parse(req.headers.cookie) : {};
      authToken = cookies.auth_token;
      refreshToken = cookies.refresh_token;
    } catch (cookieError) {
      console.log("[Verify] Erro no parse de cookie, usando método alternativo");
      // Fallback: parsear manualmente
      const cookies = parseCookiesManually(req.headers.cookie);
      authToken = cookies.auth_token;
      refreshToken = cookies.refresh_token;
    }// Se não há token, usuário não está autenticado
    if (!authToken) {
      console.log("[Verify] Nenhum token de autenticação encontrado");
      return res.status(401).json({
        success: false,
        isLoggedIn: false,
        message: "Não autenticado",
      });
    }

    console.log("[Verify] Token encontrado, verificando...");

    // Verificar se é um token de desenvolvimento (para testes)
    if (authToken.startsWith('dev_fake_token_') && process.env.NODE_ENV === 'development') {
      console.log("[Verify] Token de desenvolvimento detectado, validando...");
      
      // Para tokens de desenvolvimento, retornar dados simulados
      return res.status(200).json({
        success: true,
        isLoggedIn: true,
        user: {
          id: 'dev-user-' + Date.now(),
          databaseId: 999,
          email: 'dev@example.com',
          username: 'dev_user',
          firstName: 'Dev',
          lastName: 'User',
          name: 'Dev User',
          billing: {},
          shipping: {},
          rawMetaData: []
        },
      });
    }

    // URL base do WordPress
    const wpBaseUrl = process.env.NEXT_PUBLIC_WORDPRESS_URL || 'https://rota.rotadoscelulares.com';    // Criar cliente Apollo específico para verificação
    const authClient = new ApolloClient({
      uri: `${wpBaseUrl}/graphql`,
      cache: new InMemoryCache(),
      defaultOptions: {
        watchQuery: {
          fetchPolicy: 'no-cache',
        },
        query: {
          fetchPolicy: 'no-cache',
        },
      }
    });// Verificar validade do token atual usando a query me/viewer
    const VERIFY_TOKEN = gql`
      query GetCurrentUser {
        viewer {
          id
          databaseId
          email
          username
          firstName
          lastName
          name
        }
      }
    `;

    // Query para buscar dados completos do customer incluindo meta_data
    const GET_CUSTOMER_DATA = gql`
      query GetCustomerData {
        customer {
          id
          databaseId
          email
          firstName
          lastName
          displayName
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
          metaData {
            key
            value
          }
        }
      }
    `;    try {      // Primeiro, verificar se o token é válido usando viewer query
      const { data: viewerData } = await authClient.query({
        query: VERIFY_TOKEN,
        fetchPolicy: 'no-cache',
        context: {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        },
      });

      console.log("[Verify] Token válido, usuário autenticado:", viewerData.viewer.username);

      // Agora buscar dados completos do customer incluindo meta_data
      let customerData = null;
      try {
        const { data: fullCustomerData } = await authClient.query({
          query: GET_CUSTOMER_DATA,
          fetchPolicy: 'no-cache',
          context: {
            headers: {
              Authorization: `Bearer ${authToken}`,
            },
          },
        });        customerData = fullCustomerData.customer;
        console.log("[Verify] Dados completos do customer carregados, metaData:", customerData?.metaData?.length || 0, "itens");
        console.log("[Verify] Billing data:", customerData?.billing);
        console.log("[Verify] Shipping data:", customerData?.shipping);
      } catch (customerError) {
        console.log("[Verify] Erro ao buscar dados completos do customer:", customerError.message);
        // Se falhar ao buscar customer data, usar apenas os dados do viewer
        customerData = null;
      }// Processar meta_data para extrair CPF e quaisquer outros dados relevantes
      let cpf = '';
      let metaDataFields = {};
      
      if (customerData?.metaData && Array.isArray(customerData.metaData)) {
        console.log("[Verify] Processando meta_data do customer:", customerData.metaData.length, "itens");
        
        // Extrair CPF
        const cpfMeta = customerData.metaData.find(meta => meta.key === 'cpf');
        if (cpfMeta) {
          cpf = cpfMeta.value;
          metaDataFields.cpf = cpfMeta.value;
          console.log("[Verify] CPF encontrado nos meta_data:", cpf);
        }
        
        // Extrair outros campos de meta_data se necessário
        // Exemplo: const phoneMeta = customerData.metaData.find(meta => meta.key === 'phone');
      } else {
        console.log("[Verify] Nenhum meta_data disponível ou formato inválido");
      }      // Garantir que temos um ID de banco de dados válido
      let validDatabaseId = viewerData.viewer.databaseId;
      if (!validDatabaseId || validDatabaseId === 'guest') {
        // Tentar extrair ID numérico do ID do GraphQL
        if (viewerData.viewer.id && viewerData.viewer.id.includes('dXNlcjo')) {
          try {
            const decoded = Buffer.from(viewerData.viewer.id, 'base64').toString('utf-8');
            const parts = decoded.split(':');
            if (parts.length > 1 && !isNaN(parts[1])) {
              validDatabaseId = parts[1];
              console.log("[Verify] Extraído ID numérico do GraphQL ID:", validDatabaseId);
            }
          } catch (err) {
            console.error("[Verify] Erro ao extrair ID numérico:", err);
          }
        }
      }

      // Log dos IDs encontrados
      console.log("[Verify] IDs disponíveis - GraphQL ID:", viewerData.viewer.id, 
        "Database ID:", viewerData.viewer.databaseId, 
        "ID Processado:", validDatabaseId);

      // Se chegou aqui, o token é válido
      const userResponse = {
        success: true,
        isLoggedIn: true,
        user: {
          id: viewerData.viewer.id,
          databaseId: validDatabaseId || viewerData.viewer.databaseId,
          email: viewerData.viewer.email,
          username: viewerData.viewer.username,
          firstName: viewerData.viewer.firstName || "",
          lastName: viewerData.viewer.lastName || "",
          name: viewerData.viewer.name || "",
          // Adicionar dados de billing se disponíveis
          billing: customerData?.billing ? {
            ...customerData.billing,
            cpf: cpf, // Adicionar CPF dos meta_data
            ...metaDataFields // Adicionar quaisquer outros campos de meta_data
          } : {
            cpf: cpf, // Pelo menos incluir o CPF mesmo sem outros dados de billing
            ...metaDataFields // Adicionar quaisquer outros campos de meta_data
          },
          // Adicionar dados de shipping se disponíveis
          shipping: customerData?.shipping || {},
          // Armazenar meta_data completo para uso em outros lugares se necessário
          rawMetaData: customerData?.metaData || []
        },
      };
      
      console.log("[Verify] Dados de resposta completos:", JSON.stringify(userResponse, null, 2));
      return res.status(200).json(userResponse);
    } catch (tokenError) {
      console.log("[Verify] Erro na verificação do token:", tokenError.message);
      
      // Token inválido ou expirado, tentar uma abordagem alternativa
      try {
        // Tentar verificar usando a API REST direta
        console.log("[Verify] Tentando verificação via REST API");
        const restValidateResponse = await fetch(`${wpBaseUrl}/wp-json/jwt-auth/v1/token/validate`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${authToken}`
          },
        });
        
        const validationData = await restValidateResponse.json();
        
        if (validationData.success === true) {
          console.log("[Verify] Token validado via REST API");
          // O token ainda é válido
          return res.status(200).json({
            success: true,
            isLoggedIn: true,
            user: {
              id: validationData.data?.id || "",
              email: validationData.data?.email || "",
              username: validationData.data?.user_nicename || validationData.data?.display_name || "",
              firstName: validationData.data?.first_name || "",
              lastName: validationData.data?.last_name || "",
            },
          });
        }
      } catch (restError) {
        console.log("[Verify] Erro na verificação REST:", restError.message);
      }

      // Tentar renovar token se houver refresh token disponível
      if (refreshToken) {
        try {
          console.log("[Verify] Tentando renovar token");
          // Tentar usar o método padrão de renovação JWT
          const REFRESH_TOKEN_MUTATION = gql`
            mutation RefreshToken($refreshToken: String!) {
              refreshJwtAuthToken(input: { jwtRefreshToken: $refreshToken }) {
                authToken
              }
            }
          `;

          const { data: refreshData } = await authClient.mutate({
            mutation: REFRESH_TOKEN_MUTATION,
            variables: { refreshToken },
          });

          if (refreshData?.refreshJwtAuthToken?.authToken) {
            console.log("[Verify] Token renovado com sucesso");
            // Token renovado com sucesso
            const newAuthToken = refreshData.refreshJwtAuthToken.authToken;
            
            // Função para criar strings de cookie manualmente
            const createCookieString = (name, value, options = {}) => {
              const cookieParts = [`${name}=${encodeURIComponent(value)}`];
              
              if (options.httpOnly) cookieParts.push('HttpOnly');
              if (options.secure) cookieParts.push('Secure');
              if (options.sameSite) cookieParts.push(`SameSite=${options.sameSite}`);
              if (options.path) cookieParts.push(`Path=${options.path}`);
              if (options.maxAge) cookieParts.push(`Max-Age=${options.maxAge}`);
              
              return cookieParts.join('; ');
            };

            // Verificar se a biblioteca cookie está funcionando
            if (typeof cookie !== 'object' || typeof cookie.serialize !== 'function') {
              console.log("[Verify] Usando método manual para definir cookies");
              // Definir cookies manualmente
              const cookieOptions = {
                httpOnly: true,
                secure: process.env.NODE_ENV !== "development",
                sameSite: "lax",
                path: "/",
              };              
              const authCookie = createCookieString("auth_token", newAuthToken, {
                ...cookieOptions,
                maxAge: 60 * 60 * 24 * 7, // 1 semana
              });              // Create a modified version of cookieOptions without httpOnly
              const clientCookieOptions = {
                ...cookieOptions,
                httpOnly: false // MUST be false for client access
              };
              
              // Now create the client auth cookie with the modified options
              const clientAuthCookie = createCookieString("auth_token_client", newAuthToken, {
                ...clientCookieOptions,
                maxAge: 60 * 60 * 24 * 7, // 1 semana
              });
              
              console.log("[Verify] Definindo cookies auth_token e auth_token_client");
              console.log("[Verify] Cookie normal:", authCookie.substring(0, 50) + "...");
              console.log("[Verify] Cookie client:", clientAuthCookie.substring(0, 50) + "...");
              
              res.setHeader("Set-Cookie", [authCookie, clientAuthCookie]);
            } else {              // Usar biblioteca cookie normalmente
              console.log("[Verify] Usando biblioteca cookie para definir cookies");
              
              const authCookieStr = cookie.serialize("auth_token", newAuthToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV !== "development",
                maxAge: 60 * 60 * 24 * 7, // 1 semana
                sameSite: "lax",
                path: "/",
              });
                const clientCookieStr = cookie.serialize("auth_token_client", newAuthToken, {
                httpOnly: false, // Allow JavaScript access - MUST be false
                secure: process.env.NODE_ENV !== "development",
                maxAge: 60 * 60 * 24 * 7, // 1 semana
                sameSite: "lax",
                path: "/",
                domain: undefined // Ensure no domain restriction
              });
              
              console.log("[Verify] Auth cookie:", authCookieStr.substring(0, 50) + "...");
              console.log("[Verify] Client cookie:", clientCookieStr.substring(0, 50) + "...");
              
              res.setHeader(
                "Set-Cookie",
                [authCookieStr, clientCookieStr]
              );
            }

            // Tentar obter dados do usuário com o novo token
            try {
              const { data: userData } = await authClient.query({
                query: VERIFY_TOKEN,
                context: {
                  headers: {
                    Authorization: `Bearer ${newAuthToken}`,
                  },
                },
              });

              console.log("[Verify] Dados do usuário obtidos com novo token");
              
              return res.status(200).json({
                success: true,
                isLoggedIn: true,
                tokenRenewed: true,
                user: {
                  id: userData.viewer.id,
                  databaseId: userData.viewer.databaseId,
                  email: userData.viewer.email, 
                  username: userData.viewer.username,
                  firstName: userData.viewer.firstName || "",
                  lastName: userData.viewer.lastName || "",
                  name: userData.viewer.name || "",
                },
              });
            } catch (newTokenError) {
              console.log("[Verify] Erro após renovação do token:", newTokenError.message);
            }
          }
        } catch (refreshError) {
          console.log("[Verify] Erro ao renovar token:", refreshError.message);
        }
      }

      // Se chegou aqui, todas as verificações e tentativas de renovação falharam
      console.log("[Verify] Todas as tentativas falharam, sessão expirada");
      
      // Função para criar string de cookie de expiração manual
      const createExpiredCookieString = (name) => {
        return `${name}=; HttpOnly; Path=/; Max-Age=-1; SameSite=Lax`;
      };
        // Limpar cookies
      if (typeof cookie !== 'object' || typeof cookie.serialize !== 'function') {
        // Método manual para limpar cookies
        res.setHeader("Set-Cookie", [
          createExpiredCookieString("auth_token"),
          createExpiredCookieString("auth_token_client"),
          createExpiredCookieString("refresh_token")
        ]);
      } else {
        // Usar biblioteca cookie
        res.setHeader(
          "Set-Cookie",
          [            cookie.serialize("auth_token", "", {
              httpOnly: true,
              secure: process.env.NODE_ENV !== "development",
              maxAge: -1, // Expirar imediatamente
              sameSite: "lax",
              path: "/",
            }),
            cookie.serialize("auth_token_client", "", {
              httpOnly: false,
              secure: process.env.NODE_ENV !== "development",
              maxAge: -1, // Expirar imediatamente
              sameSite: "lax",
              path: "/",
            }),
            cookie.serialize("refresh_token", "", {
              httpOnly: true,
              secure: process.env.NODE_ENV !== "development",
              maxAge: -1, // Expirar imediatamente
              sameSite: "lax",
              path: "/",
            }),
          ]
        );
      }
      
      return res.status(401).json({
        success: false,
        isLoggedIn: false,
        message: "Sessão expirada, faça login novamente",
      });
    }
  } catch (error) {
    console.error("[Verify] Erro ao verificar autenticação:", error);
    return res.status(500).json({
      success: false,
      isLoggedIn: false,
      message: "Erro interno no servidor",
      detail: error.message
    });
  }
}