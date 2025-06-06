/**
 * Utilitário para formatação consistente de preços em toda a aplicação
 */

// Constantes de formatação
const formatConfig = {
  locale: 'pt-BR',
  currency: 'BRL',
  maxValue: 999999999
};

/**
 * Formata um valor para o formato de moeda brasileira (R$)
 * 
 * @param {string|number} price - O valor a ser formatado
 * @param {boolean} showSymbol - Se deve mostrar o símbolo da moeda (R$)
 * @returns {string} - O valor formatado em estilo de moeda brasileira
 */
export const formatPrice = (price, showSymbol = true) => {
  // Tratamento inicial para valores inválidos
  if (price === null || price === undefined || price === '' || price === false) {
    return showSymbol ? 'R$ 0,00' : '0,00';
  }
  
  // Tratamento para casos específicos
  if (price === 0 || price === '0') {
    return showSymbol ? 'R$ 0,00' : '0,00';
  }
  
  // Garantir que o preço seja tratado como número
  let numericPrice;
  
  try {
    if (typeof price === 'string') {
      // Remove espaços em branco e entidades HTML comuns
      let cleanPrice = price.trim()
        .replace(/&nbsp;/g, ' ')
        .replace(/\s+/g, '')
        .replace(/[^\d.,\-]/g, '');
      
      // Se não tiver números válidos após a limpeza
      if (!cleanPrice || cleanPrice === '-' || cleanPrice === ',' || cleanPrice === '.') {
        return showSymbol ? 'R$ 0,00' : '0,00';
      }
      
      // Trata números formatados à brasileira (ex: 1.234,56)
      if (cleanPrice.includes('.') && cleanPrice.includes(',')) {
        numericPrice = parseFloat(cleanPrice.replace(/\./g, '').replace(',', '.'));
      }
      // Trata números com vírgula decimal (ex: 1234,56)
      else if (cleanPrice.includes(',')) {
        numericPrice = parseFloat(cleanPrice.replace(',', '.'));
      } else {
        // Assume formato com ponto decimal (ex: 1234.56)
        numericPrice = parseFloat(cleanPrice);
      }
    } else if (typeof price === 'number') {
      numericPrice = price;
    } else {
      // Se for um tipo inesperado, tenta converter para número
      numericPrice = Number(price);
    }
    
    // Verificação adicional após o processamento
    if (isNaN(numericPrice) || !isFinite(numericPrice)) {
      return showSymbol ? 'R$ 0,00' : '0,00';
    }
    
    // Garante que o valor seja positivo e não seja muito grande (prevenção de overflow)
    if (numericPrice < 0) numericPrice = 0;
    if (numericPrice > formatConfig.maxValue) numericPrice = formatConfig.maxValue;
    
    return new Intl.NumberFormat(formatConfig.locale, {
      style: 'currency',
      currency: formatConfig.currency,
      currencyDisplay: showSymbol ? 'symbol' : 'code'
    }).format(numericPrice);
  } catch (error) {
    console.error('[formatPrice] Erro ao formatar preço:', error, { price });
    return showSymbol ? 'R$ 0,00' : '0,00';
  }
};

/**
 * Converte qualquer formato de preço para um número
 * 
 * @param {string|number} price - O valor a ser convertido para número
 * @returns {number} - O valor como número
 */
export const priceToNumber = (price) => {
  // Tratamento para valores inválidos
  if (price === null || price === undefined || price === '' || price === false) return 0;
  
  // Casos específicos
  if (price === 0 || price === '0') return 0;
  
  // Tratamento para números já formatados
  if (typeof price === 'number') {
    if (isNaN(price) || !isFinite(price)) return 0;
    return price;
  }
  
  try {
    // Se a entrada não for string, tenta converter para string
    if (typeof price !== 'string') {
      try {
        price = String(price);
      } catch (e) {
        console.error('[priceToNumber] Erro ao converter para string:', e);
        return 0;
      }
    }
    
    // Remove entidades HTML e espaços
    let cleanPrice = price.trim()
      .replace(/&nbsp;/g, ' ')
      .replace(/\s+/g, '');
      
    // Remove tudo que não seja número, ponto, vírgula ou sinal negativo
    cleanPrice = cleanPrice.replace(/[^\d.,\-]/g, '');
    
    // Se não tiver números válidos após a limpeza ou for apenas um sinal
    if (!cleanPrice || cleanPrice === '-' || cleanPrice === '.' || cleanPrice === ',') return 0;
    
    let numericPrice;
    // Trata números formatados à brasileira (ex: 1.234,56)
    if (cleanPrice.includes('.') && cleanPrice.includes(',')) {
      // Verifica a posição do último ponto e da última vírgula
      const lastDotPosition = cleanPrice.lastIndexOf('.');
      const lastCommaPosition = cleanPrice.lastIndexOf(',');
      
      // Se o ponto vier depois da vírgula, assumimos formato americano
      if (lastDotPosition > lastCommaPosition) {
        numericPrice = parseFloat(cleanPrice.replace(/,/g, ''));
      } else {
        // Formato brasileiro (1.234,56)
        numericPrice = parseFloat(cleanPrice.replace(/\./g, '').replace(',', '.'));
      }
    }
    // Trata números com vírgula decimal (ex: 1234,56)
    else if (cleanPrice.includes(',')) {
      numericPrice = parseFloat(cleanPrice.replace(',', '.'));
    } else {
      // Formato simples com ou sem ponto decimal
      numericPrice = parseFloat(cleanPrice);
    }
    
    // Verifica se é um número válido e não é infinito ou NaN
    if (isNaN(numericPrice) || !isFinite(numericPrice)) return 0;
    
    // Garante que o valor não é absurdamente grande
    if (Math.abs(numericPrice) > formatConfig.maxValue) {
      console.warn('[priceToNumber] Valor muito grande detectado, limitando:', { original: numericPrice, price });
      return numericPrice > 0 ? formatConfig.maxValue : -formatConfig.maxValue;
    }
    
    return numericPrice;
  } catch (error) {
    console.error('[priceToNumber] Erro ao converter preço para número:', error, { price });
    return 0;
  }
};

/**
 * Calcula o valor de desconto entre preço regular e preço de venda
 * 
 * @param {string|number} regularPrice - O preço regular
 * @param {string|number} salePrice - O preço de venda
 * @returns {number} - A porcentagem de desconto (0-100)
 */
export const calculateDiscount = (regularPrice, salePrice) => {
  const regular = priceToNumber(regularPrice);
  const sale = priceToNumber(salePrice);
  
  if (regular <= 0 || sale <= 0 || sale >= regular) return 0;
  
  const discount = ((regular - sale) / regular) * 100;
  return Math.round(discount);
};