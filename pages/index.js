import React from 'react';
import Layout from '../src/components/Layout';
import Banner from '../src/components/Banner/Banner';
import client from '../src/components/ApolloClient';
import PRODUCTS_AND_CATEGORIES_QUERY from "../src/queries/product-and-categories";
import FeaturedProducts from "../src/components/home/featured-products";
import CategoryGrid from "../src/components/home/category-grid";
import BenefitsBanner from "../src/components/BenefitsBar/BenefitsBanner";
import PromoBanner from "../src/components/home/promo-banner";
import ProductGrid from "../src/components/home/product-grid";
import CountdownOffers from '../src/components/ExclusiveOffers/CountdownOffers';

export default function Home(props) {
  const { products, productCategories } = props || {};

  // Produtos em destaque (primeiros 4 produtos)
  const featuredProducts = products.slice(0, 4);
  // Produtos recentes (próximos 8 produtos)
  const recentProducts = products.slice(4, 12);

  // Benefícios que serão exibidos na seção de benefícios
  const benefits = [
    {
      icon: "fas fa-check-circle",
      title: "Produtos Oficiais",
      description: "Garantia de originalidade"
    },
    {
      icon: "fas fa-truck",
      title: "Frete Grátis",
      description: "Nas compras acima de R$ 200"
    },
    {
      icon: "fas fa-shield-alt",
      title: "Garantia Estendida",
      description: "Em produtos selecionados"
    }
  ];

  return (
    <Layout>
      {/* Banner principal com as imagens webp */}
      <Banner />

      {/* Nova seção de benefícios/selos */}
      <BenefitsBanner benefits={benefits} />

      {/* Garantir que CountdownOffers é renderizado apenas uma vez */}
      <CountdownOffers />

      {/* Conteúdo existente da página */}
      <div className="home-content">
        <h1>Encontre o produto ideal para você</h1>
        <p>O que você está procurando?</p>

        {/* Categorias */}
        <section className="category-section">
          <div className="container">
            <h2 className="section-title">Categorias em Destaque</h2>
            <CategoryGrid categories={productCategories.slice(0, 6)} />
          </div>
        </section>

        {/* Banner promocional */}
        <PromoBanner 
          title="Ofertas Especiais" 
          subtitle="Até 30% de desconto em produtos selecionados"
          buttonText="Ver Ofertas"
          buttonLink="/promocoes"
          backgroundImage="/promo-banner.jpg"
        />

        {/* Produtos em Destaque */}
        <section className="featured-products-section">
          <div className="container">
            <h2 className="section-title">Produtos em Destaque</h2>
            <FeaturedProducts products={featuredProducts} />
          </div>
        </section>

        {/* Novidades */}
        <section className="recent-products-section">
          <div className="container">
            <h2 className="section-title">Últimos Lançamentos</h2>
            <ProductGrid products={recentProducts} />
          </div>
        </section>

        {/* Newsletter */}
        <section className="newsletter-section">
          <div className="container">
            <div className="newsletter-container">
              <div className="newsletter-content">
                <h2 className="newsletter-title">Receba nossas novidades</h2>
                <p className="newsletter-text">Cadastre seu e-mail e receba ofertas exclusivas e lançamentos em primeira mão.</p>
              </div>
              <div className="newsletter-form">
                <input type="email" placeholder="Digite seu e-mail" className="newsletter-input" />
                <button className="newsletter-button">Cadastrar</button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}

export async function getStaticProps() {
  const { data } = await client.query({
    query: PRODUCTS_AND_CATEGORIES_QUERY,
  });

  return {
    props: {
      productCategories: data?.productCategories?.nodes ? data.productCategories.nodes : [],
      products: data?.products?.nodes ? data.products.nodes : [],
    },
    revalidate: 1
  };
}
