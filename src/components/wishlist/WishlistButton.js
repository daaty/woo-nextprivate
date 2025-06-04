import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';

// Função para verificar se um produto está nos favoritos
const isProductInWishlist = async (productId) => {
  try {
    const response = await fetch('/api/wishlist/check', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ productId }),
    });
    
    if (!response.ok) {
      throw new Error('Erro ao verificar favoritos');
    }
    
    const { inWishlist } = await response.json();
    return inWishlist;
  } catch (error) {
    console.error('Erro ao verificar se o produto está nos favoritos:', error);
    return false;
  }
};

const WishlistButton = ({ productId, productName }) => {
  const { isLoggedIn, openAuthModal } = useAuth();
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Verificar se o produto está na lista de desejos quando o componente é montado
  useEffect(() => {
    if (isLoggedIn && productId) {
      setIsLoading(true);
      isProductInWishlist(productId)
        .then(result => {
          setIsInWishlist(result);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [isLoggedIn, productId]);

  // Função para adicionar ou remover dos favoritos
  const toggleWishlist = async () => {
    if (!isLoggedIn) {
      openAuthModal('login', 'Faça login para adicionar produtos aos favoritos');
      return;
    }

    try {
      setIsLoading(true);
      
      const endpoint = isInWishlist ? '/api/wishlist/remove' : '/api/wishlist/add';
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ productId }),
      });

      if (!response.ok) {
        throw new Error('Erro ao atualizar favoritos');
      }

      // Atualiza o estado local
      setIsInWishlist(!isInWishlist);
      
      // Exibe mensagem de sucesso
      toast.success(
        isInWishlist 
          ? `${productName || 'Produto'} removido dos favoritos` 
          : `${productName || 'Produto'} adicionado aos favoritos`
      );
      
    } catch (error) {
      console.error('Erro ao atualizar favoritos:', error);
      toast.error('Não foi possível atualizar seus favoritos. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button 
      onClick={toggleWishlist}
      disabled={isLoading}
      className={`wishlist-button flex items-center justify-center transition-colors ${
        isInWishlist ? 'text-red-500 hover:text-red-600' : 'text-gray-500 hover:text-red-500'
      }`}
      title={isInWishlist ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
    >
      {isLoading ? (
        <div className="animate-spin h-5 w-5 border-t-2 border-b-2 border-current rounded-full"></div>
      ) : (
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          viewBox="0 0 24 24" 
          fill={isInWishlist ? "currentColor" : "none"} 
          stroke="currentColor" 
          className="h-6 w-6"
          strokeWidth={isInWishlist ? "0" : "2"}
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" 
          />
        </svg>
      )}
    </button>
  );
};

export default WishlistButton;