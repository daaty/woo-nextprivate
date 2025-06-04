import { gql } from '@apollo/client';

/**
 * Add To Cart Mutation
 *
 * Esta mutation adiciona um produto ao carrinho do WooCommerce
 * usando GraphQL e WPGraphQL WooCommerce
 */
export const ADD_TO_CART = gql`
  mutation ADD_TO_CART($input: AddToCartInput!) {
    addToCart(input: $input) {
      clientMutationId
      cartItem {
        key
        product {
          node {
            id
            databaseId
            name
            description
            type
            onSale
            slug
            averageRating
            image {
              id
              sourceUrl
              srcSet
              altText
              title
            }
            galleryImages {
              nodes {
                id
                sourceUrl
                srcSet
                altText
                title
              }
            }
            ... on SimpleProduct {
              price
              regularPrice
              salePrice
            }
            ... on VariableProduct {
              price
              regularPrice
              salePrice
            }
          }
        }
        variation {
          node {
            id
            databaseId
            name
            description
            type
            onSale
            price
            regularPrice
            salePrice
            image {
              id
              sourceUrl
              srcSet
              altText
              title
            }
            attributes {
              nodes {
                name
                value
              }
            }
          }
        }
        quantity
        total
        subtotal
        subtotalTax
      }      cart {
        contents {
          nodes {
            key
            product {
              node {
                id
                databaseId
                name
                description
                type
                onSale
                slug
                averageRating
                image {
                  id
                  sourceUrl
                  srcSet
                  altText
                  title
                }
                galleryImages {
                  nodes {
                    id
                    sourceUrl
                    srcSet
                    altText
                    title
                  }
                }
              }
            }
            variation {
              node {
                id
                databaseId
                name
                description
                type
                onSale
                price
                regularPrice
                salePrice
                image {
                  id
                  sourceUrl
                  srcSet
                  altText
                  title
                }
                attributes {
                  nodes {
                    name
                    value
                  }
                }
              }
            }
            quantity
            total
            subtotal
            subtotalTax
          }
          itemCount
          productCount
        }
        appliedCoupons {
          code
          discountAmount
          discountTax
        }
        subtotal
        subtotalTax
        shippingTax
        shippingTotal
        total
        totalTax
        feeTax
        feeTotal
        discountTax
        discountTotal
      }
    }
  }
`;

export default ADD_TO_CART;
