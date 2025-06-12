import { gql } from "@apollo/client";

/**
 * Query para buscar produtos em destaque baseados em uma tag específica
 */
export const FEATURED_PRODUCTS_QUERY = gql`
  query FeaturedProducts($first: Int) {
    products(
      where: { 
        featured: true,
        status: "publish"
      }
      first: $first
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
