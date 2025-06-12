import { gql } from "@apollo/client";

/**
 * Query para obter os detalhes do cliente autenticado
 */
export const GET_CUSTOMER = gql`
  query GetCustomerDetails {
    customer {      id
      databaseId
      firstName
      lastName
      email
      username
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
        phone
      }
      metaData {
        key
        value
      }
      orders {
        nodes {
          id
          databaseId
          orderNumber
          date
          status
          total
          lineItems {
            nodes {
              productId
              variationId
              quantity
              total
              product {
                node {
                  id
                  name
                  slug
                  image {
                    sourceUrl
                    altText
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`;

/**
 * Query para obter os pedidos do cliente
 */
export const GET_CUSTOMER_ORDERS = gql`
  query GetCustomerOrders($first: Int) {
    customer {
      orders(first: $first) {
        nodes {
          id
          databaseId
          orderNumber
          date
          status
          total
          subtotal
          shippingTotal
          lineItems {
            nodes {
              productId
              quantity
              total
              product {
                node {
                  id
                  name
                  slug
                  image {
                    sourceUrl
                    altText
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`;

/**
 * Mutation para atualizar os detalhes do cliente
 */
export const UPDATE_CUSTOMER = gql`
  mutation UpdateCustomer($input: UpdateCustomerInput!) {
    updateCustomer(input: $input) {
      customer {
        id
        firstName
        lastName
        email
      }
    }
  }
`;

/**
 * Mutation para atualizar o endereço do cliente
 */
export const UPDATE_CUSTOMER_ADDRESS = gql`
  mutation UpdateCustomerAddress(
    $input: UpdateCustomerInput!
  ) {
    updateCustomer(input: $input) {      customer {
        id
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
          phone
        }
      }
    }
  }
`;
