import { gql } from "@apollo/client";

export const PRODUCT_BY_ID_QUERY = gql`
  query ProductById($id: ID!) {
    product(id: $id, idType: DATABASE_ID) {
      id
      productId: databaseId
      slug
      name
    }
  }
`;
