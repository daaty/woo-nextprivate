/**
 * Formata um valor para o formato de moeda brasileira (R$)
 * 
 * @param {number|string} value - O valor a ser formatado
 * @param {Object} options - Opções de formatação
 * @returns {string} Valor formatado como moeda
 */
export const formatCurrency = (value, options = {}) => {
  if (value === null || value === undefined) return '';
  
  // Converter para número se for string
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  // Verificar se é um número válido
  if (isNaN(numValue)) {
    console.error('Valor inválido para formatação de moeda:', value);
    return '';
  }
  
  const defaultOptions = {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...options
  };
  
  try {
    return new Intl.NumberFormat('pt-BR', defaultOptions).format(numValue);
  } catch (error) {
    console.error('Erro ao formatar moeda:', error);
    
    // Fallback básico em caso de erro
    return `R$ ${numValue.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;
  }
};

/**
 * Remove a formatação de moeda de uma string e retorna apenas o valor numérico
 * 
 * @param {string} formattedValue - O valor formatado como moeda (ex: "R$ 1.234,56")
 * @returns {number} O valor numérico
 */
export const unformatCurrency = (formattedValue) => {
  if (!formattedValue) return 0;
  
  try {
    // Remove símbolo de moeda, pontos e substitui vírgula por ponto
    const cleanValue = formattedValue
      .replace(/[R$\s.]/g, '')  // Remove R$, espaços e pontos
      .replace(',', '.');       // Substitui vírgula por ponto decimal
    
    return parseFloat(cleanValue);
  } catch (error) {
    console.error('Erro ao desformatar moeda:', error);
    return 0;
  }
};

/**
 * Formata um valor para exibição como porcentagem
 * 
 * @param {number|string} value - O valor a ser formatado (ex: 0.1 para 10%)
 * @returns {string} Valor formatado como porcentagem
 */
export const formatPercentage = (value) => {
  if (value === null || value === undefined) return '';
  
  // Converter para número se for string
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  // Verificar se é um número válido
  if (isNaN(numValue)) {
    console.error('Valor inválido para formatação de porcentagem:', value);
    return '';
  }
  
  try {
    return new Intl.NumberFormat('pt-BR', {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 2
    }).format(numValue);
  } catch (error) {
    console.error('Erro ao formatar porcentagem:', error);
    
    // Fallback básico em caso de erro
    return `${(numValue * 100).toFixed(1).replace('.', ',')}%`;
  }
};