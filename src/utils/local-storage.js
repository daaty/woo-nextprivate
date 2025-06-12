/**
 * Utilitário para lidar com localStorage de forma segura
 * - Lida com SSR (verificando se window está disponível)
 * - Trata exceções de permissão/armazenamento cheio
 * - Fornece métodos consistentes para operações comuns
 */

/**
 * Verifica se o localStorage está disponível
 * 
 * @returns {boolean} - Se localStorage está disponível
 */
const isLocalStorageAvailable = () => {
  if (typeof window === 'undefined') return false;
  
  try {
    const testKey = '__test_local_storage__';
    window.localStorage.setItem(testKey, testKey);
    window.localStorage.removeItem(testKey);
    return true;
  } catch (e) {
    console.warn('localStorage não está disponível:', e);
    return false;
  }
};

/**
 * API segura para acessar o localStorage
 */
export const safeLocalStorage = {
  /**
   * Obtém um valor do localStorage
   * 
   * @param {string} key - A chave para buscar
   * @param {any} defaultValue - Valor padrão se a chave não existir
   * @returns {any} - O valor armazenado ou o valor padrão
   */
  get: (key, defaultValue = null) => {
    if (!isLocalStorageAvailable()) return defaultValue;
    
    try {
      const item = window.localStorage.getItem(key);
      if (item === null) return defaultValue;
      
      try {
        // Tenta parsear como JSON
        return JSON.parse(item);
      } catch (e) {
        // Se não conseguir, retorna o valor como string
        return item;
      }
    } catch (error) {
      console.error(`Erro ao ler chave "${key}" do localStorage:`, error);
      return defaultValue;
    }
  },
  
  /**
   * Armazena um valor no localStorage
   * 
   * @param {string} key - A chave para armazenar
   * @param {any} value - O valor a ser armazenado
   * @returns {boolean} - Se a operação foi bem-sucedida
   */
  set: (key, value) => {
    if (!isLocalStorageAvailable()) return false;
    
    try {
      // Converte para string se não for string
      const valueToStore = typeof value === 'string' 
        ? value 
        : JSON.stringify(value);
        
      window.localStorage.setItem(key, valueToStore);
      return true;
    } catch (error) {
      console.error(`Erro ao salvar chave "${key}" no localStorage:`, error);
      
      // Trata casos específicos de erro
      if (error.name === 'QuotaExceededError' || 
          error.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
        console.warn('Limite de armazenamento do localStorage atingido.');
      }
      
      return false;
    }
  },
  
  /**
   * Remove um valor do localStorage
   * 
   * @param {string} key - A chave a ser removida
   * @returns {boolean} - Se a operação foi bem-sucedida
   */
  remove: (key) => {
    if (!isLocalStorageAvailable()) return false;
    
    try {
      window.localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Erro ao remover chave "${key}" do localStorage:`, error);
      return false;
    }
  },
  
  /**
   * Limpa todo o localStorage
   * 
   * @returns {boolean} - Se a operação foi bem-sucedida
   */
  clear: () => {
    if (!isLocalStorageAvailable()) return false;
    
    try {
      window.localStorage.clear();
      return true;
    } catch (error) {
      console.error('Erro ao limpar localStorage:', error);
      return false;
    }
  },
  
  /**
   * Verifica se uma chave existe no localStorage
   * 
   * @param {string} key - A chave a ser verificada
   * @returns {boolean} - Se a chave existe
   */
  has: (key) => {
    if (!isLocalStorageAvailable()) return false;
    
    try {
      return window.localStorage.getItem(key) !== null;
    } catch (error) {
      console.error(`Erro ao verificar chave "${key}" no localStorage:`, error);
      return false;
    }
  },
  
  /**
   * Retorna todas as chaves armazenadas no localStorage
   * 
   * @returns {string[]} - Array com todas as chaves
   */
  keys: () => {
    if (!isLocalStorageAvailable()) return [];
    
    try {
      return Object.keys(window.localStorage);
    } catch (error) {
      console.error('Erro ao obter chaves do localStorage:', error);
      return [];
    }
  }
};