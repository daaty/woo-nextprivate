import React, { useState, useEffect } from 'react';
import { useCart } from '../../v2/cart/hooks/useCart'; // Using Cart v2
import { useCartContext } from '../../contexts/CartContext';
import Image from 'next/image';

/**
 * Componente para exibir notificações relacionadas ao carrinho
 * - Produtos adicionados
 * - Erros
 * - Atualizações
 * 
 * @returns {JSX.Element}
 */
const CartNotifications = () => {
  const { lastAddedProduct } = useCart(); // Sempre REST
  // Estado local para as notificações
  const [notifications, setNotifications] = useState([]);
  
  // Obtém dados do contexto do carrinho
  const { 
    error, 
    addingToCart, 
    updatingCart, 
    removingFromCart 
  } = useCartContext();

  // Adiciona notificação quando um produto é adicionado ao carrinho
  useEffect(() => {
    if (lastAddedProduct && lastAddedProduct.timestamp) {
      const newNotification = {
        id: `added-${lastAddedProduct.id}-${lastAddedProduct.timestamp}`,
        type: 'success',
        title: 'Produto adicionado',
        message: `${lastAddedProduct.name} foi adicionado ao carrinho`,
        image: lastAddedProduct.image,
        timestamp: lastAddedProduct.timestamp
      };
      
      setNotifications(prev => [newNotification, ...prev].slice(0, 5));
      
      // Remove a notificação após 5 segundos
      setTimeout(() => {
        setNotifications(prev => 
          prev.filter(notification => notification.id !== newNotification.id)
        );
      }, 5000);
    }
  }, [lastAddedProduct]);

  // Adiciona notificação quando ocorre um erro
  useEffect(() => {
    if (error) {
      const errorMessage = error.message || 'Ocorreu um erro ao processar o carrinho';
      const newNotification = {
        id: `error-${Date.now()}`,
        type: 'error',
        title: 'Erro',
        message: errorMessage,
        timestamp: Date.now()
      };
      
      setNotifications(prev => [newNotification, ...prev].slice(0, 5));
      
      // Remove a notificação após 5 segundos
      setTimeout(() => {
        setNotifications(prev => 
          prev.filter(notification => notification.id !== newNotification.id)
        );
      }, 5000);
    }
  }, [error]);

  // Remove uma notificação específica
  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  // Se não houver notificações, não renderiza nada
  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col space-y-2 max-w-sm">
      {notifications.map((notification) => (
        <div 
          key={notification.id} 
          className={`flex items-center p-4 rounded-lg shadow-lg text-sm text-white transform transition-all duration-300 animate-fade-in
            ${notification.type === 'success' ? 'bg-green-600' : ''}
            ${notification.type === 'error' ? 'bg-red-600' : ''}
            ${notification.type === 'info' ? 'bg-blue-600' : ''}
          `}
        >
          {/* Imagem do produto (se disponível) */}
          {notification.image && (
            <div className="w-12 h-12 bg-white rounded-md overflow-hidden flex-shrink-0 mr-3">
              <Image
                src={notification.image}
                alt={notification.message}
                width={48}
                height={48}
                objectFit="contain"
              />
            </div>
          )}
          
          {/* Conteúdo da notificação */}
          <div className="flex-1">
            {notification.title && (
              <div className="font-semibold mb-1">{notification.title}</div>
            )}
            <div>{notification.message}</div>
          </div>
          
          {/* Botão de fechar */}
          <button 
            className="ml-4 text-white opacity-70 hover:opacity-100 transition-opacity"
            onClick={() => removeNotification(notification.id)}
            aria-label="Fechar notificação"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      ))}
      
      {/* Indicador de operação em andamento */}
      {(addingToCart || updatingCart || removingFromCart) && (
        <div className="flex items-center p-4 rounded-lg shadow-lg bg-yellow-500 text-white text-sm animate-pulse">
          <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>
            {addingToCart && 'Adicionando ao carrinho...'}
            {updatingCart && 'Atualizando carrinho...'}
            {removingFromCart && 'Removendo item...'}
          </span>
        </div>
      )}
    </div>
  );
};

export default CartNotifications;