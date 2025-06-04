import { gql } from "@apollo/client";
import client from "../../../src/components/ApolloClient";
import cookie from "cookie";

/**
 * Endpoint para recuperação de sessão baseada no nome de usuário
 * Útil quando o token expirou mas o usuário ainda está usando a opção "lembrar-me"
 */
export default async function handler(req, res) {
  // Apenas aceitar requisições POST
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Método não permitido" });
  }

  try {
    const { username } = req.body;

    if (!username) {
      return res.status(400).json({ 
        success: false, 
        message: "Nome de usuário é obrigatório" 
      });
    }

    // Tentar buscar informações do usuário pelo username
    const GET_USER_BY_USERNAME = gql`
      query GetUserByUsername($username: String!) {
        user(where: {username: $username}) {
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

    const { data: userData } = await client.query({
      query: GET_USER_BY_USERNAME,
      variables: { username },
      fetchPolicy: 'network-only' // Forçar busca no servidor
    });

    const user = userData?.user;

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Usuário não encontrado"
      });
    }

    // Tentar gerar um novo token para o usuário
    // Como não temos a senha, essa é uma operação limitada
    // e depende da configuração do servidor WordPress
    const GENERATE_TOKEN_FOR_USER = gql`
      mutation GenerateTokenForUser($userId: ID!) {
        generateAuthTokenForUser(input: { userId: $userId }) {
          authToken
          refreshToken
        }
      }
    `;

    try {
      const { data: tokenData } = await client.mutate({
        mutation: GENERATE_TOKEN_FOR_USER,
        variables: { userId: user.databaseId.toString() }
      });      if (tokenData?.generateAuthTokenForUser?.authToken) {
        // Configurar cookies com o novo token
        res.setHeader(
          "Set-Cookie",
          [
            // HttpOnly version for server-side security
            cookie.serialize("auth_token", tokenData.generateAuthTokenForUser.authToken, {
              httpOnly: true,
              secure: process.env.NODE_ENV !== "development",
              maxAge: 60 * 60 * 24 * 30, // 30 dias
              sameSite: "strict",
              path: "/",
            }),            // Non-HttpOnly version for client-side Apollo Client access
            cookie.serialize("auth_token_client", tokenData.generateAuthTokenForUser.authToken, {
              httpOnly: false, // Allow JavaScript access - MUST be false
              secure: process.env.NODE_ENV !== "development",
              maxAge: 60 * 60 * 24 * 30, // 30 dias
              sameSite: "lax", // Changed from strict to lax for better compatibility
              path: "/",
            }),
            cookie.serialize("refresh_token", tokenData.generateAuthTokenForUser.refreshToken || "", {
              httpOnly: true,
              secure: process.env.NODE_ENV !== "development",
              maxAge: 60 * 60 * 24 * 60, // 60 dias
              sameSite: "strict",
              path: "/",
            }),
          ]
        );

        return res.status(200).json({
          success: true,
          user
        });
      }
    } catch (tokenError) {
      console.log("Erro ao gerar token para usuário:", tokenError.message);
      // Continuar com o método alternativo
    }

    // Método alternativo de recuperação
    // Em vez de tentar regenerar o token, enviaremos uma flag para o cliente
    // que indicará que é necessário um novo login completo, mas com dados preenchidos
    return res.status(202).json({
      success: false,
      needsRelogin: true,
      partialUser: {
        username: user.username,
        email: user.email
      },
      message: "Sua sessão expirou. Por favor, faça login novamente."
    });

  } catch (error) {
    console.error("Erro na recuperação de sessão:", error);
    return res.status(500).json({
      success: false,
      message: "Erro interno no servidor"
    });
  }
}