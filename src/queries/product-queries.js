import { gql } from "@apollo/client";

/**
 * Query para buscar produtos de uma categoria específica
 */
export const PRODUCTS_BY_CATEGORY_QUERY = gql`
  query ProductsByCategory($categorySlug: [String], $first: Int, $after: String) {
    products(
      where: {
        categoryIn: $categorySlug
        status: "publish"
      }
      first: $first
      after: $after
    ) {
      edges {
        node {
          id
          databaseId
          name
          slug
          type
          averageRating
          shortDescription
          image {
            id
            sourceUrl
            altText
          }
          ... on SimpleProduct {
            price
            regularPrice
            salePrice
            stockStatus
            stockQuantity
          }
          ... on VariableProduct {
            price
            regularPrice
            salePrice
            stockStatus
            stockQuantity
          }
        }
      }
    }
  }
`;

/**
 * Query para buscar produtos em oferta
 */
export const PRODUCTS_ON_SALE_QUERY = gql`
  query ProductsOnSale($first: Int, $after: String) {
    products(
      where: {
        onSale: true
        status: "publish"
      }
      first: $first
      after: $after
    ) {
      edges {
        node {
          id
          databaseId
          name
          slug
          type
          averageRating
          shortDescription
          dateOnSaleFrom
          dateOnSaleTo
          image {
            id
            sourceUrl
            altText
          }
          ... on SimpleProduct {
            price
            regularPrice
            salePrice
            stockStatus
            stockQuantity
          }
          ... on VariableProduct {
            price
            regularPrice
            salePrice
            stockStatus
            stockQuantity
          }
        }
      }
    }
  }
`;

/**
 * Query para buscar produtos em destaque usando categoria
 */
export const FEATURED_PRODUCTS_QUERY = gql`
  query FeaturedProductsByCategory($first: Int, $after: String) {
    products(
      where: { 
        categoryIn: ["destaque", "em-destaque", "featured", "destaques"]
        status: "publish"
      }
      first: $first
      after: $after
    ) {
      edges {
        node {
          id
          databaseId
          name
          slug
          type
          averageRating
          shortDescription
          dateOnSaleFrom
          dateOnSaleTo
          onSale
          image {
            id
            sourceUrl
            altText
          }
          ... on SimpleProduct {
            price
            regularPrice
            salePrice
            stockStatus
            stockQuantity
          }
          ... on VariableProduct {
            price
            regularPrice
            salePrice
            stockStatus
            stockQuantity
          }
        }
      }
    }
  }
`;

export const GET_PRODUCTS_BY_BRAND = gql`
  query GetProductsByBrand($brand: String!) {
    productsByBrand: products(
      where: {
        tagIn: [$brand]
      },
      first: 24
    ) {
      nodes {
        id
        databaseId
        name
        slug
        price
        onSale
        regularPrice
        salePrice
        shortDescription
        date_created: dateOnSaleFrom
        image {
          id
          sourceUrl
          srcSet
          altText
          title
        }
        ... on SimpleProduct {
          price
          regularPrice
        }
        ... on VariableProduct {
          price
          regularPrice
        }
      }
    }
  }
`;

export const GET_PRODUCTS_BY_BRAND_ROBUST = gql`
  query GetProductsByBrandRobust($brand: String!) {
    # Tentativa 1: Buscar por tag
    byTag: products(
      where: {
        tagIn: [$brand]
      },
      first: 24
    ) {
      nodes {
        id
        databaseId
        name
        slug
        price
        onSale
        regularPrice
        salePrice
        shortDescription
        date_created: dateOnSaleFrom
        image {
          id
          sourceUrl
          srcSet
          altText
          title
        }
        ... on SimpleProduct {
          price
          regularPrice
        }
        ... on VariableProduct {
          price
          regularPrice
        }
      }
    }
    
    # Tentativa 2: Buscar por termo genérico (search)
    bySearch: products(
      where: {
        search: $brand
      },
      first: 24
    ) {
      nodes {
        id
        databaseId
        name
        slug
        price
        onSale
        regularPrice
        salePrice
        shortDescription
        date_created: dateOnSaleFrom
        image {
          id
          sourceUrl
          srcSet
          altText
          title
        }
        ... on SimpleProduct {
          price
          regularPrice
        }
        ... on VariableProduct {
          price
          regularPrice
        }
      }
    }
    
    # Tentativa 3: Buscar por termo nas taxonomias personalizadas (productTaxonomies)
    byProductBrand: products(
      where: {
        taxonomyFilter: {
          taxonomy: "pa_brand",
          terms: [$brand],
          operator: IN
        }
      },
      first: 24
    ) {
      nodes {
        id
        databaseId
        name
        slug
        price
        onSale
        regularPrice
        salePrice
        shortDescription
        date_created: dateOnSaleFrom
        image {
          id
          sourceUrl
          srcSet
          altText
          title
        }
        ... on SimpleProduct {
          price
          regularPrice
        }
        ... on VariableProduct {
          price
          regularPrice
        }
      }
    }
  }
`;

export const GET_PRODUCTS_BY_CATEGORY = gql`
  query GetProductsByCategory($category: String!, $first: Int) {
    products(
      where: {
        categoryName: $category
      },
      first: $first
    ) {
      nodes {
        id
        databaseId
        name
        slug
        shortDescription
        onSale
        stockStatus
        price
        regularPrice
        salePrice
        image {
          sourceUrl
          altText
        }
        date_created
        dateOnSaleFrom
      }
    }
  }
`;

/**
 * Query para buscar detalhes de um produto individual pelo slug
 */
export const GET_PRODUCT_BY_SLUG = gql`
  query GetProductBySlug($slug: ID!) {
    product(id: $slug, idType: SLUG) {
      id
      databaseId
      name
      slug
      description
      shortDescription
      type
      onSale
      averageRating
      reviewCount
      stockStatus
      stockQuantity
      dateOnSaleFrom
      dateOnSaleTo
      image {
        id
        sourceUrl
        altText
        title
      }
      galleryImages {
        nodes {
          id
          sourceUrl
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
        variations {
          nodes {
            id
            name
            stockStatus
            attributes {
              nodes {
                name
                value
              }
            }
            image {
              sourceUrl
              altText
            }
            price
            regularPrice
            salePrice
          }
        }
        attributes {
          nodes {
            name
            options
            variation
          }
        }
      }
      productCategories {
        nodes {
          id
          name
          slug
        }
      }
      productTags {
        nodes {
          id
          name
          slug
        }
      }
      related(first: 4) {
        nodes {
          id
          slug
          name
          price
          regularPrice
          salePrice
          onSale
          image {
            sourceUrl
            altText
          }
        }
      }
    }
  }
`;
