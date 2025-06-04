/**
 * Temporary fix for Apollo Client's token retrieval
 * 
 * This file is a temporary solution to debug the token issue.
 * The actual code will be placed in the proper files later.
 */

// Version to paste in ApolloClient.js
const getJWTToken = () => {
  if (typeof window === 'undefined') return null;
  
  console.log("[ApolloClient] Cookies disponíveis:", document.cookie);
  
  const getCookieValue = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    console.log(`[ApolloClient] Buscando cookie '${name}', resultado da split:`, parts.length > 1 ? 'encontrado' : 'não encontrado');
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
  };
  
  // Tentar first client cookie (não-httpOnly)
  const clientToken = getCookieValue('auth_token_client');
  console.log("[ApolloClient] Client token encontrado:", clientToken ? `${clientToken.substring(0, 20)}...` : 'null');
  
  // Tentar httpOnly cookie como fallback (não funcionará no navegador)
  const httpOnlyToken = getCookieValue('auth_token');
  
  // Usar qualquer token disponível
  const token = clientToken || httpOnlyToken;
  console.log("[ApolloClient] Token JWT final:", token ? `${token.substring(0, 20)}...` : 'null');
  return token;
};
