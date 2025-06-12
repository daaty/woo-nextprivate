// ... existing code ...

/**
 * Fetch product by slug
 */
export async function getProductBySlug(slug) {
  const query = `
    query GetProductBySlug($slug: ID!) {
      product(id: $slug, idType: SLUG) {
        id
        databaseId
        name
        slug
        description
        shortDescription
        price
        regularPrice
        salePrice
        onSale
        images {
          nodes {
            id
            sourceUrl
            altText
          }
        }
        attributes {
          nodes {
            name
            options
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
              databaseId
              name
              price
              regularPrice
              salePrice
              attributes {
                nodes {
                  name
                  value
                }
              }
              image {
                id
                sourceUrl
                altText
              }
            }
          }
        }
        categories {
          nodes {
            id
            name
            slug
          }
        }
        productBrands {
          nodes {
            id
            name
            slug
          }
        }
        relatedProducts {
          nodes {
            id
            name
            slug
            featuredImage {
              node {
                sourceUrl
                altText
              }
            }
            price
            regularPrice
            salePrice
          }
        }
      }
    }
  `;

  try {
    const response = await fetch(process.env.NEXT_PUBLIC_WORDPRESS_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query,
        variables: { slug },
      }),
    });

    const { data } = await response.json();
    
    if (!data.product) {
      return null;
    }

    // Format the product data
    return {
      id: data.product.databaseId,
      name: data.product.name,
      slug: data.product.slug,
      description: data.product.description || '',
      short_description: data.product.shortDescription || '',
      price: data.product.price,
      regular_price: data.product.regularPrice,
      sale_price: data.product.salePrice,
      on_sale: data.product.onSale,
      compare_at_price: data.product.regularPrice,
      images: data.product.images.nodes.map(img => ({
        id: img.id,
        src: img.sourceUrl,
        alt: img.altText || data.product.name
      })),
      categories: data.product.categories.nodes.map(cat => ({
        id: cat.id,
        name: cat.name,
        slug: cat.slug
      })),
      brands: data.product.productBrands?.nodes.map(brand => ({
        id: brand.id,
        name: brand.name,
        slug: brand.slug
      })) || [],
      variations: data.product.variations?.nodes.map(variation => ({
        id: variation.databaseId,
        name: variation.name,
        price: variation.price,
        regular_price: variation.regularPrice,
        sale_price: variation.salePrice,
        compare_at_price: variation.regularPrice,
        attributes: variation.attributes.nodes.map(attr => ({
          name: attr.name,
          value: attr.value
        })),
        image: variation.image ? {
          id: variation.image.id,
          src: variation.image.sourceUrl,
          alt: variation.image.altText
        } : null
      })) || []
    };
  } catch (error) {
    console.error('Error fetching product by slug:', error);
    return null;
  }
}

/**
 * Fetch related products by category
 */
export async function getRelatedProducts(categoryId, excludeId) {
  const query = `
    query GetProductsByCategory($categoryId: ID!, $excludeId: [ID]) {
      products(where: {categoryId: $categoryId, notIn: $excludeId}, first: 4) {
        nodes {
          id
          databaseId
          name
          slug
          price
          regularPrice
          salePrice
          onSale
          featuredImage {
            node {
              sourceUrl
              altText
            }
          }
        }
      }
    }
  `;

  try {
    const response = await fetch(process.env.NEXT_PUBLIC_WORDPRESS_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query,
        variables: { 
          categoryId,
          excludeId: [excludeId]
        },
      }),
    });

    const { data } = await response.json();
    
    if (!data.products || !data.products.nodes) {
      return [];
    }
    
    // Format products
    return data.products.nodes.map(product => ({
      id: product.databaseId,
      name: product.name,
      slug: product.slug,
      price: product.price,
      regular_price: product.regularPrice,
      sale_price: product.salePrice,
      on_sale: product.onSale,
      compare_at_price: product.regularPrice,
      image: product.featuredImage?.node ? {
        src: product.featuredImage.node.sourceUrl,
        alt: product.featuredImage.node.altText || product.name
      } : null
    }));
  } catch (error) {
    console.error('Error fetching related products:', error);
    return [];
  }
}

/**
 * Busca todos os smartphones
 */
export async function getAllSmartphones() {
  const query = `
    query GetAllSmartphones {
      products(where: {categoryIn: "smartphones"}, first: 24) {
        nodes {
          id
          databaseId
          name
          slug
          price
          regularPrice
          salePrice
          onSale
          featuredImage {
            node {
              sourceUrl
              altText
            }
          }
        }
      }
    }
  `;

  try {
    const response = await fetch(process.env.NEXT_PUBLIC_WORDPRESS_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query
      }),
    });

    const { data } = await response.json();
    
    if (!data || !data.products || !data.products.nodes) {
      // Se não houver dados reais, retornamos dados simulados combinando todas as marcas
      return [
        ...getDummyProductsByBrand('apple'),
        ...getDummyProductsByBrand('xiaomi'),
        ...getDummyProductsByBrand('samsung'),
        ...getDummyProductsByBrand('motorola')
      ].slice(0, 24);
    }
    
    // Formatar produtos
    return data.products.nodes.map(product => ({
      id: product.databaseId,
      name: product.name,
      slug: product.slug,
      price: product.price,
      regular_price: product.regularPrice,
      sale_price: product.salePrice,
      on_sale: product.onSale,
      compare_at_price: product.regularPrice,
      image: product.featuredImage?.node ? {
        src: product.featuredImage.node.sourceUrl,
        alt: product.featuredImage.node.altText || product.name
      } : null
    }));
  } catch (error) {
    console.error('Erro ao buscar smartphones:', error);
    // Em caso de erro, retornamos dados simulados
    return [
      ...getDummyProductsByBrand('apple'),
      ...getDummyProductsByBrand('xiaomi'),
      ...getDummyProductsByBrand('samsung'),
      ...getDummyProductsByBrand('motorola')
    ].slice(0, 24);
  }
}

