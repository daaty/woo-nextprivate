import { useState, useCallback } from 'react';
import { useMutation, gql } from '@apollo/client';

// Mutation para aplicar cupom
const APPLY_COUPON = gql`
  mutation ApplyCoupon($input: ApplyCouponInput!) {
    applyCoupon(input: $input) {
      cart {
        appliedCoupons {
          code
          discountAmount
          discountTax
        }
        subtotal
        subtotalTax
        total
        totalTax
        discountTotal
        discountTax
      }
    }
  }
`;

// Mutation para remover cupom
const REMOVE_COUPON = gql`
  mutation RemoveCoupon($input: RemoveCouponsInput!) {
    removeCoupons(input: $input) {
      cart {
        appliedCoupons {
          code
          discountAmount
          discountTax
        }
        subtotal
        subtotalTax
        total
        totalTax
        discountTotal
        discountTax
      }
    }
  }
`;

/**
 * Hook para gerenciar cupons de desconto no carrinho
 * 
 * @returns {Object} - Estado e funções relacionados a cupons
 */
export const useCoupons = () => {
  const [state, setState] = useState({
    loading: false,
    error: null,
    appliedCoupons: [],
    couponCode: '',
    couponMessage: null,
    couponMessageType: null // 'success', 'error', 'warning'
  });

  // Mutations para cupons
  const [applyCouponMutation] = useMutation(APPLY_COUPON);
  const [removeCouponMutation] = useMutation(REMOVE_COUPON);

  /**
   * Atualiza o código do cupom no estado
   * 
   * @param {string} code - Código do cupom
   */
  const setCouponCode = useCallback((code) => {
    setState(prev => ({
      ...prev,
      couponCode: code,
      couponMessage: null,
      couponMessageType: null
    }));
  }, []);

  /**
   * Aplica um cupom de desconto ao carrinho
   * 
   * @returns {Promise<Object>} - Resultado da operação
   */
  const applyCoupon = useCallback(async () => {
    try {
      if (!state.couponCode.trim()) {
        setState(prev => ({
          ...prev,
          couponMessage: 'Por favor, informe um código de cupom',
          couponMessageType: 'warning'
        }));
        return { success: false, error: 'Código de cupom vazio' };
      }

      setState(prev => ({ 
        ...prev, 
        loading: true, 
        error: null,
        couponMessage: null,
        couponMessageType: null
      }));

      const result = await applyCouponMutation({
        variables: {
          input: {
            code: state.couponCode.trim()
          }
        }
      });

      const appliedCoupons = result.data?.applyCoupon?.cart?.appliedCoupons || [];
      
      if (appliedCoupons.length > 0) {
        setState(prev => ({ 
          ...prev, 
          loading: false,
          appliedCoupons,
          couponMessage: 'Cupom aplicado com sucesso!',
          couponMessageType: 'success',
          couponCode: '' // Limpa o campo após aplicar com sucesso
        }));
        return { success: true, data: appliedCoupons };
      } else {
        throw new Error('Não foi possível aplicar o cupom');
      }
    } catch (err) {
      // Trata mensagens de erro para exibição amigável
      let errorMessage = 'Erro ao aplicar o cupom';
      
      if (err.message.includes('Coupon does not exist') || err.message.includes('não existe')) {
        errorMessage = 'Este cupom não existe';
      } else if (err.message.includes('expired') || err.message.includes('expirado')) {
        errorMessage = 'Este cupom está expirado';
      } else if (err.message.includes('already applied') || err.message.includes('already been applied') || err.message.includes('já aplicado')) {
        errorMessage = 'Este cupom já foi aplicado';
      } else if (err.message.includes('minimum spend') || err.message.includes('mínimo')) {
        errorMessage = 'O valor mínimo para este cupom não foi atingido';
      } else if (err.message.includes('maximum spend') || err.message.includes('máximo')) {
        errorMessage = 'O valor máximo para este cupom foi excedido';
      } else if (err.message.includes('not applicable') || err.message.includes('não aplicável')) {
        errorMessage = 'Este cupom não é aplicável para os produtos no carrinho';
      }
      
      console.error('Erro ao aplicar cupom:', err.message);
      
      setState(prev => ({ 
        ...prev, 
        loading: false,
        error: err,
        couponMessage: errorMessage,
        couponMessageType: 'error'
      }));
      
      return { success: false, error: errorMessage };
    }
  }, [applyCouponMutation, state.couponCode]);

  /**
   * Remove um cupom aplicado no carrinho
   * 
   * @param {string} code - Código do cupom a ser removido
   * @returns {Promise<Object>} - Resultado da operação
   */
  const removeCoupon = useCallback(async (code) => {
    try {
      if (!code) {
        throw new Error('Código de cupom não fornecido');
      }

      setState(prev => ({ 
        ...prev, 
        loading: true, 
        error: null,
        couponMessage: null,
        couponMessageType: null
      }));

      const result = await removeCouponMutation({
        variables: {
          input: {
            codes: [code]
          }
        }
      });

      const remainingCoupons = result.data?.removeCoupons?.cart?.appliedCoupons || [];
      
      setState(prev => ({ 
        ...prev, 
        loading: false,
        appliedCoupons: remainingCoupons,
        couponMessage: 'Cupom removido com sucesso',
        couponMessageType: 'success'
      }));
      
      return { success: true, data: remainingCoupons };
    } catch (err) {
      console.error('Erro ao remover cupom:', err);
      
      setState(prev => ({ 
        ...prev, 
        loading: false,
        error: err,
        couponMessage: 'Erro ao remover o cupom',
        couponMessageType: 'error'
      }));
      
      return { success: false, error: err };
    }
  }, [removeCouponMutation]);

  /**
   * Limpa qualquer mensagem relacionada a cupons
   */
  const clearCouponMessage = useCallback(() => {
    setState(prev => ({
      ...prev,
      couponMessage: null,
      couponMessageType: null
    }));
  }, []);

  return {
    ...state,
    setCouponCode,
    applyCoupon,
    removeCoupon,
    clearCouponMessage
  };
};