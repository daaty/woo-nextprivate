import { gql } from "@apollo/client";

export const GET_CUSTOMER_FAVORITES = gql`
  query GetCustomerFavorites($customerId: ID!) {
    customer(id: $customerId) {
      id
      databaseId
      favorites {
        edges {
          node {
            id
            databaseId
            name
            slug
            price
            regularPrice
            onSale
            image {
              sourceUrl
              altText
            }
          }
        }
      }
    }
  }
`;