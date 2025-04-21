import React from 'react';
import Layout from '../components/Layout';
import Banner from '../components/Banner/Banner';
// Importe outros componentes necessários como ProductList, etc.

const Home = () => {
  return (
    <Layout>
      <Banner />
      
      {/* Conteúdo da página inicial - por exemplo: */}
      <h1>Produtos em Destaque</h1>
      {/* Adicione aqui seus componentes de listagem de produtos do WooCommerce */}
      
      {/* Outras seções da página inicial */}
    </Layout>
  );
};

export default Home;
