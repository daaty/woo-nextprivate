import { gql } from "@apollo/client";

/**
 * Mutation para atualizar dados de billing do cliente
 * Inclui CPF e telefone necessários para pagamentos via PagBank
 */
export const UPDATE_CUSTOMER_BILLING = gql`
  mutation UpdateCustomerBilling($input: UpdateCustomerInput!) {
    updateCustomer(input: $input) {
      customer {
        id
        firstName
        lastName
        email
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
      }
    }
  }
`;
