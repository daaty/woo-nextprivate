import Head from 'next/head';
import { useRouter } from 'next/router';

const SEO = ({
  title = 'Rota dos Celulares - Smartphones e acessórios',
  description = 'Compre smartphones, acessórios e produtos tecnológicos com os melhores preços. Frete grátis para todo Brasil em compras acima de R$199',
  image = '/banners/seo-default-image.jpg', // Imagem padrão para compartilhamento
  keywords = 'celulares, smartphones, acessórios, fones de ouvido, carregadores',
  canonical,
  type = 'website',
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
      <link rel="canonical" href={currentUrl} />
      
      {/* Open Graph / Facebook */}
      <meta property="og:url" content={currentUrl} />
      <meta property="og:title" content={formattedTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={formattedImage} />
      <meta property="og:type" content={type} />
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={formattedTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={formattedImage} />
      
      {/* Permitir meta tags adicionais específicas da página */}
      {children}
    </Head>
  );
};

export default SEO;