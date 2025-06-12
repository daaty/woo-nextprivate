import { gql } from '@apollo/client';

/**
 * Mutação para adicionar um produto aos favoritos do cliente
 */
export const ADD_TO_FAVORITES = gql`
  mutation ADD_TO_FAVORITES($input: AddToFavoritesInput!) {
    addToFavorites(input: $input) {
      success
      customer {
        id
        favorites {
          id
          name
          slug
        }
      }
    }
  }
`;

/**
 * Mutação para remover um produto dos favoritos do cliente
 */
export const REMOVE_FROM_FAVORITES = gql`
  mutation REMOVE_FROM_FAVORITES($input: RemoveFromFavoritesInput!) {
    removeFromFavorites(input: $input) {
      success
      customer {
        id
        favorites {
          id
          name
          slug
        }
      }
    }
  }
`;