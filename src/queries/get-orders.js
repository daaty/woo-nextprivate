import { gql } from '@apollo/client';

export const GET_ORDERS = gql`
  query GetOrders($customerId: Int) {
    orders(where: { customerId: $customerId }, first: 100) {
      nodes {
        id
        databaseId
        orderNumber
        date
        status
        total
        subtotal
        totalTax
        shippingTotal
        paymentMethod
        paymentMethodTitle
        billing {
          firstName
          lastName
          company
          address1
          address2
          city
          state
          postcode
          country
          email
          phone
        }
        shipping {
          firstName
          lastName
          company
          address1
          address2
          city
          state
          postcode
          country
        }
        lineItems {
          nodes {
            quantity
            total
            subtotal
            product {
              node {
                id
                databaseId
                name
                sku
                image {
                  sourceUrl
                  altText
                }
                productCategories {
                  nodes {
                    name
                  }
                }
              }
            }
            variation {
              node {
                id
                name
                sku
              }
            }
          }
        }
        metaData {
          key
          value
        }
      }
    }
  }
`;
