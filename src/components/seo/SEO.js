import Head from 'next/head';
import { useRouter } from 'next/router';

const SEO = ({
  title = 'Rota dos Celulares - Smartphones e acessórios',
  description = 'Compre smartphones, acessórios e produtos tecnológicos com os melhores preços. Frete grátis para MT em compras acima de R$1.000. Parcele no cartão em até 12x.',
  image = '/banners/seo-default-image.jpg', // Imagem padrão para compartilhamento
  keywords = 'celulares, smartphones, acessórios, fones de ouvido, carregadores, Apple, Samsung, Xiaomi, Motorola, Nova Canaã do Norte MT',
  canonical,
  type = 'website',
  author = 'Rota dos Celulares',
  publishedTime,
  modifiedTime,
  price,
  currency = 'BRL',
  availability = 'in stock',
  brand = 'Rota dos Celulares',
  category,
  sku,
  children
}) => {
  const router = useRouter();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://loja.rotadoscelulares.com';
  const currentUrl = canonical || `${siteUrl}${router.asPath}`;
  const formattedTitle = title.includes('Rota dos Celulares') ? title : `${title} | Rota dos Celulares`;
  
  // Garantir que a URL da imagem seja absoluta
  const formattedImage = image.startsWith('http') ? image : `${siteUrl}${image}`;

  return (
    <Head>
      {/* Meta tags básicas */}
      <title>{formattedTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="author" content={author} />
      <meta name="robots" content="index, follow" />
      <meta name="language" content="pt-BR" />
      <meta name="geo.region" content="BR-MT" />
      <meta name="geo.placename" content="Nova Canaã do Norte" />
      <meta name="geo.position" content="-10.797734;-55.195813" />
      <meta name="ICBM" content="-10.797734, -55.195813" />
      <link rel="canonical" href={currentUrl} />
      
      {/* Open Graph / Facebook */}
      <meta property="og:url" content={currentUrl} />
      <meta property="og:title" content={formattedTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={formattedImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={title} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content="Rota dos Celulares" />
      <meta property="og:locale" content="pt_BR" />
      {publishedTime && <meta property="article:published_time" content={publishedTime} />}
      {modifiedTime && <meta property="article:modified_time" content={modifiedTime} />}
      {author && <meta property="article:author" content={author} />}
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@rotadoscelulares66" />
      <meta name="twitter:creator" content="@rotadoscelulares66" />
      <meta name="twitter:title" content={formattedTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={formattedImage} />
      <meta name="twitter:image:alt" content={title} />
      
      {/* Schema.org para produtos (se aplicável) */}
      {type === 'product' && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org/",
              "@type": "Product",
              name: title,
              description: description,
              image: formattedImage,
              brand: {
                "@type": "Brand",
                name: brand
              },
              offers: {
                "@type": "Offer",
                url: currentUrl,
                priceCurrency: currency,
                price: price,
                availability: `https://schema.org/${availability.replace(' ', '')}`,
                seller: {
                  "@type": "Organization",
                  name: "Rota dos Celulares"
                }
              },
              ...(category && { category: category }),
              ...(sku && { sku: sku })
            })
          }}
        />
      )}
      
      {/* Schema.org para organização */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            name: "Rota dos Celulares",
            url: siteUrl,
            logo: `${siteUrl}/logo.png`,
            description: "Loja especializada em smartphones e acessórios em Nova Canaã do Norte - MT",
            address: {
              "@type": "PostalAddress",
              streetAddress: "Avenida Brasil 89 A",
              addressLocality: "Nova Canaã do Norte",
              addressRegion: "MT",
              postalCode: "78515-000",
              addressCountry: "BR"
            },
            contactPoint: {
              "@type": "ContactPoint",
              telephone: "+55-66-99602-5589",
              contactType: "customer service",
              availableLanguage: "Portuguese"
            },
            openingHours: [
              "Mo-Fr 07:00-19:00",
              "Sa 07:00-17:00"
            ],
            sameAs: [
              "https://www.instagram.com/rotadoscelulares66",
              "https://www.facebook.com/profile.php?id=61551387841024",
              "https://www.tiktok.com/@rotadoscelulares66"
            ]
          })
        }}
      />
      
      {/* Schema.org para site */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: "Rota dos Celulares",
            url: siteUrl,
            description: description,
            publisher: {
              "@type": "Organization",
              name: "Rota dos Celulares"
            },
            potentialAction: {
              "@type": "SearchAction",
              target: `${siteUrl}/pesquisa?q={search_term_string}`,
              "query-input": "required name=search_term_string"
            }
          })
        }}
      />
      
      {/* Meta tags para mobile */}
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0" />
      <meta name="format-detection" content="telephone=yes" />
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      <meta name="apple-mobile-web-app-title" content="Rota dos Celulares" />
      
      {/* DNS Prefetch para performance */}
      <link rel="dns-prefetch" href="//fonts.googleapis.com" />
      <link rel="dns-prefetch" href="//cdnjs.cloudflare.com" />
      <link rel="dns-prefetch" href="//www.google-analytics.com" />
      
      {/* Permitir meta tags adicionais específicas da página */}
      {children}
    </Head>
  );
};

export default SEO;