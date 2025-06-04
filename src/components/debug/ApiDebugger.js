import React, { useEffect, useState } from 'react';
import { useQuery } from '@apollo/client';
import { GET_PRODUCTS_BY_BRAND_ROBUST } from '../../queries/product-queries';

const ApiDebugger = ({ brand = "apple" }) => {
  const [debugInfo, setDebugInfo] = useState({
    loading: true,
    error: null,
    data: null,
    byTagCount: 0,
    bySearchCount: 0,
    byBrandCount: 0,
    totalCount: 0,
    processedProducts: []
  });

  const { loading, error, data } = useQuery(GET_PRODUCTS_BY_BRAND_ROBUST, {
    variables: { brand }
  });

  useEffect(() => {
    if (!loading) {
      // Dados recebidos da API
      console.log('[DEBUG] Resposta completa da API:', data);
      
      const byTagProducts = data?.byTag?.nodes || [];
      const bySearchProducts = data?.bySearch?.nodes || [];
      const byBrandProducts = data?.byProductBrand?.nodes || [];
      
      // Combinar resultados únicos por ID
      const uniqueProducts = [...byTagProducts, ...bySearchProducts, ...byBrandProducts]
        .filter((product, index, self) => 
          index === self.findIndex(p => p.id === product.id)
        );

      setDebugInfo({
        loading,
        error,
        data,
        byTagCount: byTagProducts.length,
        bySearchCount: bySearchProducts.length,
        byBrandCount: byBrandProducts.length,
        totalCount: uniqueProducts.length,
        processedProducts: uniqueProducts
      });

      console.log('[DEBUG] Produtos processados:', uniqueProducts);
      console.log('[SUCCESS]: Dados recebidos da API');
    }
  }, [loading, error, data]);

  if (loading) return <p>Carregando dados para debug...</p>;
  
  if (error) return <p>Erro ao buscar produtos: {error.message}</p>;

  return (
    <div style={{ padding: '20px', background: '#f5f5f5', borderRadius: '5px', margin: '20px 0' }}>
      <h2>Debug de API - Produtos da marca {brand}</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <h3>Contagem de produtos:</h3>
        <ul>
          <li>Por tag: {debugInfo.byTagCount}</li>
          <li>Por busca: {debugInfo.bySearchCount}</li>
          <li>Por taxonomia de marca: {debugInfo.byBrandCount}</li>
          <li><strong>Total de produtos únicos: {debugInfo.totalCount}</strong></li>
        </ul>
      </div>
      
      <div style={{ marginBottom: '20px' }}>
        <h3>Estrutura dos dados retornados:</h3>
        <pre style={{ background: '#e0e0e0', padding: '10px', borderRadius: '4px', maxHeight: '200px', overflow: 'auto' }}>
          {debugInfo.totalCount > 0 
            ? JSON.stringify({ products: { nodes: debugInfo.processedProducts } }, null, 2)
            : 'Nenhum produto encontrado'}
        </pre>
      </div>
      
      {debugInfo.totalCount > 0 && (
        <div>
          <h3>Produtos encontrados:</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '15px' }}>
            {debugInfo.processedProducts.map(product => (
              <div key={product.id} style={{ border: '1px solid #ddd', borderRadius: '4px', padding: '10px' }}>
                <img 
                  src={product.image?.sourceUrl || '/placeholder-image.jpg'} 
                  alt={product.name}
                  style={{ width: '100%', height: '150px', objectFit: 'contain' }}
                />
                <h4>{product.name}</h4>
                <p>Preço: R$ {product.price}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ApiDebugger;