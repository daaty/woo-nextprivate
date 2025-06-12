import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import Link from 'next/link';
import { GET_CUSTOMER_FAVORITES } from '../../queries/favorites';
import { REMOVE_FROM_FAVORITES } from '../../mutations/favorites';
import { formatPrice } from '../../utils/format-price';
import LoadingSpinner from '../LoadingSpinner';

const FavoritesTab = ({ customerId }) => {
  console.log('[FavoritesTab] Componente montado com customerId:', customerId);

  const [favorites, setFavorites] = useState([]);
  const [isRemoving, setIsRemoving] = useState(null);
  
  const { loading, error, data, refetch } = useQuery(GET_CUSTOMER_FAVORITES, {
    fetchPolicy: 'network-only',
  });
  
  const [removeFromFavorites] = useMutation(REMOVE_FROM_FAVORITES);
  
  // Atualizado para trabalhar com a nova estrutura de metaData
  useEffect(() => {
    console.log('[FavoritesTab] Dados retornados pela consulta GET_CUSTOMER_FAVORITES:', data);
    if (data?.customer?.metaData && data?.products?.nodes) {
      try {
        const favoritesMetaData = data.customer.metaData.find(meta => meta.key === 'favorites');
        if (favoritesMetaData) {
          const favoriteIds = JSON.parse(favoritesMetaData.value);
          const favoriteProducts = data.products.nodes.filter(product => 
            favoriteIds.includes(product.id)
          );
          console.log('[FavoritesTab] Produtos favoritos processados com sucesso:', favoriteProducts);
          setFavorites(favoriteProducts);
        } else {
          console.warn('[FavoritesTab] Nenhum favorito encontrado nos metadados.');
          setFavorites([]);
        }
      } catch (error) {
        console.error('[FavoritesTab] Erro ao processar favoritos:', error);
        setFavorites([]);
      }
    } else {
      console.warn('[FavoritesTab] Dados incompletos ou ausentes na consulta GET_CUSTOMER_FAVORITES:', data);
    }
  }, [data]);
  
  const handleRemoveFromFavorites = async (productId) => {
    console.log('[FavoritesTab] Tentando remover o produto dos favoritos:', productId);
    if (isRemoving) return;
    
    setIsRemoving(productId);
    
    try {
      const response = await removeFromFavorites({
        variables: {
          input: {
            customerId,
            productId
          }
        }
      });
      console.log('[FavoritesTab] Produto removido dos favoritos com sucesso:', response);
      
      // Atualizar a lista de favoritos após a remoção
      const refetchResponse = await refetch();
      console.log('[FavoritesTab] Dados após refetch:', refetchResponse.data);
    } catch (error) {
      console.error('[FavoritesTab] Erro ao remover o produto dos favoritos:', error);
    } finally {
      setIsRemoving(null);
    }
  };

  const handleAddToFavorites = async (productId) => {
    console.log('[FavoritesTab] Tentando adicionar aos favoritos:', productId);
    try {
      const response = await addToFavorites({
        variables: {
          input: {
            customerId,
            productId,
          },
        },
      });
      console.log('[FavoritesTab] Resposta da mutação ADD_TO_FAVORITES:', response);
  
      // Forçar atualização dos favoritos ignorando o cache
      const refetchResponse = await refetch({ fetchPolicy: 'network-only' });
      console.log('[FavoritesTab] Dados após refetch (network-only):', refetchResponse.data);
    } catch (error) {
      console.error('[FavoritesTab] Erro ao adicionar aos favoritos:', error);
    }
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoadingSpinner />
        <span className="text-gray-600 ml-4">Carregando seus favoritos...</span>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-50 text-red-700 p-4 rounded-md mb-6">
        <p>Erro ao carregar favoritos: {error.message}</p>
        <p className="text-sm mt-2">Alguns componentes podem não estar funcionando corretamente devido a alterações na API.</p>
      </div>
    );
  }
  
  if (!favorites || favorites.length === 0) {
    return (
      <div className="favorites-empty text-center py-8">
        <h2 className="text-2xl font-bold mb-6">Seus Favoritos</h2>
        <div className="bg-gray-50 p-8 rounded-lg mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          <p className="text-gray-600 mb-4">Você ainda não adicionou nenhum produto aos favoritos.</p>
          <Link href="/produtos">
            <a 
              style={{
                background: 'linear-gradient(90deg, #ff6900, #ff8800)',
                color: 'white', 
                border: 'none', 
                padding: '10px 20px', 
                borderRadius: '6px',
                display: 'inline-block',
                transition: 'all 0.3s ease',
                transform: 'translateY(0)',
                boxShadow: '0 2px 4px rgba(255,105,0,0.2)'
              }}
              className="hover:-translate-y-0.5 hover:shadow-lg"
            >
              Explorar produtos
            </a>
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="favorites-container">
      <h2 className="text-2xl font-bold mb-6">Seus Favoritos</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {favorites.map(product => (
          <div 
            key={product.id} 
            className="favorite-card hover:-translate-y-1 hover:shadow-lg"
            style={{
              border: '1px solid #eee',
              borderRadius: '12px',
              overflow: 'hidden',
              transition: 'all 0.3s ease',
              background: 'linear-gradient(135deg, white, #f9f9f9)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
            }}
          >
            <Link href={`/produto/${product.slug}`}>
              <a className="block p-4">
                <div className="relative pb-3/4 mb-3 overflow-hidden">
                  <img
                    src={product.image?.sourceUrl || '/placeholder-product.png'}
                    alt={product.name}
                    className="absolute object-cover w-full h-full"
                    style={{
                      borderRadius: '8px',
                    }}
                  />
                </div>
                <h3 className="font-medium text-gray-800 mb-2 line-clamp-2 h-12">{product.name}</h3>
                <div className="flex justify-between items-center">
                  <div className="price">
                    {product.onSale ? (
                      <>
                        <span className="text-gray-500 line-through text-sm mr-2">{formatPrice(product.regularPrice)}</span>
                        <span className="text-orange-600 font-bold">{formatPrice(product.salePrice)}</span>
                      </>
                    ) : (
                      <span className="text-orange-600 font-bold">{formatPrice(product.price)}</span>
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      handleRemoveFromFavorites(product.id);
                    }}
                    disabled={isRemoving === product.id}
                    style={{
                      background: '#f3f4f6',
                      color: '#f43f5e',
                      border: 'none',
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s ease'
                    }}
                    className="hover:bg-red-50"
                    title="Remover dos favoritos"
                  >
                    {isRemoving === product.id ? (
                      <svg className="animate-spin h-4 w-4 text-red-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                </div>
              </a>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FavoritesTab;