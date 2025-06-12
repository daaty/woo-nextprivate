import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/router';
import { useApolloClient } from '@apollo/client';

// Criar o contexto
const AuthContext = createContext();

// Provider que encapsula a aplicação
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();
  const client = useApolloClient(); // Apollo client para gerenciar o cache  // Verificar status de autenticação ao carregar a página
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        setLoading(true);
        
        // CORREÇÃO: Verificação mais robusta de cookies de autenticação
        const hasAuthCookies = typeof document !== 'undefined' && 
          (document.cookie.includes('auth_token') || 
           document.cookie.includes('wordpress_logged_in') ||
           document.cookie.includes('refresh_token'));
        
        const hasRememberFlag = typeof localStorage !== 'undefined' && 
          localStorage.getItem('auth_remember') === 'true';

        // CORREÇÃO: Sempre tentar verificar se há qualquer indicador de autenticação
        // Mesmo sem cookies explícitos, pode haver session no servidor
        console.log("[AuthContext] Verificando status de autenticação...");
        console.log("[AuthContext] Domínio frontend atual:", window.location.hostname);
        console.log("[AuthContext] Cookies detectados:", hasAuthCookies);
        console.log("[AuthContext] Flag remember:", hasRememberFlag);
        
        const response = await axios.get('/api/auth/verify', {
          withCredentials: true
        });
        
        if (response.data.success) {
          console.log("[AuthContext] Usuário autenticado:", response.data.user?.username);
          setUser(response.data.user);
          setIsLoggedIn(true);
        } else {
          console.log("[AuthContext] Usuário não autenticado");
          setUser(null);
          setIsLoggedIn(false);
        }
      } catch (error) {
        // Verificar se é um erro 401 (não autenticado) - comportamento esperado para usuários não logados
        if (error.response && error.response.status === 401) {
          // Usuário não está logado, não é um erro real - silenciar para não interferir com carrinho guest
          console.log("[AuthContext] Sessão guest confirmada (401 esperado)");
          setUser(null);
          setIsLoggedIn(false);
        } else {
          // Outros erros reais, logar no console
          console.error('[AuthContext] Erro ao verificar autenticação:', error);
          setUser(null);
          setIsLoggedIn(false);
        }
      } finally {
        setLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  // Função para realizar login com persistência melhorada
  const login = async (username, password, remember = false) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log("[AuthContext] Tentando fazer login:", username);
      const response = await axios.post('/api/auth/login', {
        username,
        password,
        remember
      }, {
        withCredentials: true
      });
      
      if (response.data.success) {
        console.log("[AuthContext] Login bem-sucedido");
        setUser(response.data.user);
        setIsLoggedIn(true);
        
        // Armazenar no localStorage uma flag para uso em caso de problemas com cookies
        if (remember) {
          localStorage.setItem('auth_remember', 'true');
          localStorage.setItem('auth_username', username);
        } else {
          localStorage.removeItem('auth_remember');
          localStorage.removeItem('auth_username');
        }
        
        return { success: true };
      } else {
        console.log("[AuthContext] Falha no login:", response.data.message);
        setError(response.data.message || 'Falha no login');
        return { success: false, message: response.data.message };
      }
    } catch (error) {
      console.error('[AuthContext] Erro ao fazer login:', error);
      const message = error.response?.data?.message || 'Erro ao fazer login';
      setError(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  };

  // Função para registrar novo usuário
  const register = async (userData) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.post('/api/auth/register', userData, {
        withCredentials: true
      });
      
      if (response.data.success) {
        setUser(response.data.user);
        setIsLoggedIn(true);
        return { success: true };
      } else {
        setError(response.data.message || 'Falha no registro');
        return { success: false, message: response.data.message };
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Erro ao registrar usuário';
      setError(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  };

  // Função para realizar logout de forma agressiva
  const logout = async () => {
    try {
      setLoading(true);
      console.log("[AuthContext] Iniciando processo de logout radical...");
      
      // 1. Primeiro limpar estado local
      setUser(null);
      setIsLoggedIn(false);
      
      // 2. Limpeza radical de localStorage e sessionStorage
      console.log("[AuthContext] Limpando TODOS os dados de armazenamento local");
      localStorage.clear();  // Remove TUDO do localStorage
      sessionStorage.clear();  // Remove TUDO do sessionStorage
      
      // 3. Limpar cache do Apollo Client
      if (client) {
        try {
          console.log("[AuthContext] Resetando Apollo Client");
          await client.clearStore().catch(e => {
            console.error("[AuthContext] Erro ao limpar cache do Apollo:", e);
          });
          
          // Tentar métodos adicionais para limpar o cache
          if (client.resetStore) await client.resetStore();
          if (client.cache && client.cache.reset) client.cache.reset();
        } catch (apolloError) {
          console.error("[AuthContext] Erro ao limpar Apollo:", apolloError);
        }
      }
      
      // 4. Chamar endpoint de logout
      console.log("[AuthContext] Chamando API de logout");
      try {
        const response = await axios.post('/api/auth/logout', {}, { withCredentials: true });
        console.log("[AuthContext] Resposta de logout:", response.data);
      } catch (apiError) {
        console.error("[AuthContext] Erro na API de logout:", apiError);
        // Continuar mesmo com erro na API
      }
      
      // 5. Definir um cookie de logout diretamente no cliente (redundância)
      if (typeof document !== 'undefined') {
        console.log("[AuthContext] Limpando cookies do lado cliente");
        const cookiesToClear = [
          "auth_token", 
          "refresh_token", 
          "woocommerce-session", 
          "woocommerce_session",
          "woo-session", 
          "wordpress_logged_in"
        ];
        
        cookiesToClear.forEach(cookieName => {
          document.cookie = `${cookieName}=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT`;
        });
      }
      
      // 6. Forçar uma recarga completa da página para garantir estado limpo
      if (typeof window !== 'undefined') {
        console.log("[AuthContext] Redirecionando para garantir logout completo");
        // Adicionar parâmetro noCache para evitar caching
        window.location.href = `/?noCache=${Date.now()}`;
        return { success: true }; // Retornar antes do redirecionamento
      }
      
      return { success: true };
    } catch (error) {
      console.error('[AuthContext] Erro ao fazer logout:', error);
      
      // Mesmo com erro, garantir limpeza e redirecionamento
      setUser(null);
      setIsLoggedIn(false);
      
      if (typeof window !== 'undefined') {
        localStorage.clear();
        sessionStorage.clear();
        window.location.href = `/?forceLogout=true&t=${Date.now()}`;
      }
      
      return { success: false, message: `Erro ao fazer logout: ${error.message}` };
    } finally {
      setLoading(false);
    }
  };

  // Função para renovar token
  const refreshToken = async () => {
    try {
      const response = await axios.post('/api/auth/refresh', {}, { 
        withCredentials: true 
      });
      
      if (response.data.success) {
        setUser(response.data.user);
        setIsLoggedIn(true);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Erro ao renovar token:', error);
      return false;
    }
  };
  // Função para tentar recuperar sessão
  const recoverSession = async () => {
    const remember = localStorage.getItem('auth_remember');
    const username = localStorage.getItem('auth_username');
    
    if (remember === 'true' && username) {
      try {
        const response = await axios.post('/api/auth/recover', { 
          username 
        }, { 
          withCredentials: true 
        });
        
        if (response.data.success) {
          setUser(response.data.user);
          setIsLoggedIn(true);
          return true;
        }
      } catch (error) {
        console.error('Erro ao recuperar sessão:', error);
      }
    }
    return false;
  };

  // Função para recarregar dados do usuário
  const reloadUser = async () => {
    try {
      setLoading(true);
      console.log("[AuthContext] Recarregando dados do usuário...");
      const response = await axios.get('/api/auth/verify', {
        withCredentials: true
      });
      
      if (response.data.success) {
        console.log("[AuthContext] Dados do usuário recarregados:", response.data.user?.username);
        setUser(response.data.user);
        setIsLoggedIn(true);
        return true;
      } else {
        console.log("[AuthContext] Usuário não autenticado durante recarregamento");
        setUser(null);
        setIsLoggedIn(false);
        return false;
      }
    } catch (error) {
      console.error('[AuthContext] Erro ao recarregar dados do usuário:', error);
      if (error.response && error.response.status !== 401) {
        setUser(null);
        setIsLoggedIn(false);
      }
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Função para limpar erros
  const clearError = () => setError(null);
  // Função para atualizar dados do usuário
  const updateUser = async (userData) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log("[AuthContext] Atualizando dados do usuário:", userData);
      
      // Verificar se o usuário está logado antes de tentar atualizar
      if (!isLoggedIn || !user?.id) {
        console.error("[AuthContext] Erro: Usuário não autenticado ao tentar atualizar dados");
        setError('Usuário não autenticado. Por favor, faça login novamente.');
        return { 
          success: false, 
          message: 'Usuário não autenticado. Por favor, faça login novamente.' 
        };
      }

      // Garantir que os cookies estão sendo enviados
      // Obter o token JWT do cliente (cookie auth_token_client não httpOnly)
      const clientToken = document.cookie
        .split('; ')
        .find(row => row.startsWith('auth_token_client='))
        ?.split('=')[1];
      
      console.log("[AuthContext] Token de cliente disponível:", clientToken ? 'Sim' : 'Não');
      
      // Incluir o ID do usuário diretamente nos dados para garantir que ele seja acessível no back-end
      if (user && user.databaseId) {
        userData.databaseId = user.databaseId;
      }

      // CORREÇÃO: A API Next.js está rodando no mesmo domínio do frontend
      const baseUrl = window.location.origin;
      
      console.log("[AuthContext] Frontend atual:", baseUrl);
      console.log("[AuthContext] Hostname:", window.location.hostname);
      
      // Criar a URL da API do Next.js (local)
      const url = `${baseUrl}/api/auth/update-user`;
      console.log("[AuthContext] URL da API Next.js:", url);
      
      const response = await axios.post(url, userData, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          // Adicionar token como cabeçalho para garantir autenticação
          'Authorization': clientToken ? `Bearer ${clientToken}` : '',
          'X-JWT-Auth': clientToken || ''
        }
      });
      
      if (response.data.success) {
        console.log("[AuthContext] Dados do usuário atualizados com sucesso:", response.data.user);
        setUser(response.data.user);
        return { success: true };
      } else {
        console.log("[AuthContext] Falha na atualização:", response.data.message);
        setError(response.data.message || 'Falha ao atualizar dados');
        return { success: false, message: response.data.message };
      }
    } catch (error) {
      console.error('[AuthContext] Erro ao atualizar dados do usuário:', error);
      console.error('[AuthContext] URL que causou erro:', error.config?.url);
      console.error('[AuthContext] Dados enviados:', error.config?.data);
      console.error('[AuthContext] Response status:', error.response?.status);
      console.error('[AuthContext] Response data:', error.response?.data);
      
      if (error.response?.status === 401) {
        console.error('[AuthContext] Erro de autenticação (401) - Tentando renovar token...');
        
        // Tentar renovar o token automaticamente
        console.log('[AuthContext] Tentando renovar token automaticamente...');
        const refreshResult = await refreshToken();
        
        if (refreshResult) {
          console.log('[AuthContext] Token renovado com sucesso, tentando novamente...');
          // Tentar a requisição novamente com o token renovado
          try {
            const newClientToken = document.cookie
              .split('; ')
              .find(row => row.startsWith('auth_token_client='))
              ?.split('=')[1];
            
            const retryUrl = `${window.location.origin}/api/auth/update-user`;
            
            const retryResponse = await axios.post(retryUrl, userData, {
              withCredentials: true,
              headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache',
                'Authorization': newClientToken ? `Bearer ${newClientToken}` : '',
                'X-JWT-Auth': newClientToken || ''
              }
            });
            
            if (retryResponse.data.success) {
              console.log("[AuthContext] Dados atualizados com sucesso após renovação do token");
              setUser(retryResponse.data.user);
              return { success: true };
            }
          } catch (retryError) {
            console.error('[AuthContext] Erro na segunda tentativa após renovação:', retryError);
          }
        }
        
        // Se chegou até aqui, o refresh falhou ou a segunda tentativa falhou
        return { 
          success: false, 
          message: 'Sessão expirada. Por favor, faça login novamente.' 
        };
      }
      
      // Para erros 500 ou outros erros do servidor
      if (error.response?.status === 500) {
        console.error('[AuthContext] Erro interno do servidor (500)');
        const serverError = error.response?.data?.message || 'Erro interno do servidor. Tente novamente.';
        setError(serverError);
        return { 
          success: false, 
          message: serverError
        };
      }
      
      const message = error.response?.data?.message || error.message || 'Erro ao atualizar dados';
      setError(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  };
  // Função para solicitar reset de senha
  const resetPassword = async (email) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log("[AuthContext] Solicitando reset de senha para:", email);
      
      const response = await axios.post('/api/auth/reset-password', {
        email
      }, {
        withCredentials: true
      });
      
      if (response.data.success) {
        console.log("[AuthContext] Reset de senha solicitado com sucesso");
        return { success: true, message: response.data.message };
      } else {
        console.log("[AuthContext] Falha no reset de senha:", response.data.message);
        setError(response.data.message || 'Falha ao solicitar reset de senha');
        return { success: false, message: response.data.message };
      }
    } catch (error) {
      console.error('[AuthContext] Erro ao solicitar reset de senha:', error);
      const message = error.response?.data?.message || 'Erro ao solicitar reset de senha';
      setError(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  };

  // Valor do contexto
  const contextValue = {
    user,
    isLoggedIn,
    loading,
    error,
    login,
    logout,
    register,
    refreshToken,
    recoverSession,
    reloadUser,
    updateUser,
    resetPassword,
    clearError
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook personalizado para usar o contexto
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}