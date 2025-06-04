/**
 * Formata uma data no formato brasileiro (dd/mm/aaaa)
 * 
 * @param {string|Date} date - A data a ser formatada
 * @param {Object} options - Opções adicionais de formatação
 * @returns {string} Data formatada
 */
export const formatDate = (date, options = {}) => {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  // Verifica se a data é válida
  if (isNaN(dateObj.getTime())) {
    console.error('Data inválida:', date);
    return '';
  }
  
  const defaultOptions = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    ...options
  };
  
  try {
    return new Intl.DateTimeFormat('pt-BR', defaultOptions).format(dateObj);
  } catch (error) {
    console.error('Erro ao formatar data:', error);
    
    // Fallback básico em caso de erro
    const day = dateObj.getDate().toString().padStart(2, '0');
    const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
    const year = dateObj.getFullYear();
    
    return `${day}/${month}/${year}`;
  }
};

/**
 * Formata data e hora no formato brasileiro (dd/mm/aaaa hh:mm)
 * 
 * @param {string|Date} datetime - A data e hora a ser formatada
 * @param {Object} options - Opções adicionais de formatação
 * @returns {string} Data e hora formatada
 */
export const formatDateTime = (datetime, options = {}) => {
  if (!datetime) return '';
  
  const dateObj = typeof datetime === 'string' ? new Date(datetime) : datetime;
  
  // Verifica se a data é válida
  if (isNaN(dateObj.getTime())) {
    console.error('Data e hora inválida:', datetime);
    return '';
  }
  
  const defaultOptions = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    ...options
  };
  
  try {
    return new Intl.DateTimeFormat('pt-BR', defaultOptions).format(dateObj);
  } catch (error) {
    console.error('Erro ao formatar data e hora:', error);
    
    // Fallback básico em caso de erro
    const day = dateObj.getDate().toString().padStart(2, '0');
    const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
    const year = dateObj.getFullYear();
    const hour = dateObj.getHours().toString().padStart(2, '0');
    const minute = dateObj.getMinutes().toString().padStart(2, '0');
    
    return `${day}/${month}/${year} ${hour}:${minute}`;
  }
};

/**
 * Função para formatar datas em formato relativo (há X dias, etc)
 * 
 * @param {string} dateString - String de data no formato ISO
 * @returns {string} Data formatada em formato relativo
 */
export const formatRelativeDate = (dateString) => {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    const now = new Date();
    
    // Verificar se a data é válida
    if (isNaN(date.getTime())) {
      return '';
    }
    
    // Diferença em milissegundos
    const diffMs = now - date;
    const diffSec = Math.round(diffMs / 1000);
    const diffMin = Math.round(diffSec / 60);
    const diffHour = Math.round(diffMin / 60);
    const diffDays = Math.round(diffHour / 24);
    const diffWeeks = Math.round(diffDays / 7);
    const diffMonths = Math.round(diffDays / 30);
    const diffYears = Math.round(diffDays / 365);
    
    // Formatar baseado no tempo decorrido
    if (diffSec < 60) {
      return 'agora há pouco';
    } else if (diffMin < 60) {
      return `há ${diffMin} ${diffMin === 1 ? 'minuto' : 'minutos'}`;
    } else if (diffHour < 24) {
      return `há ${diffHour} ${diffHour === 1 ? 'hora' : 'horas'}`;
    } else if (diffDays < 7) {
      return `há ${diffDays} ${diffDays === 1 ? 'dia' : 'dias'}`;
    } else if (diffWeeks < 4) {
      return `há ${diffWeeks} ${diffWeeks === 1 ? 'semana' : 'semanas'}`;
    } else if (diffMonths < 12) {
      return `há ${diffMonths} ${diffMonths === 1 ? 'mês' : 'meses'}`;
    } else {
      return `há ${diffYears} ${diffYears === 1 ? 'ano' : 'anos'}`;
    }
  } catch (error) {
    console.error('Erro ao formatar data relativa:', error);
    return dateString;
  }
};