import { useState, useCallback } from 'react';
import { useMutation, gql } from '@apollo/client';
import { formatPrice, priceToNumber } from '../utils/format-price';

// Mutation para cálculo de frete
const CALCULATE_SHIPPING = gql`
  mutation CalculateShipping($input: CalculateShippingInput!) {
    calculateShipping(input: $input) {
      shippingMethods {
        id
        title
        description
        cost
        methodId
        minDeliveryDays
        maxDeliveryDays
      }
    }
  }
`;

/**
 * Hook para gerenciar o cálculo de frete
 * 
 * @returns {Object} - Estado e funções relacionados ao cálculo de frete
 */
export const useShipping = () => {
  const [state, setState] = useState({
    loading: false,
    error: null,
    shippingMethods: [],
    selectedMethod: null,
    zipCode: '',
    isValidZipCode: false
  });

  // Mutation para calcular frete
  const [calculateShippingMutation] = useMutation(CALCULATE_SHIPPING);

  /**
   * Valida o formato do CEP brasileiro
   * 
   * @param {string} zipCode - CEP para validar
   * @returns {boolean} - Se o CEP é válido
   */
  const validateZipCode = useCallback((zipCode) => {
    // Remove caracteres não numéricos
    const numericZipCode = zipCode.replace(/\D/g, '');
    // Verifica se tem 8 dígitos
    return numericZipCode.length === 8;
  }, []);

  /**
   * Formata o CEP no padrão brasileiro (00000-000)
   * 
   * @param {string} zipCode - CEP para formatar
   * @returns {string} - CEP formatado
   */
  const formatZipCode = useCallback((zipCode) => {
    // Remove caracteres não numéricos
    const numericZipCode = zipCode.replace(/\D/g, '');
    
    // Formata o CEP se tiver pelo menos 8 dígitos
    if (numericZipCode.length >= 8) {
      return `${numericZipCode.slice(0, 5)}-${numericZipCode.slice(5, 8)}`;
    }
    
    return zipCode;
  }, []);

  /**
   * Atualiza o CEP e valida
   * 
   * @param {string} zipCode - Novo CEP
   */
  const setZipCode = useCallback((zipCode) => {
    const isValid = validateZipCode(zipCode);
    setState(prev => ({
      ...prev,
      zipCode,
      isValidZipCode: isValid
    }));
  }, [validateZipCode]);

  /**
   * Calcula opções de frete com base no CEP
   * 
   * @returns {Promise<Object>} - Resultado da operação
   */
  const calculateShipping = useCallback(async () => {
    try {
      if (!state.isValidZipCode) {
        throw new Error('CEP inválido. Por favor, insira um CEP válido.');
      }

      setState(prev => ({ ...prev, loading: true, error: null }));

      // Aqui passamos apenas os números do CEP
      const numericZipCode = state.zipCode.replace(/\D/g, '');

      const result = await calculateShippingMutation({
        variables: {
          input: {
            postcode: numericZipCode,
            country: 'BR'
          }
        }
      });

      const shippingMethods = result.data?.calculateShipping?.shippingMethods || [];

      // Adiciona informações de prazo formatadas para cada método
      const enhancedMethods = shippingMethods.map(method => ({
        ...method,
        formattedCost: formatPrice(method.cost),
        deliveryTimeText: getDeliveryTimeText(method.minDeliveryDays, method.maxDeliveryDays)
      }));

      setState(prev => ({ 
        ...prev, 
        loading: false, 
        shippingMethods: enhancedMethods,
        selectedMethod: enhancedMethods.length > 0 ? enhancedMethods[0] : null
      }));

      return { success: true, data: enhancedMethods };
    } catch (err) {
      console.error('Erro ao calcular frete:', err);
      setState(prev => ({ 
        ...prev, 
        loading: false,
        error: err.message || 'Erro ao calcular o frete.'
      }));
      return { success: false, error: err };
    }
  }, [calculateShippingMutation, state.zipCode, state.isValidZipCode]);

  /**
   * Gera texto de prazo de entrega com base nos dias mínimos e máximos
   * 
   * @param {number} min - Dias mínimos de entrega
   * @param {number} max - Dias máximos de entrega
   * @returns {string} - Texto formatado
   */
  const getDeliveryTimeText = (min, max) => {
    if (!min && !max) return '';
    
    if (min === max) {
      return `${min} ${min === 1 ? 'dia útil' : 'dias úteis'}`;
    }
    
    if (min && max) {
      return `${min} a ${max} dias úteis`;
    }
    
    if (min) {
      return `a partir de ${min} ${min === 1 ? 'dia útil' : 'dias úteis'}`;
    }
    
    return `até ${max} dias úteis`;
  };

  /**
   * Seleciona um método de frete
   * 
   * @param {string} methodId - ID do método selecionado
   */
  const selectShippingMethod = useCallback((methodId) => {
    const method = state.shippingMethods.find(m => m.id === methodId);
    
    if (method) {
      setState(prev => ({ ...prev, selectedMethod: method }));
      return { success: true, data: method };
    } else {
      return { 
        success: false, 
        error: 'Método de frete não encontrado'
      };
    }
  }, [state.shippingMethods]);

  /**
   * Limpa os dados de cálculo de frete
   */
  const clearShippingData = useCallback(() => {
    setState(prev => ({
      ...prev,
      shippingMethods: [],
      selectedMethod: null
    }));
  }, []);

  return {
    ...state,
    setZipCode,
    formatZipCode,
    calculateShipping,
    selectShippingMethod,
    clearShippingData
  };
};