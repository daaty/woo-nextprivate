import React from 'react';
import App from 'next/app';
import { ApolloProvider } from '@apollo/client';
import { client } from '../src/apollo/client';
import '../styles/globals.css';
import '../src/styles/topbar.css'; // Importando os estilos globais da topbar

class MyApp extends App {
  render() {
    const { Component, pageProps } = this.props;

    return (
      <ApolloProvider client={client}>
        <Component {...pageProps} />
      </ApolloProvider>
    );
  }
}

export default MyApp;

