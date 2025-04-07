import { gql } from "@apollo/client";

const GET_COUNTRIES = gql`
  query {
    countries
  }
`;

export default GET_COUNTRIES;
