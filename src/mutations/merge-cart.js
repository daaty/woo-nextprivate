// filepath: f:\Site Felipe\next-react-site\woo-next\src\mutations\merge-cart.js
import { gql } from '@apollo/client';

/**
 * Mutation para mesclar carrinhos após login do usuário
 * Esta mutation recebe os itens do carrinho local e os adiciona ao carrinho do usuário
 */
export const MERGE_CART = gql`
  mutation MERGE_CART($input: AddToCartInput!) {
    addToCart(input: $input) {
      cartItem {
        key
        product {
          node {
            id
            databaseId
            name
            slug
            image {
              sourceUrl
              altText
            }
          }
        }
        quantity
      }
    }
  }
`;