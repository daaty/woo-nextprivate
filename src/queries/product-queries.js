import { gql } from "@apollo/client";

/**
 * Query para buscar produtos de uma categoria específica
 */
export const PRODUCTS_BY_CATEGORY_QUERY = gql`
  query ProductsByCategory($categorySlug: String, $first: Int, $after: String) {
    products(
      where: {
        categoryIn: $categorySlug
        status: "publish"
      }
      first: $first
      after: $after
    ) {
      edges {
        node {
          id
          databaseId
          name
          slug
          type
          averageRating
          shortDescription
          image {
            id
            sourceUrl
            altText
          }
          ... on SimpleProduct {
            price
            regularPrice
            salePrice
            stockStatus
            stockQuantity
          }
          ... on VariableProduct {
            price
            regularPrice
            salePrice
            stockStatus
            stockQuantity
          }
        }
      }
    }
  }
`;

/**
 * Query para buscar produtos em oferta
 */
export const PRODUCTS_ON_SALE_QUERY = gql`
  query ProductsOnSale($first: Int, $after: String) {
    products(
      where: {
        onSale: true
        status: "publish"
      }
      first: $first
      after: $after
    ) {
      edges {
        node {
          id
          databaseId
          name
          slug
          type
          averageRating
          shortDescription
          dateOnSaleFrom
          dateOnSaleTo
          image {
            id
            sourceUrl
            altText
          }
          ... on SimpleProduct {
            price
            regularPrice
            salePrice
            stockStatus
            stockQuantity
          }
          ... on VariableProduct {
            price
            regularPrice
            salePrice
            stockStatus
            stockQuantity
          }
        }
      }
    }
  }
`;
