/**
 * Formata valores para o padrão de moeda brasileira
 */
export const formatCurrency = (value) => {
  if (!value || isNaN(value)) return "R$ 0,00";
  
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

/**
 * Format number with dots as thousands separator and comma for decimals
 */
export function formatNumber(value, decimals = 0) {
  if (!value && value !== 0) return '';
  
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value);
}
