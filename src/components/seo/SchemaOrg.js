import React from 'react';
import Head from 'next/head';

/**
 * Schema.org para produtos 
 * 
 * Implementa JSON-LD para produtos, melhorando os dados estruturados para motores de busca
 * https://schema.org/Product
 */
export const ProductSchema = ({ product }) => {
  if (!product) return null;

  // Garantir que temos todos os dados necessários
  const name = product.name || '';
  const description = product.shortDescription?.replace(/(<([^>]+)>)/gi, '') || 
                     product.description?.replace(/(<([^>]+)>)/gi, '') || '';
  const price = product.price || '0.00';
  const regularPrice = product.regularPrice || product.price || '0.00';
  
  // Remover formatações do preço
  const getNumericPrice = (price) => {
    if (!price) return '0.00';
    // Remove R$, espaços e caracteres não numéricos exceto ponto e vírgula
    return price.toString().replace(/[^\d.,]/g, '')
      // Normaliza para formato com ponto como separador decimal
      .replace(/,/g, '.');
  };

  const numericPrice = getNumericPrice(price);
  const availability = (product.stockStatus === 'IN_STOCK' || product.inStock) 
    ? 'https://schema.org/InStock' 
    : 'https://schema.org/OutOfStock';

  // Preparar imagens
  let images = [];
  
  if (product.image?.sourceUrl) {
    images.push(product.image.sourceUrl);
  } else if (product.images && product.images.length > 0) {
    product.images.forEach(img => {
      if (img.src || img.sourceUrl) {
        images.push(img.src || img.sourceUrl);
      }
    });
  } else if (product.galleryImages?.nodes?.length > 0) {
    product.galleryImages.nodes.forEach(img => {
      if (img.sourceUrl) {
        images.push(img.sourceUrl);
      }
    });
  }

  // Garantir URLs absolutas para imagens
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://loja.rotadoscelulares.com';
  images = images.map(img => {
    if (img.startsWith('http')) {
      return img;
    }
    return `${siteUrl}${img}`;
  });

  // Avaliações agregadas
  const hasReviews = product.reviewCount && product.reviewCount > 0 && product.averageRating;
  
  // Construir o objeto de dados estruturados
  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name,
    description,
    image: images,
    sku: product.sku || '',
    mpn: product.sku || '',
    brand: {
      '@type': 'Brand',
      name: product.productCategories?.nodes?.[0]?.name || 'Rota dos Celulares'
    },
    offers: {
      '@type': 'Offer',
      priceCurrency: 'BRL',
      price: numericPrice,
      url: `${siteUrl}/produto/${product.slug}`,
      availability,
      priceValidUntil: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString()
    }
  };

  // Adicionar informações de avaliações agregadas se disponíveis
  if (hasReviews) {
    productSchema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: product.averageRating,
      reviewCount: product.reviewCount
    };
  }

  return (
    <Head>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
    </Head>
  );
};

/**
 * Schema.org para categorias/coleções de produtos
 * 
 * Implementa JSON-LD para categorias de produtos, melhorando a representação nos motores de busca
 * https://schema.org/ItemList ou https://schema.org/CollectionPage
 */
export const CategorySchema = ({ products = [], category = '', description = '' }) => {
  if (!products || products.length === 0) return null;
  
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://loja.rotadoscelulares.com';
  
  // Schema para coleção como ItemList
  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `Produtos ${category}`,
    description: description || `Coleção de produtos ${category} disponíveis para compra`,
    numberOfItems: products.length,
    itemListElement: products.map((product, index) => {
      const productUrl = `${siteUrl}/produto/${product.slug}`;
      
      return {
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'Product',
          name: product.name,
          url: productUrl,
          image: product.image?.sourceUrl || product.images?.[0]?.src || '',
          offers: {
            '@type': 'Offer',
            price: product.price,
            priceCurrency: 'BRL',
            availability: (product.stock_status === 'IN_STOCK' || product.in_stock) 
              ? 'https://schema.org/InStock' 
              : 'https://schema.org/OutOfStock'
          }
        }
      };
    })
  };

  // Schema para a página de categoria
  const collectionPageSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${category} - Coleção de Produtos`,
    description: description || `Navegue pela nossa coleção de produtos ${category}`,
    url: `${siteUrl}/marca/${category.toLowerCase()}`,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: products.length,
      itemListElement: products.map((product, index) => {
        const productUrl = `${siteUrl}/produto/${product.slug}`;
        
        return {
          '@type': 'ListItem',
          position: index + 1,
          url: productUrl
        };
      })
    }
  };

  return (
    <Head>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionPageSchema) }}
      />
    </Head>
  );
};

/**
 * Schema.org para breadcrumbs
 * 
 * Implementa JSON-LD para trilhas de navegação, melhorando a experiência nos resultados de busca
 * https://schema.org/BreadcrumbList
 */
export const BreadcrumbSchema = ({ items = [] }) => {
  if (!items || items.length === 0) return null;
  
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://loja.rotadoscelulares.com';
  
  const itemListElement = items.map((item, index) => {
    // URL absoluta
    const url = item.url.startsWith('http') ? item.url : `${siteUrl}${item.url}`;
    
    return {
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@id': url,
        name: item.name
      }
    };
  });

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement
  };

  return (
    <Head>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
    </Head>
  );
};

/**
 * Schema.org para organização
 * 
 * Implementa JSON-LD para a organização/loja
 * https://schema.org/Organization
 */
export const OrganizationSchema = () => {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://loja.rotadoscelulares.com';
  
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Rota dos Celulares',
    url: siteUrl,
    logo: `${siteUrl}/Custom/Content/Themes/xiaomi/Imagens/logo-rota.png`,
    contactPoint: [
      {
        '@type': 'ContactPoint',
        telephone: '+551140028922',
        contactType: 'customer service',
        areaServed: 'BR',
        availableLanguage: 'Portuguese'
      }
    ],
    sameAs: [
      'https://www.facebook.com/rotadoscelulares',
      'https://www.instagram.com/rotadoscelulares',
      'https://twitter.com/rotadoscelulares'
    ]
  };

  return (
    <Head>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
    </Head>
  );
};