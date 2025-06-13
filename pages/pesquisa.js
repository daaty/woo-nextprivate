import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import Link from 'next/link';
import Layout from '../src/components/Layout';
import Head from 'next/head';
import LoadingSpinner from '../src/components/LoadingSpinner';
import SEO from '../src/components/seo/SEO';

// Função utilitária para formatar preço em reais
const formatPrice = (price) => {
  if (!price) return 'R$ 0,00';
  
  // Se o preço já vier formatado com R$, remove para processar corretamente
  if (typeof price === 'string') {
    // Remover 'R$', '&nbsp;', e outros caracteres HTML
    price = price.replace(/R\$\s*|&nbsp;|&#\d+;/g, '');
  }
  
  // Converte para número se for string
  let numericPrice;
  try {
    if (typeof price === 'string') {
      // Normaliza o formato: substitui vírgula por ponto para conversão numérica
      numericPrice = parseFloat(price.replace(/\./g, '').replace(',', '.'));
    } else {
      numericPrice = price;
    }
    
    // Se NaN ou inválido, retorna zero formatado
    if (isNaN(numericPrice)) {
      return 'R$ 0,00';
    }

    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2
    }).format(numericPrice);
  } catch (e) {
    console.error('Erro ao formatar preço:', e);
    return 'R$ 0,00';
  }
};

