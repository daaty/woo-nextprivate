// filepath: f:\Site Felipe\next-react-site\woo-next\src\utils\sessionCleanup.js
/**
 * Utilitário para garantir que sessões persistentes inválidas sejam removidas
 * Isso ajuda a evitar problemas onde o usuário aparece como logado mesmo após logout
 */

/**
 * Verifica se há parâmetros na URL que indicam um logout forçado
 * e limpa cookies do lado cliente se necessário
 */
export function checkForceLogout() {
  if (typeof window === 'undefined') return;
  
  const urlParams = new URLSearchParams(window.location.search);
  const hasForceLogout = urlParams.has('forceLogout') || urlParams.has('noCache');
  
  if (hasForceLogout) {
    console.log("[SessionCleanup] Forçando limpeza de cookies e armazenamento local");
    
    // Limpar localStorage e sessionStorage
    localStorage.clear();
    sessionStorage.clear();
    
    // Limpar cookies comuns de autenticação
    const commonAuthCookies = [
      "auth_token", 
      "refresh_token", 
      "woocommerce-session",
      "woocommerce_session",
      "woo-session",
      "wordpress_logged_in"
    ];
    
    commonAuthCookies.forEach(cookieName => {
      document.cookie = `${cookieName}=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT`;
      document.cookie = `${cookieName}=; path=/api; expires=Thu, 01 Jan 1970 00:00:01 GMT`;
    });
    
    // Remover parâmetros de URL para evitar limpezas repetidas
    const cleanUrl = window.location.pathname;
    window.history.replaceState({}, document.title, cleanUrl);
  }
}

/**
 * Exibe uma mensagem de diagnóstico no console para ajudar a depurar problemas de autenticação
 */
export function logAuthState() {
  if (typeof window === 'undefined') return;
  
  const authItems = {
    localStorage: {},
    cookies: document.cookie,
  };
  
  // Capturar itens de autenticação do localStorage
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (key.includes('auth') || key.includes('session') || key.includes('token') || key.includes('user'))) {
      try {
        authItems.localStorage[key] = localStorage.getItem(key);
      } catch (e) {
        authItems.localStorage[key] = '[erro ao ler]';
      }
    }
  }
  
  console.log("[SessionCleanup] Estado atual de autenticação:", authItems);
}

// Executar verificação automaticamente
if (typeof window !== 'undefined') {
  // Executar após carregamento da página
  window.addEventListener('load', () => {
    checkForceLogout();
    logAuthState();
  });
}