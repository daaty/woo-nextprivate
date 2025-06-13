import React, { useEffect } from 'react';
import Layout from "../src/components/Layout";
import client from "../src/components/ApolloClient";
import { PRODUCTS_AND_CATEGORIES_QUERY } from "../src/queries/product-and-categories";
import HeroCarousel from "../src/components/home/hero-carousel";
import CountdownOffers from "../src/components/ExclusiveOffers/CountdownOffers";
import FeaturedProducts from "../src/components/FeaturedProducts/FeaturedProducts";
import SEO from "../src/components/seo/SEO";

// Importando os novos componentes
import SectionContainer from "../src/components/layout/SectionContainer";
import BrandBanner from "../src/components/home/BrandBanner";
import WhyChooseUs from "../src/components/home/WhyChooseUs";
import NewsletterBanner from "../src/components/home/NewsletterBanner";

export default function Home(props) {
  const { products, productCategories } = props || {};
  
  // Dados de exemplo para o banner da Apple
  const appleBrand = {
    name: "Apple",
    slug: "apple",
    logoUrl: "/Custom/Content/Themes/xiaomi/Imagens/apple-logo-white.png",
    imageUrl: "/Custom/Content/Themes/xiaomi/Imagens/apple-products.png",
    videoUrl: "/videos/apple-products-showcase.mp4", // URL do vídeo dos produtos Apple
    title: "Produtos Apple Premium",
    description: "Descubra nossa seleção exclusiva de produtos Apple, incluindo iPhones, iPads, MacBooks e acessórios premium."
  };

  // NOVO: Adicionar no useEffect ou no final do componente
  useEffect(() => {
    // Importar e inicializar os botões da homepage
    import('../src/components/cart/AddToCartButton').then(({ initializeHomepageButtons }) => {
        initializeHomepageButtons();
    });
  }, []);

  return (
    <Layout>
      {/* SEO com meta tags Open Graph */}
      <SEO 
        title="Rota dos Celulares - Smartphones e Acessórios com os Melhores Preços"
        description="Compre smartphones, fones de ouvido, carregadores e acessórios com os melhores preços. Frete grátis para MT em compras acima de R$1.000. Parcele no cartão em até 12x."
        image="/banners/home-banner.jpg"
        type="website"
      />
      
      {/* Banner Carousel principal */}
      <HeroCarousel />
      
      {/* Ofertas Exclusivas */}
      <CountdownOffers />
      
      {/* Produtos em Destaque - Usando o componente com layout visual renovado */}
      <FeaturedProducts />
      
      {/* Banner de categoria Apple */}
      <SectionContainer noPadding>
        <BrandBanner brand={appleBrand} />
      </SectionContainer>
      
      {/* Seção Por que Comprar Conosco */}
      <WhyChooseUs />
      
      {/* Banner de Newsletter */}
      <SectionContainer noPadding>
        <NewsletterBanner />
      </SectionContainer>
    </Layout>
  );
}

export async function getStaticProps() {
  try {
    const { data } = await client.query({
      query: PRODUCTS_AND_CATEGORIES_QUERY,
    });

    return {
      props: {
        productCategories: data?.productCategories?.nodes || [],
        products: data?.products?.nodes || [],
      },
      revalidate: 10,
    };
  } catch (error) {
    console.error("Erro ao buscar dados:", error);
    // Mesmo com erro, retornamos arrays vazios em vez de mockdata
    return {
      props: {
        productCategories: [],
        products: [],
      },
      revalidate: 10,
    };
  }
}
