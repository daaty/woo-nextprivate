import { gql } from '@apollo/client';

/**
 * Consulta para obter os produtos favoritos de um cliente
 * Usando a abordagem de metadados do usuário ou plugin de lista de desejos (Yith ou similar)
 */
export const GET_CUSTOMER_FAVORITES = gql`
  query GET_CUSTOMER_FAVORITES {
    customer {
      id
      metaData {
        key
        value
      }
    }
    products(first: 100, where: { featured: true }) {
      nodes {
        id
        name
        slug
        type
        onSale
        image {
          sourceUrl
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
        ... on ExternalProduct {
          price
          regularPrice
          salePrice
        }
        ... on GroupProduct {
          price
          regularPrice
          salePrice
        }
      }
    }
  }
`;

/**
 * Consulta para verificar se um produto está nos favoritos de um cliente
 */
export const CHECK_PRODUCT_IN_FAVORITES = gql`
  query CHECK_PRODUCT_IN_FAVORITES($productId: ID!) {
    customer {
      id
      metaData(key: "favorites") {
        key
        value
      }
    }
  }
`;