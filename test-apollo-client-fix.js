#!/usr/bin/env node

/**
 * Teste para verificar se a correção do Apollo Client resolveu os problemas do carrinho
 * Este script testa:
 * 1. Se o cliente Apollo correto está sendo usado (com middleware/afterware)
 * 2. Se a sessão do WooCommerce está sendo gerenciada corretamente
 * 3. Se o carrinho mantém os produtos após adicionar
 */

import dotenv from 'dotenv';
import client from './src/components/ApolloClient.js';
import { gql } from '@apollo/client';

// Carregar variáveis de ambiente
dotenv.config({ path: '.env.local' });

console.log('🧪 TESTE: Correção do Apollo Client para carrinho');
console.log('=' .repeat(60));

// Query para obter o carrinho
const GET_CART = gql`
  query GetCart {
    cart {
      isEmpty
      total
      totalQuantity
      subtotal
      contents {
        nodes {
          key
          product {
            node {
              id
              name
              slug
            }
          }
          quantity
        }
      }
    }
  }
`;

// Mutation para adicionar ao carrinho
const ADD_TO_CART = gql`
  mutation AddToCart($productId: Int!, $quantity: Int!) {
    addToCart(input: { productId: $productId, quantity: $quantity }) {
      cart {
        isEmpty
        total
        totalQuantity
        subtotal
        contents {
          nodes {
            key
            product {
              node {
                id
                name
                slug
              }
            }
            quantity
          }
        }
      }
    }
  }
`;

async function testApolloClientFix() {
  try {
    console.log('📋 Verificando cliente Apollo...');
    
    // Verificar se o cliente tem os links corretos
    const hasMiddleware = client.link.toString().includes('middleware') || 
                         client.link.request.toString().includes('session') ||
                         client.link.request.toString().includes('woocommerce-session');
    
    console.log(`✅ Cliente Apollo carregado:`, !!client);
    console.log(`🔗 Middleware de sessão detectado:`, hasMiddleware);
    
    // Testar query inicial do carrinho
    console.log('\n🛒 Testando query inicial do carrinho...');
    const initialCart = await client.query({
      query: GET_CART,
      fetchPolicy: 'network-only'
    });
    
    console.log('📊 Carrinho inicial:', {
      isEmpty: initialCart.data.cart?.isEmpty,
      totalQuantity: initialCart.data.cart?.totalQuantity,
      total: initialCart.data.cart?.total,
      items: initialCart.data.cart?.contents?.nodes?.length || 0
    });
    
    // Verificar se temos uma sessão no localStorage
    const hasSessionBefore = typeof window !== 'undefined' && 
                            localStorage.getItem('woo-session');
    console.log('🔐 Sessão WooCommerce antes:', hasSessionBefore ? 'Sim' : 'Não');
    
    // Testar adicionar produto ao carrinho
    console.log('\n➕ Testando adição de produto...');
    const addResult = await client.mutate({
      mutation: ADD_TO_CART,
      variables: {
        productId: 2998, // ID de produto válido
        quantity: 1
      },
      fetchPolicy: 'no-cache'
    });
    
    console.log('📊 Resultado da adição:', {
      success: !!addResult.data?.addToCart?.cart,
      isEmpty: addResult.data?.addToCart?.cart?.isEmpty,
      totalQuantity: addResult.data?.addToCart?.cart?.totalQuantity,
      total: addResult.data?.addToCart?.cart?.total,
      items: addResult.data?.addToCart?.cart?.contents?.nodes?.length || 0
    });
    
    // Verificar se a sessão foi criada/atualizada
    const hasSessionAfter = typeof window !== 'undefined' && 
                           localStorage.getItem('woo-session');
    console.log('🔐 Sessão WooCommerce depois:', hasSessionAfter ? 'Sim' : 'Não');
    
    // Fazer nova query para verificar se o carrinho foi persistido
    console.log('\n🔄 Verificando persistência do carrinho...');
    const finalCart = await client.query({
      query: GET_CART,
      fetchPolicy: 'network-only'
    });
    
    console.log('📊 Carrinho final:', {
      isEmpty: finalCart.data.cart?.isEmpty,
      totalQuantity: finalCart.data.cart?.totalQuantity,
      total: finalCart.data.cart?.total,
      items: finalCart.data.cart?.contents?.nodes?.length || 0
    });
    
    // Verificar se o produto foi realmente adicionado
    const productAdded = finalCart.data.cart?.contents?.nodes?.some(
      node => node.product?.node?.id === '2998'
    );
    
    console.log('\n🎯 RESULTADO DO TESTE:');
    console.log('=' .repeat(40));
    
    if (productAdded && !finalCart.data.cart?.isEmpty) {
      console.log('✅ SUCESSO: Carrinho funcionando corretamente!');
      console.log('✅ Produto foi adicionado e persistido');
      console.log('✅ Apollo Client com sessão está funcionando');
    } else {
      console.log('❌ FALHA: Carrinho ainda não está funcionando');
      console.log('❌ Produto não foi persistido no carrinho');
      
      // Diagnosticar o problema
      if (!hasMiddleware) {
        console.log('💡 Problema: Middleware de sessão não detectado');
      }
      if (!hasSessionAfter) {
        console.log('💡 Problema: Sessão WooCommerce não foi criada');
      }
    }
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error.message);
    console.error('🔍 Detalhes do erro:', error);
  }
}

// Executar o teste apenas se este arquivo for executado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  testApolloClientFix();
}

export { testApolloClientFix };
