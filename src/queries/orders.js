import { gql } from '@apollo/client';

export const GET_ORDERS = gql`
  query GET_ORDERS {
    orders {
      nodes {
        id
        orderNumber
        date
        status
        total
        lineItems {
          nodes {
            product {
              node {
                id
                name
                slug
                image {
                  sourceUrl
                }
              }
            }
            quantity
            total
            subtotal
          }
        }
        shippingAddress {
          firstName
          lastName
          address1
          address2
          city
          state
          postcode
          country
        }
      }
    }
  }
`;