export default function SearchPage() {
  const router = useRouter();
  const { s: searchQuery } = router.query;  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Usar estado para controlar a exibição de "Resultados para"
  const [displaySearchTerm, setDisplaySearchTerm] = useState('');
  // Efeito para definir o termo de pesquisa exibido
  useEffect(() => {
    if (searchQuery) {
      setDisplaySearchTerm(searchQuery);
    }
  }, [searchQuery]);
  
  // Efeito para buscar resultados
  useEffect(() => {
    // Só busca resultados se houver um termo de busca
    if (!searchQuery) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    // Buscar resultados da pesquisa
    fetch(`/api/search?query=${encodeURIComponent(searchQuery)}`)
      .then(async (res) => {
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || `API retornou status ${res.status}`);
        }
        
        const data = await res.json();
        console.log(`✓ ${Array.isArray(data) ? data.length : 0} resultados encontrados para "${searchQuery}"`);
        
        // Garantir que temos um array de produtos
        const resultsArray = Array.isArray(data) ? data : [];
        setSearchResults(resultsArray);
      })
      .catch((err) => {
        console.error('❌ Erro ao buscar resultados:', err);
        setError(err.message);
      })      .finally(() => setLoading(false));
  }, [searchQuery]);

  // Importar estilos para grid de produtos
  const productGridStyles = require('../styles/ProductGrid.module.css');
    return (
    <Layout>
      <SEO
        title={searchQuery ? `Resultados para "${searchQuery}" | Rota` : 'Pesquisa | Rota'}
        description={`Resultados da pesquisa por ${searchQuery || 'produtos'} na loja Rota`}
      />
        <div className="container mx-auto py-10">
        
        {displaySearchTerm && (
          <h1 className="text-3xl font-bold mb-8 text-center">
            Resultados para: "{displaySearchTerm}"
          </h1>
        )}
        
        {loading ? (
          <div className="flex justify-center py-20">
            <LoadingSpinner />
          </div>
        ) : error ? (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            <p>{error}</p>
          </div>        ) : !searchQuery ? (
          <div className="text-center py-10">
            <p className="text-xl text-gray-600">Digite um termo para pesquisar produtos.</p>
            <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 border border-gray-200 rounded-lg text-center hover:bg-gray-50 transition-colors">
                <Link href="/produto/promocoes">
                  <a className="block">
                    <div className="text-orange-500 mb-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <span className="font-medium">Promoções</span>
                  </a>
                </Link>
              </div>
              <div className="p-4 border border-gray-200 rounded-lg text-center hover:bg-gray-50 transition-colors">
                <Link href="/produto/lancamentos">
                  <a className="block">
                    <div className="text-blue-500 mb-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <span className="font-medium">Lançamentos</span>
                  </a>
                </Link>
              </div>
              <div className="p-4 border border-gray-200 rounded-lg text-center hover:bg-gray-50 transition-colors">
                <Link href="/produto/acessórios">
                  <a className="block">
                    <div className="text-green-500 mb-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                      </svg>
                    </div>
                    <span className="font-medium">Acessórios</span>
                  </a>
                </Link>
              </div>
              <div className="p-4 border border-gray-200 rounded-lg text-center hover:bg-gray-50 transition-colors">
                <Link href="/produto/áudio">
                  <a className="block">
                    <div className="text-purple-500 mb-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15.536a5 5 0 001.06-7.072M6.343 6.343a9 9 0 00-.398 12.728" />
                      </svg>
                    </div>
                    <span className="font-medium">Áudio</span>
                  </a>
                </Link>
              </div>
            </div>
          </div>
        ) : searchResults.length === 0 ? (          <div className="text-center py-10">
            <div className="mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-xl text-gray-600">Nenhum produto encontrado para "{searchQuery}".</p>
            <p className="mt-4 text-gray-500">Tente utilizar termos mais gerais ou verifique a ortografia.</p>
            
            <div className="mt-8 max-w-md mx-auto bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="font-medium mb-2">Sugestões:</h3>
              <ul className="text-left text-gray-600 space-y-2 pl-5">
                <li>• Verifique se há erros de digitação</li>
                <li>• Use termos mais gerais (ex: "smartphone" em vez de "iPhone 14 Pro Max")</li>
                <li>• Tente utilizar apenas uma ou duas palavras-chave</li>
                <li>• Experimente navegar por categorias utilizando os links abaixo</li>
              </ul>
              
              <div className="mt-6 grid grid-cols-2 gap-3">
                <Link href="/produto/promocoes">
                  <a className="bg-white py-2 px-4 border border-gray-200 rounded text-center hover:bg-gray-50">
                    Promoções
                  </a>
                </Link>
                <Link href="/produto/lancamentos">
                  <a className="bg-white py-2 px-4 border border-gray-200 rounded text-center hover:bg-gray-50">
                    Lançamentos
                  </a>
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <>            <div className="flex items-center justify-between flex-wrap mb-8">
              <p className="text-gray-600">
                {searchResults.length} {searchResults.length === 1 ? 'produto encontrado' : 'produtos encontrados'}
              </p>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">Ordenar por:</span>
                <select 
                  className="border border-gray-300 rounded p-1 text-sm cursor-pointer"
                  onChange={(e) => console.log('Ordenação selecionada:', e.target.value)}
                >
                  <option value="relevancia">Relevância</option>
                  <option value="menor-preco">Menor preço</option>
                  <option value="maior-preco">Maior preço</option>
                  <option value="mais-recentes">Mais recentes</option>
                </select>
              </div>
            </div>
            
            <div className={productGridStyles.productsGrid}>
              {searchResults.map(product => (
                <div key={product.id} className={productGridStyles.productCard}>
                  <Link href={`/produto/${product.slug}`}>
                    <a className={productGridStyles.productLink}>
                      <div className={productGridStyles.productImage}>
                        {product.image?.src ? (
                          <Image
                            src={product.image.src}
                            alt={product.name}
                            width={240}
                            height={240}
                            className="object-contain"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-200">
                            <span className="text-gray-400">Sem imagem</span>
                          </div>
                        )}
                        {product.on_sale && (
                          <span className={productGridStyles.saleTag}>OFERTA</span>
                        )}
                      </div>
                      <div className={productGridStyles.productInfo}>
                        <h2 className={productGridStyles.productName}>{product.name}</h2>
                        <div className={productGridStyles.productPricing}>
                          {product.on_sale && (
                            <span className={productGridStyles.regularPrice}>
                              {formatPrice(product.regular_price)}
                            </span>
                          )}
                          <span className={productGridStyles.price}>
                            {formatPrice(product.price)}
                          </span>
                          <span className={productGridStyles.installments}>em até <strong>12x</strong> no cartão</span>
                        </div>
                      </div>
                    </a>
                  </Link>
                  <div className={productGridStyles.productActions}>
                    <Link href={`/produto/${product.slug}`}>
                      <a className={productGridStyles.addToCartButton}>
                        Ver detalhes
                      </a>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
