/**
 * CartStateManager - Componente para gerenciar estado do carrinho de forma consistente
 * Usado tanto no carrinho quanto no checkout para garantir integridade dos dados
 */

import React, { useEffect, useRef } from 'react';
import { 
  persistCartState, 
  getPersistedCartState, 
  detectCartInconsistencies,
  emitCartUpdatedEvent
} from '../../utils/cart-utils';

/**
 * Gerenciador de estado do carrinho - monitora e sincroniza dados
 */
const CartStateManager = ({ 
  cartItems = [], 
  cartCount = 0,
  subtotal = 0,
  manualSubtotal = 0,
  notification = null,
  logging = false
}) => {
  // Referência para tracking de mudanças
  const prevCartItemsLength = useRef(0);
  const initializedRef = useRef(false);
  
  // Efeito para persistir estado do carrinho quando mudar
  useEffect(() => {
    // Verificar se os dados do carrinho são válidos
    if (!Array.isArray(cartItems)) {
      if (logging) console.log('[CartStateManager] cartItems não é um array válido');
      return;
    }
    
    // Ignorar a primeira renderização
    if (!initializedRef.current) {
      initializedRef.current = true;
      prevCartItemsLength.current = cartItems.length;
      
      if (logging) console.log('[CartStateManager] Inicialização concluída');
      return;
    }
    
    // Verificar se houve mudança significativa no carrinho
    const hasItemsChanged = cartItems.length !== prevCartItemsLength.current;
    
    if (hasItemsChanged || cartItems.length > 0) {
      if (logging) console.log('[CartStateManager] Persistindo estado do carrinho:', {
        items: cartItems.length,
        count: cartCount,
        subtotal: subtotal || manualSubtotal
      });
      
      // Persistir estado atual
      persistCartState({
        items: cartItems,
        count: cartCount,
        subtotal: subtotal || manualSubtotal
      });
      
      // Atualizar referência
      prevCartItemsLength.current = cartItems.length;
    }
  }, [cartItems, cartCount, subtotal, manualSubtotal, logging]);
  
  // Verificar inconsistências entre o estado atual e o estado persistido
  useEffect(() => {
    // Executar apenas uma vez na montagem
    if (typeof window === 'undefined' || !Array.isArray(cartItems)) return;
    
    setTimeout(() => {
      try {
        // Carregar estado persistido
        const storedState = getPersistedCartState();
        
        if (storedState) {
          // Detectar inconsistências
          const inconsistency = detectCartInconsistencies(cartItems, storedState);
          
          if (inconsistency) {
            if (logging) console.log('[CartStateManager] Inconsistência detectada:', inconsistency);
            
            // Se houver itens faltando e o carrinho atual estiver vazio
            if (
              inconsistency.type === 'count_mismatch' && 
              cartItems.length === 0 && 
              storedState.items.length > 0 &&
              storedState.timestamp && 
              Date.now() - storedState.timestamp < 3600000 // Menos de 1 hora
            ) {
              // Notificar usuário sobre possível problema
              if (notification) {
                notification.warning(
                  'Detectamos que seu carrinho pode ter sido perdido. Deseja restaurar itens?',
                  {
                    action: {
                      label: 'Restaurar',
                      onClick: () => {
                        // Emitir evento para recuperação do carrinho
                        emitCartUpdatedEvent({
                          action: 'restore',
                          storedState: storedState,
                          source: 'inconsistency_detection'
                        });
                        
                        if (notification) {
                          notification.info('Tentando restaurar itens do carrinho...');
                        }
                      }
                    },
                    duration: 10000 // 10 segundos
                  }
                );
              }
            }
          }
        }
      } catch (error) {
        console.error('[CartStateManager] Erro ao verificar inconsistências:', error);
      }
    }, 2000); // Esperar 2 segundos após a montagem para verificar
  }, []);
  
  // Não renderiza nada visualmente
  return null;
};

export default CartStateManager;