/**
 * Busca produtos por marca específica
 */
export async function getProductsByBrand(brand) {
  // Mapear o nome da marca para o respectivo ID de taxonomia no WooCommerce
  // Isso precisará ser ajustado conforme a configuração real do seu WordPress
  const brandMap = {
    'apple': 'apple',
    'xiaomi': 'xiaomi',
    'samsung': 'samsung',
    'motorola': 'motorola'
  };

  const brandTaxonomy = brandMap[brand] || brand;

  const query = `
    query GetProductsByBrand($brand: String!) {
      products(where: {productBrand: $brand}, first: 24) {
        nodes {
          id
          databaseId
          name
          slug
          price
          regularPrice
          salePrice
          onSale
          featuredImage {
            node {
              sourceUrl
              altText
            }
          }
        }
      }
    }
  `;

  try {
    const response = await fetch(process.env.NEXT_PUBLIC_WORDPRESS_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query,
        variables: { brand: brandTaxonomy },
      }),
    });

    const { data } = await response.json();
    
    if (!data.products || !data.products.nodes) {
      // Se não houver dados reais, retornamos dados simulados para teste
      return getDummyProductsByBrand(brand);
    }
    
    // Formatar produtos
    return data.products.nodes.map(product => ({
      id: product.databaseId,
      name: product.name,
      slug: product.slug,
      price: product.price,
      regular_price: product.regularPrice,
      sale_price: product.salePrice,
      on_sale: product.onSale,
      compare_at_price: product.regularPrice,
      image: product.featuredImage?.node ? {
        src: product.featuredImage.node.sourceUrl,
        alt: product.featuredImage.node.altText || product.name
      } : null
    }));
  } catch (error) {
    console.error(`Erro ao buscar produtos da marca ${brand}:`, error);
    // Em caso de erro, retornamos dados simulados
    return getDummyProductsByBrand(brand);
  }
}

/**
 * Função auxiliar que retorna dados simulados por marca para desenvolvimento
 * Remover quando a integração real com a API estiver completa
 */
function getDummyProductsByBrand(brand) {
  // Base de preços e nomes por marca
  const brandConfig = {
    'apple': {
      namePrefix: 'iPhone',
      priceRange: [5999, 12999],
      models: ['13', '13 Pro', '14', '14 Pro', '14 Pro Max', '15', '15 Pro', '15 Pro Max', 'SE 2022']
    },
    'xiaomi': {
      namePrefix: 'Xiaomi',
      priceRange: [1999, 7999],
      models: ['Redmi Note 13', 'Redmi Note 14', 'POCO X7', 'POCO X7 Pro', '14T', '14T Pro', '15 Ultra', 'Mix Flip', '13T Pro']
    },
    'samsung': {
      namePrefix: 'Samsung',
      priceRange: [1499, 9999],
      models: ['Galaxy A14', 'Galaxy A54', 'Galaxy S23', 'Galaxy S23 Ultra', 'Galaxy S24', 'Galaxy S24 Ultra', 'Galaxy Z Flip 5', 'Galaxy Z Fold 5']
    },
    'motorola': {
      namePrefix: 'Motorola',
      priceRange: [1299, 6999],
      models: ['Moto G54', 'Moto G84', 'Moto Edge 40', 'Moto Edge 40 Pro', 'Moto Edge 50 Pro', 'Moto Razr 40', 'Moto Razr 40 Ultra']
    }
  };

  const config = brandConfig[brand] || brandConfig.xiaomi;
  const count = Math.floor(Math.random() * 5) + 8; // 8 a 12 produtos
  
  return Array.from({ length: count }, (_, i) => {
    const modelName = config.models[i % config.models.length];
    const basePrice = Math.floor(Math.random() * (config.priceRange[1] - config.priceRange[0])) + config.priceRange[0];
    const salePrice = Math.floor(basePrice * 0.9); // 10% de desconto
    
    // Características aleatórias para adicionar diversidade
    const memory = ['128GB', '256GB', '512GB', '1TB'][Math.floor(Math.random() * 4)];
    const ram = ['6GB', '8GB', '12GB'][Math.floor(Math.random() * 3)];
    
    const slug = `${brand}-${modelName.toLowerCase().replace(' ', '-')}-${memory.toLowerCase()}`;
    
    return {
      id: `${brand}-${i}`,
      name: `${config.namePrefix} ${modelName} ${memory}+${ram}`,
      slug: slug,
      price: salePrice,
      regular_price: `R$ ${basePrice.toFixed(2)}`,
      sale_price: `R$ ${salePrice.toFixed(2)}`,
      on_sale: true,
      compare_at_price: basePrice,
      image: {
        src: `https://placehold.co/600x600/3498db/FFFFFF?text=${config.namePrefix}`,
        alt: `${config.namePrefix} ${modelName}`
      }
    };
  });
}

/**
 * Função para buscar produtos da Apple
 * Esta é uma implementação simulada para desenvolvimento
 */
export async function getAppleProducts() {
  // Aqui você implementaria a busca real de produtos da API
  // Por enquanto, retornamos dados simulados
  
  const mockProducts = [
    {
      id: 'apple-1',
      name: 'iPhone 15 Pro Max',
      slug: 'iphone-15-pro-max',
      price: 9999,
      compare_at_price: 11999,
      image: {
        src: 'https://placehold.co/600x600/3498db/FFFFFF?text=iPhone+15',
        alt: 'iPhone 15 Pro Max'
      }
    },
    // ... mais produtos
  ];
  
  return mockProducts;
}

// ...existing code...
