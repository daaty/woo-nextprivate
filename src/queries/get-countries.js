import { gql } from "@apollo/client";

const GET_COUNTRIES = gql`
  query {
    countries {
      countryCode
      countryName
      states {
        stateCode
        stateName
      }
    }
  }
`;

export default GET_COUNTRIES;
