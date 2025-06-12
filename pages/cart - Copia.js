import { useState, useEffect } from 'react';
import Layout from "../src/components/Layout";
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { useCartContext } from '../src/contexts/CartContext';
import SEO from '../src/components/seo/SEO';
import { formatPrice } from '../src/utils/format-price';

const Cart = () => {
  const router = useRouter();
  
  // O componente usa o CartContext para gerenciar o estado do carrinho
  const { 
    loading, 
    error, 
    cartItems, 
    cartTotal, 
    formattedTotal,
    updateCartItem, 
    removeCartItem, 
    clearCart, 
    updatingCart, 
    removingFromCart, 
    clearingCart,
    refetchCart
  } = useCartContext();

  // Verificar se o carrinho está vazio
  const cartEmpty = !cartItems || cartItems.length === 0;
  
  // Funções para manipular ações do carrinho
  const handleClearCart = async () => {
    // Confirmação antes de limpar o carrinho
    if (window.confirm('Tem certeza que deseja limpar o carrinho?')) {
      await clearCart();
    }
  };

  const handleGoToCheckout = () => {
    router.push('/checkout');
  };

  // Renderização para estado de carregamento
  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto py-12 px-6 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-orange-500 mx-auto mb-4"></div>
          <p className="text-lg">Carregando seu carrinho...</p>
        </div>
      </Layout>
    );
  }
  
  // Renderização para estado de erro
  if (error) {
    return (
      <Layout>
        <div className="container mx-auto py-12 px-6 text-center">
          <div className="mb-8">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold mb-4">Ops! Algo deu errado</h1>
          <p className="mb-8">{error.message || 'Erro ao carregar dados do carrinho'}</p>
          <button 
            onClick={() => refetchCart()}
            className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-md transition-colors"
          >
            Tentar novamente
          </button>
        </div>
      </Layout>
    );
  }
  
  // Renderização para carrinho vazio
  if (cartEmpty) {
    return (
      <Layout>
        <SEO 
          title="Carrinho de Compras"
          description="Seu carrinho de compras está vazio. Continue navegando e adicione produtos ao seu carrinho."
        />
        
        <div className="container mx-auto py-12 px-6">
          <h1 className="text-3xl font-bold mb-6 text-center">Meu Carrinho</h1>
          
          <div className="bg-white rounded-xl shadow-md p-12 text-center max-w-2xl mx-auto">
            <div className="mb-8">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 mx-auto text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            
            <h2 className="text-2xl font-semibold mb-4">Seu carrinho está vazio</h2>
            <p className="text-gray-600 mb-8">
              Parece que você ainda não adicionou produtos ao seu carrinho.
              <br/>
              Explore nossos produtos e encontre o que você procura.
            </p>
            
            <Link href="/">
              <a className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-lg text-lg font-medium transition-colors inline-block">
                Continuar Comprando
              </a>
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  // Renderização para carrinho com itens
  return (
    <Layout>
      <div className="container mx-auto py-8 px-4 sm:px-6">
        <div className="text-sm text-gray-500 mb-6">
          <Link href="/">
            <a className="hover:text-orange-500">Home</a>
          </Link>
          <span className="mx-2">/</span>
          <span className="text-gray-700 font-medium">Carrinho</span>
        </div>
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold mb-4 md:mb-0">Seu Carrinho</h1>
          <button 
            onClick={handleClearCart}
            disabled={clearingCart}
            className="text-sm text-gray-600 hover:text-red-600 flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            {clearingCart ? 'Limpando...' : 'Limpar Carrinho'}
          </button>
        </div>
        
        <div className="flex flex-col lg:flex-row lg:gap-8">
          {/* Versão Desktop: Tabela de produtos */}
          <div className="lg:w-2/3 hidden md:block">
            <div className="bg-white rounded-xl shadow-md overflow-hidden mb-6">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Produto</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Preço</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantidade</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {(cartItems || []).map((item) => {
                    const productName = item.product?.node?.name || 'Produto';
                    const imageUrl = item.product?.node?.image?.sourceUrl || '/placeholder-image.jpg';
                    const price = item.price || item.subtotal || 0;
                    const total = item.total || 0;
                    
                    return (
                      <tr key={item.key || Math.random().toString()}>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-20 w-20 relative border border-gray-100 rounded-md overflow-hidden">
                              <Image
                                src={imageUrl}
                                alt={productName}
                                layout="fill"
                                objectFit="contain"
                              />
                            </div>
                            <div className="ml-4">
                              <Link href={`/produto/${item.product?.node?.slug || '#'}`}>
                                <a className="text-sm font-medium text-gray-900 hover:text-orange-500">
                                  {productName}
                                </a>
                              </Link>
                              {item.variation && item.variation.attributes && item.variation.attributes.length > 0 && (
                                <div className="text-xs text-gray-500 mt-1">
                                  {item.variation.attributes.map((attr) => (
                                    <span key={`${item.key}-${attr.name}`} className="inline-block bg-gray-100 px-2 py-0.5 rounded-full mr-1 mb-1">
                                      {attr.name}: {attr.value}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">{formatPrice(price)}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center border border-gray-300 rounded w-24">
                            <button
                              onClick={() => updateCartItem(item.key, Math.max(1, (item.quantity || 1) - 1))}
                              disabled={updatingCart || (item.quantity || 1) <= 1}
                              className="px-2 py-1 text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50"
                            >
                              -
                            </button>
                            <span className="px-3 py-1 min-w-[24px] text-center">
                              {updatingCart ? (
                                <span className="inline-block w-4 h-4 border-2 border-gray-300 border-t-orange-500 rounded-full animate-spin"></span>
                              ) : (
                                item.quantity || 1
                              )}
                            </span>
                            <button
                              onClick={() => updateCartItem(item.key, (item.quantity || 1) + 1)}
                              disabled={updatingCart}
                              className="px-2 py-1 text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50"
                            >
                              +
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-bold text-gray-900">{formatPrice(total)}</div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => removeCartItem(item.key)}
                            disabled={removingFromCart}
                            className="text-red-600 hover:text-red-800 transition-colors disabled:opacity-50 focus:outline-none"
                          >
                            {removingFromCart ? (
                              <span className="inline-block w-4 h-4 border-2 border-red-300 border-t-red-500 rounded-full animate-spin"></span>
                            ) : (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                            )}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Versão Mobile: Lista de cards de produtos */}
          <div className="lg:w-2/3 md:hidden mb-6">
            <div className="space-y-4">
              {(cartItems || []).map((item) => {
                const productName = item.product?.node?.name || 'Produto';
                const imageUrl = item.product?.node?.image?.sourceUrl || '/placeholder-image.jpg';
                const price = item.price || item.subtotal || 0;
                const total = item.total || 0;
                
                return (
                  <div key={item.key || Math.random().toString()} className="bg-white rounded-xl shadow-sm p-4">
                    <div className="flex items-start">
                      <div className="flex-shrink-0 w-20 h-20 relative border border-gray-100 rounded-md overflow-hidden mr-3">
                        <Image
                          src={imageUrl}
                          alt={productName}
                          layout="fill"
                          objectFit="contain"
                        />
                      </div>
                      
                      <div className="flex-grow">
                        <Link href={`/produto/${item.product?.node?.slug || '#'}`}>
                          <a className="text-sm font-medium text-gray-900 hover:text-orange-500">
                            {productName}
                          </a>
                        </Link>
                        
                        {item.variation && item.variation.attributes && item.variation.attributes.length > 0 && (
                          <div className="text-xs text-gray-500 mt-1 mb-2">
                            {item.variation.attributes.map((attr) => (
                              <span key={`${item.key}-${attr.name}`} className="inline-block bg-gray-100 px-2 py-0.5 rounded-full mr-1 mb-1">
                                {attr.name}: {attr.value}
                              </span>
                            ))}
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between mt-2">
                          <div className="text-sm text-gray-900">
                            <span className="font-medium mr-1">Preço:</span>
                            <span className="font-semibold">{formatPrice(price)}</span>
                          </div>
                          <button
                            onClick={() => removeCartItem(item.key)}
                            disabled={removingFromCart}
                            className="text-red-600 hover:text-red-800 p-1 -mr-1"
                          >
                            {removingFromCart ? (
                              <span className="inline-block w-4 h-4 border-2 border-red-300 border-t-red-500 rounded-full animate-spin"></span>
                            ) : (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                            )}
                          </button>
                        </div>
                        
                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center border border-gray-300 rounded">
                            <button
                              onClick={() => updateCartItem(item.key, Math.max(1, (item.quantity || 1) - 1))}
                              disabled={updatingCart || (item.quantity || 1) <= 1}
                              className="px-2 py-1 text-gray-700 hover:bg-gray-100"
                            >
                              -
                            </button>
                            <span className="px-3 py-1 min-w-[24px] text-center">
                              {updatingCart ? (
                                <span className="inline-block w-4 h-4 border-2 border-gray-300 border-t-orange-500 rounded-full animate-spin"></span>
                              ) : (
                                item.quantity || 1
                              )}
                            </span>
                            <button
                              onClick={() => updateCartItem(item.key, (item.quantity || 1) + 1)}
                              disabled={updatingCart}
                              className="px-2 py-1 text-gray-700 hover:bg-gray-100"
                            >
                              +
                            </button>
                          </div>
                          <div className="text-sm">
                            <span className="font-medium mr-1">Total:</span>
                            <span className="font-bold text-orange-500">{formatPrice(total)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Resumo do pedido e finalização */}
          <div className="lg:w-1/3">
            <div className="bg-white rounded-xl shadow-md p-6 sticky top-24">
              <h2 className="text-lg font-bold mb-6 border-b pb-2">Resumo do Pedido</h2>
              
              <div className="space-y-4">
                <div className="flex justify-between text-gray-700">
                  <span>Subtotal ({(cartItems || []).length} {(cartItems || []).length === 1 ? 'item' : 'itens'})</span>
                  <span className="font-medium">{formattedTotal || formatPrice(cartTotal || 0)}</span>
                </div>
                
                <div className="border-t border-dashed pt-4 mt-4">
                  <div className="flex justify-between text-lg">
                    <span className="font-semibold">Total</span>
                    <span className="font-bold text-orange-500">{formattedTotal || formatPrice(cartTotal || 0)}</span>
                  </div>
                  
                  <p className="text-xs text-gray-500 mt-1 text-right">
                    ou até 12x de {formatPrice((cartTotal || 0) / 12)} sem juros
                  </p>
                </div>
                
                <div className="pt-4">
                  <button
                    onClick={handleGoToCheckout}
                    disabled={updatingCart || removingFromCart || clearingCart}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-lg font-medium transition-colors disabled:opacity-75"
                  >
                    {(updatingCart || removingFromCart || clearingCart) ? (
                      <span className="flex items-center justify-center">
                        <span className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></span>
                        Aguarde...
                      </span>
                    ) : (
                      'Finalizar Compra'
                    )}
                  </button>
                  
                  <Link href="/">
                    <a className="flex items-center justify-center text-gray-700 hover:text-orange-500 mt-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                      </svg>
                      Continuar Comprando
                    </a>
                  </Link>
                </div>
                
                <div className="flex flex-col items-center space-y-2 mt-4 text-xs text-gray-500 border-t border-dashed pt-4">
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    Pagamento 100% seguro
                  </div>
                  
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Troca garantida
                  </div>
                  
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z" />
                    </svg>
                    Diversos métodos de pagamento
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Cart;
