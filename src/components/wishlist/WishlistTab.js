import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { toast } from 'react-toastify';
import { formatPrice } from '../../utils/price-format';
import LoadingSpinner from '../LoadingSpinner';

const WishlistTab = () => {
  const [wishlistItems, setWishlistItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Buscar a lista de favoritos do usuário
  useEffect(() => {
    const fetchWishlist = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/wishlist/list');
        
        if (!response.ok) {
          throw new Error('Erro ao buscar favoritos');
        }
        
        const data = await response.json();
        setWishlistItems(data.items || []);
      } catch (err) {
        console.error('Erro ao carregar favoritos:', err);
        setError('Não foi possível carregar seus favoritos. Tente novamente mais tarde.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchWishlist();
  }, []);

  // Função para remover um produto dos favoritos
  const removeFromWishlist = async (productId, productName) => {
    try {
      const response = await fetch('/api/wishlist/remove', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ productId }),
      });

      if (!response.ok) {
        throw new Error('Erro ao remover dos favoritos');
      }

      // Atualiza a lista de favoritos local
      setWishlistItems(prevItems => prevItems.filter(item => item.product.databaseId !== productId));
      
      // Exibe mensagem de sucesso
      toast.success(`${productName} removido dos favoritos`);
    } catch (error) {
      console.error('Erro ao remover dos favoritos:', error);
      toast.error('Não foi possível remover o produto dos favoritos. Tente novamente.');
    }
  };

  // Renderizar estado de carregamento
  if (isLoading) {
    return <div className="flex justify-center p-8"><LoadingSpinner /></div>;
  }

  // Renderizar mensagem de erro
  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-md text-red-600 mb-6">
        <p>{error}</p>
      </div>
    );
  }

  // Renderizar lista vazia
  if (wishlistItems.length === 0) {
    return (
      <div className="text-center py-10">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
        <h3 className="text-lg font-semibold mb-2">Sua lista de favoritos está vazia</h3>
        <p className="text-gray-500 mb-4">Adicione produtos à sua lista de favoritos para encontrá-los facilmente depois.</p>
        <Link href="/produtos" legacyBehavior>
          <a className="inline-flex items-center px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark transition-colors">
            Explorar produtos
          </a>
        </Link>
      </div>
    );
  }

  // Renderizar lista de produtos favoritos
  return (
    <div className="wishlist-tab">
      <h3 className="text-lg font-medium mb-4">Meus Favoritos ({wishlistItems.length})</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {wishlistItems.map(item => (
          <div key={item.product.databaseId} className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            <div className="relative aspect-square">
              {item.product.image ? (
                <Image 
                  src={item.product.image.sourceUrl} 
                  alt={item.product.name} 
                  layout="fill" 
                  objectFit="contain" 
                />
              ) : (
                <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400">
                  Sem imagem
                </div>
              )}
            </div>
            
            <div className="p-4">
              <Link href={`/produto/${item.product.slug}`} legacyBehavior>
                <a className="font-medium hover:text-primary truncate block">
                  {item.product.name}
                </a>
              </Link>
              
              <div className="mt-2 flex items-center justify-between">
                <span className="text-primary font-semibold">
                  {formatPrice(item.product.price)}
                </span>
                
                <div className="flex space-x-2">
                  <button 
                    onClick={() => removeFromWishlist(item.product.databaseId, item.product.name)}
                    className="p-2 text-gray-500 hover:text-red-500 transition-colors"
                    title="Remover dos favoritos"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WishlistTab;