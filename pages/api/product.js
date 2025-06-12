import { gql } from "@apollo/client";
import client from '../../src/components/ApolloClient';
import { GET_PRODUCT_BY_SLUG } from '../../src/queries/product-queries';

/**
 * Endpoint para buscar um produto específico pelo slug
 * 
 * Esta API serve como um proxy para consultas GraphQL do WooCommerce,
 * permitindo que o front-end mantenha sua simplicidade de uso.
 */
export default async function handler(req, res) {
  try {
    const { slug } = req.query;
    
    if (!slug) {
      return res.status(400).json({ error: "Parâmetro 'slug' é obrigatório" });
    }
    
    console.group(`API Request: /api/product?slug=${slug}`);
    console.log(`Buscando produto com slug: ${slug}`);
    
    // Query correta com fragmentos inline para os campos específicos de tipo de produto
    const productQuery = gql`
      query GetProductBySlug($slug: ID!) {
        product(id: $slug, idType: SLUG) {
          id
          databaseId
          name
          slug
          description
          shortDescription
          type
          onSale
          averageRating
          reviewCount
          image {
            id
            sourceUrl
            altText
            title
          }
          galleryImages {
            nodes {
              id
              sourceUrl
              altText
              title
            }
          }
          ... on SimpleProduct {
            price
            regularPrice
            salePrice
            stockStatus
            stockQuantity
            dateOnSaleFrom
            dateOnSaleTo
          }
          ... on VariableProduct {
            price
            regularPrice
            salePrice
            stockStatus
            stockQuantity
            dateOnSaleFrom
            dateOnSaleTo
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
            attributes {
              nodes {
                name
                options
                variation
              }
            }
          }
          productCategories {
            nodes {
              id
              name
              slug
            }
          }
          related(first: 4) {
            nodes {
              id
              slug
              name
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
              onSale
              image {
                sourceUrl
                altText
              }
            }
          }
        }
      }
    `;
    
    // Executa a query GraphQL
    console.log("⏳ Executando consulta GraphQL...");
    const { data, errors } = await client.query({
      query: productQuery,
      variables: { slug },
      fetchPolicy: 'no-cache' // Não usar cache para garantir dados atualizados
    });
    
    if (errors) {
      console.error("❌ Erros na consulta GraphQL:", errors);
      throw new Error("Falha na consulta GraphQL");
    }
    
    if (!data?.product) {
      console.warn("⚠️ Produto não encontrado com o slug fornecido");
      return res.status(404).json({ error: "Produto não encontrado" });
    }
    
    console.log("✅ Produto encontrado com sucesso");
    console.log(`Nome do produto: ${data.product.name}`);
    console.groupEnd();
    
    // Retorna os dados do produto
    return res.status(200).json(data.product);
  } catch (error) {
    console.error('❌ Erro ao buscar produto:', error);
    
    // Retorna erro com status 500
    return res.status(500).json({ 
      error: "Erro ao buscar produto", 
      message: error.message 
    });
  }
}