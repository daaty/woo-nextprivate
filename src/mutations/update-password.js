import { gql } from "@apollo/client";

export const UPDATE_PASSWORD = gql`
  mutation UpdateCustomerPassword($input: UpdateCustomerPasswordInput!) {
    updateCustomerPassword(input: $input) {
      customer {
        id
        databaseId
      }
      authToken
    }
  }
`;