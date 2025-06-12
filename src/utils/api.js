/**
 * Funções de utilidade para API
 * Este arquivo contém funções para facilitar a comunicação com APIs externas
 */

/**
 * Cria um cliente para a API do WooCommerce
 * Esta é uma implementação simplificada baseada no fetch
 */
export function getWooCommerceApi() {
  // Endpoint base da API - Poderíamos obter de variáveis de ambiente
  const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api';
  
  return {
    /**
     * Recupera dados da API
     * @param {string} endpoint - O endpoint da API a ser acessado
     * @param {object} params - Parâmetros de consulta opcionais
     * @returns {Promise<object>}
     */
    get: async (endpoint, params = {}) => {
      try {
        // Construir query string a partir dos parâmetros
        const queryString = Object.keys(params)
          .map(key => {
            // Se for um array, tratar cada item separadamente
            if (Array.isArray(params[key])) {
              return params[key].map(val => `${encodeURIComponent(key)}=${encodeURIComponent(val)}`).join('&');
            }
            return `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`;
          })
          .join('&');
        
        const url = `${API_URL}/${endpoint}${queryString ? `?${queryString}` : ''}`;
        
        // Fazer a requisição
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`API retornou status ${response.status}`);
        }
        
        const data = await response.json();
        
        return { data };
      } catch (error) {
        console.error(`Erro ao acessar API (${endpoint}):`, error);
        throw error;
      }
    },
    
    /**
     * Envia dados para a API via POST
     * @param {string} endpoint - O endpoint da API a ser acessado
     * @param {object} data - Os dados a serem enviados
     * @returns {Promise<object>}
     */
    post: async (endpoint, data = {}) => {
      try {
        const url = `${API_URL}/${endpoint}`;
        
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });
        
        if (!response.ok) {
          throw new Error(`API retornou status ${response.status}`);
        }
        
        const responseData = await response.json();
        
        return { data: responseData };
      } catch (error) {
        console.error(`Erro ao enviar dados para API (${endpoint}):`, error);
        throw error;
      }
    }
  };
}