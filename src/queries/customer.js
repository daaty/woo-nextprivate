import { gql } from '@apollo/client';

export const GET_CUSTOMER = gql`
  query GET_CUSTOMER {
    customer {
      id
      email
      firstName
      lastName
      displayName
      sessionToken
      shipping {
        firstName
        lastName
        address1
        address2
        city
        state
        postcode
        country
      }
      billing {
        firstName
        lastName
        address1
        address2
        city
        state
        postcode
        country
        email
        phone
      }
    }
  }
`;
