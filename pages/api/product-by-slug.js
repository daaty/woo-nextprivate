import { gql } from "@apollo/client";
import client from '../../src/components/ApolloClient';

/**
 * Endpoint para buscar produto específico por slug
 * Com recursos avançados de diagnóstico e busca de alternativas
 */
export default async function handler(req, res) {
  try {
    // Obter slug da query
    const { slug } = req.query;
    
    if (!slug) {
      return res.status(400).json({
        success: false,
        message: 'Parâmetro slug é obrigatório'
      });
    }
    
    console.log(`API: Buscando produto com slug: ${slug}`);
    
    // 1. Primeiro tentar buscar o produto exato pelo slug
    const PRODUCT_BY_SLUG_QUERY = gql`
      query ProductBySlug($slug: ID!) {
        product(id: $slug, idType: SLUG) {
          id
          databaseId
          name
          slug
          description
          shortDescription
          sku
          averageRating
          reviewCount
          onSale
          stockStatus
          stockQuantity
          galleryImages {
            nodes {
              id
              title
              altText
              sourceUrl
            }
          }
          image {
            id
            sourceUrl
            altText
            title
          }
          productCategories {
            nodes {
              id
              name
              slug
            }
          }
          ... on SimpleProduct {
            price
            regularPrice
            salePrice
          }
          ... on VariableProduct {
            price
            regularPrice
            salePrice
            variations {
              nodes {
                id
                name
                stockStatus
                attributes {
                  nodes {
                    name
                    value
                  }
                }
                image {
                  sourceUrl
                  altText
                }
                price
                regularPrice
                salePrice
              }
            }
          }
        }
      }
    `;
    
    const { data: productData } = await client.query({
      query: PRODUCT_BY_SLUG_QUERY,
      variables: { slug },
      fetchPolicy: 'no-cache' // Forçar uma nova busca sem cache
    });
    
    // Se encontrou o produto exato, retornar
    if (productData?.product) {
      console.log(`API: Produto encontrado com slug ${slug}`);
      return res.status(200).json({
        success: true,
        product: productData.product,
        exactMatch: true
      });
    }
    
    console.log(`API: Produto não encontrado com slug ${slug}, buscando alternativas...`);
    
    // 2. Se não encontrou, extrair termos de busca do slug
    const searchTerms = slug
      .replace(/-/g, ' ')
      .split(' ')
      .filter(term => term.length > 2 && !['com', 'para', 'por', 'que', 'dos', 'das', 'com'].includes(term));
    
    // 3. Buscar produtos similares se tiver termos válidos
    if (searchTerms.length > 0) {
      const searchTerm = searchTerms.slice(0, 2).join(' '); // Usar as duas primeiras palavras-chave
      console.log(`API: Buscando produtos similares com termo: '${searchTerm}'`);
      
      const SIMILAR_PRODUCTS_QUERY = gql`
        query SimilarProducts($search: String!) {
          products(first: 5, where: { search: $search }) {
            nodes {
              id
              databaseId
              name
              slug
              description
              shortDescription
              sku
              averageRating
              reviewCount
              onSale
              stockStatus
              stockQuantity
              image {
                id
                sourceUrl
                altText
                title
              }
              productCategories {
                nodes {
                  id
                  name
                  slug
                }
              }
              ... on SimpleProduct {
                price
                regularPrice
                salePrice
              }
              ... on VariableProduct {
                price
                regularPrice
                salePrice
              }
            }
          }
        }
      `;
      
      const { data: similarData } = await client.query({
        query: SIMILAR_PRODUCTS_QUERY,
        variables: { search: searchTerm },
        fetchPolicy: 'no-cache'
      });
      
      if (similarData?.products?.nodes?.length > 0) {
        console.log(`API: Encontrados ${similarData.products.nodes.length} produtos similares`);
        
        // Retornar o primeiro produto similar e a lista de alternativos
        return res.status(200).json({
          success: true,
          product: similarData.products.nodes[0],
          alternatives: similarData.products.nodes.slice(1),
          exactMatch: false,
          originalSlug: slug
        });
      }
      
      console.log('API: Nenhum produto similar encontrado');
    }
    
    // 4. Verificar os slugs disponíveis para diagnóstico
    const ALL_PRODUCTS_QUERY = gql`
      query AllProducts {
        products(first: 100) {
          nodes {
            slug
            name
          }
        }
      }
    `;
    
    const { data: allProductsData } = await client.query({
      query: ALL_PRODUCTS_QUERY,
      fetchPolicy: 'no-cache'
    });
    
    const availableSlugs = allProductsData?.products?.nodes?.map(p => p.slug) || [];
    console.log(`API: Total de slugs disponíveis: ${availableSlugs.length}`);
    
    if (availableSlugs.length > 0) {
      // 5. Verificar se existe slug similar
      const closestMatches = availableSlugs
        .map(existingSlug => ({
          slug: existingSlug,
          similarity: calculateSimilarity(slug, existingSlug)
        }))
        .filter(match => match.similarity > 0.5) // 50% de similaridade mínima
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, 5);
      
      if (closestMatches.length > 0) {
        console.log(`API: Encontrados ${closestMatches.length} slugs semelhantes`);
        console.log('Slugs semelhantes:', closestMatches.map(m => `${m.slug} (${(m.similarity * 100).toFixed(1)}%)`));
        
        // Buscar detalhes do produto com maior similaridade
        const mostSimilarSlug = closestMatches[0].slug;
        
        const { data: similarProductData } = await client.query({
          query: PRODUCT_BY_SLUG_QUERY,
          variables: { slug: mostSimilarSlug },
          fetchPolicy: 'no-cache'
        });
        
        if (similarProductData?.product) {
          console.log(`API: Usando produto com slug similar: ${mostSimilarSlug}`);
          
          // Buscar os outros produtos similares para alternativas
          const otherMatches = await Promise.all(
            closestMatches.slice(1).map(async (match) => {
              const { data: matchData } = await client.query({
                query: PRODUCT_BY_SLUG_QUERY,
                variables: { slug: match.slug },
                fetchPolicy: 'no-cache'
              });
              return matchData?.product;
            })
          );
          
          const alternativeProducts = otherMatches.filter(Boolean);
          
          return res.status(200).json({
            success: true,
            product: similarProductData.product,
            alternatives: alternativeProducts,
            exactMatch: false,
            originalSlug: slug,
            suggestedSlug: mostSimilarSlug,
            similarity: closestMatches[0].similarity
          });
        }
      }
    }
    
    // 6. Em último caso, retornar os produtos mais recentes
    console.log('API: Nenhuma correspondência encontrada, retornando produtos recentes');
    
    const RECENT_PRODUCTS_QUERY = gql`
      query RecentProducts {
        products(first: 5, where: {orderby: {field: DATE, order: DESC}}) {
          nodes {
            id
            databaseId
            name
            slug
            description
            shortDescription
            sku
            averageRating
            reviewCount
            onSale
            stockStatus
            stockQuantity
            image {
              id
              sourceUrl
              altText
              title
            }
            ... on SimpleProduct {
              price
              regularPrice
              salePrice
            }
            ... on VariableProduct {
              price
              regularPrice
              salePrice
            }
          }
        }
      }
    `;
    
    const { data: recentData } = await client.query({
      query: RECENT_PRODUCTS_QUERY,
      fetchPolicy: 'no-cache'
    });
    
    if (recentData?.products?.nodes?.length > 0) {
      return res.status(200).json({
        success: true,
        product: recentData.products.nodes[0],
        alternatives: recentData.products.nodes.slice(1),
        exactMatch: false,
        originalSlug: slug,
        fallbackToRecent: true
      });
    }
    
    // Se absolutamente nenhum produto for encontrado
    return res.status(404).json({
      success: false,
      message: 'Produto não encontrado e não foi possível encontrar alternativas',
      originalSlug: slug
    });
    
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erro ao buscar produto',
      error: error.toString()
    });
  }
}

/**
 * Calcula a similaridade entre dois strings (0-1)
 * Baseado em distância de Levenshtein
 */
function calculateSimilarity(str1, str2) {
  // Função para calcular a distância de Levenshtein
  const levenshteinDistance = (a, b) => {
    const matrix = [];
    
    // Incrementar ao longo das letras de a
    for (let i = 0; i <= a.length; i++) {
      matrix[i] = [i];
    }
    
    // Incrementar ao longo das letras de b
    for (let j = 0; j <= b.length; j++) {
      matrix[0][j] = j;
    }
    
    // Preencher a matriz
    for (let i = 1; i <= a.length; i++) {
      for (let j = 1; j <= b.length; j++) {
        if (a.charAt(i-1) === b.charAt(j-1)) {
          matrix[i][j] = matrix[i-1][j-1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i-1][j-1] + 1, // substituição
            matrix[i][j-1] + 1,   // inserção
            matrix[i-1][j] + 1    // exclusão
          );
        }
      }
    }
    
    return matrix[a.length][b.length];
  };
  
  const maxLength = Math.max(str1.length, str2.length);
  if (maxLength === 0) return 1.0; // Ambos strings vazios
  
  const distance = levenshteinDistance(str1, str2);
  return 1 - distance / maxLength;
}