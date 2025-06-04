/**
 * Debug GraphQL Flow - Investigação completa do fluxo GraphQL
 * 
 * Este script testa todo o fluxo de adicionar produto e recuperar carrinho
 * para identificar onde está ocorrendo a desconexão de dados.
 */

import { ApolloClient, InMemoryCache, gql } from '@apollo/client';

// Configuração do cliente Apollo (replica a configuração do projeto)
const client = new ApolloClient({
  uri: process.env.NEXT_PUBLIC_WORDPRESS_URL + '/graphql' || 'http://localhost/woo-next-be/graphql',
  cache: new InMemoryCache(),
  credentials: 'include', // Importante para manter sessão/cookies
});

// Query completa do carrinho
const GET_CART_COMPLETE = gql`
  query GET_CART_DEBUG {
    cart {
      contents {
        nodes {
          key
          product {
            node {
              id
              databaseId
              name
              type
            }
          }
          quantity
          total
        }
        itemCount
        productCount
      }
      total
      subtotal
      isEmpty
    }
  }
`;

// Mutation simplificada para teste
const ADD_TO_CART_DEBUG = gql`
  mutation ADD_TO_CART_DEBUG($input: AddToCartInput!) {
    addToCart(input: $input) {
      clientMutationId
      cartItem {
        key
        quantity
        product {
          node {
            id
            databaseId
            name
          }
        }
      }
      cart {
        contents {
          nodes {
            key
            quantity
            product {
              node {
                id
                name
              }
            }
          }
          itemCount
          productCount
        }
        total
        isEmpty
      }
    }
  }
`;

async function debugCartFlow() {
  console.log('🔍 INICIANDO DEBUG DO FLUXO GRAPHQL DO CARRINHO');
  console.log('='.repeat(60));

  try {
    // 1. Estado inicial do carrinho
    console.log('\n1️⃣ VERIFICANDO ESTADO INICIAL DO CARRINHO...');
    const initialCart = await client.query({
      query: GET_CART_COMPLETE,
      fetchPolicy: 'network-only',
    });
    
    console.log('📋 Estado inicial do carrinho:');
    console.log('- isEmpty:', initialCart.data.cart?.isEmpty);
    console.log('- itemCount:', initialCart.data.cart?.contents?.itemCount);
    console.log('- productCount:', initialCart.data.cart?.contents?.productCount);
    console.log('- nodes length:', initialCart.data.cart?.contents?.nodes?.length || 0);
    console.log('- total:', initialCart.data.cart?.total);

    // 2. Tentativa de adicionar produto
    console.log('\n2️⃣ ADICIONANDO PRODUTO AO CARRINHO...');
    const addResult = await client.mutate({
      mutation: ADD_TO_CART_DEBUG,
      variables: {
        input: {
          productId: 1, // ID de teste - ajuste conforme necessário
          quantity: 1,
        },
      },
    });

    console.log('✅ Resultado da adição:');
    console.log('- clientMutationId:', addResult.data.addToCart?.clientMutationId);
    console.log('- cartItem criado:', !!addResult.data.addToCart?.cartItem);
    if (addResult.data.addToCart?.cartItem) {
      console.log('  - key:', addResult.data.addToCart.cartItem.key);
      console.log('  - quantity:', addResult.data.addToCart.cartItem.quantity);
      console.log('  - produto:', addResult.data.addToCart.cartItem.product?.node?.name);
    }

    console.log('- Estado do carrinho após adição:');
    console.log('  - isEmpty:', addResult.data.addToCart?.cart?.isEmpty);
    console.log('  - itemCount:', addResult.data.addToCart?.cart?.contents?.itemCount);
    console.log('  - productCount:', addResult.data.addToCart?.cart?.contents?.productCount);
    console.log('  - nodes length:', addResult.data.addToCart?.cart?.contents?.nodes?.length || 0);
    console.log('  - total:', addResult.data.addToCart?.cart?.total);

    // 3. Verificação imediata após adição
    console.log('\n3️⃣ VERIFICANDO CARRINHO IMEDIATAMENTE APÓS ADIÇÃO...');
    const immediateCart = await client.query({
      query: GET_CART_COMPLETE,
      fetchPolicy: 'network-only',
    });
    
    console.log('📋 Estado imediato do carrinho:');
    console.log('- isEmpty:', immediateCart.data.cart?.isEmpty);
    console.log('- itemCount:', immediateCart.data.cart?.contents?.itemCount);
    console.log('- productCount:', immediateCart.data.cart?.contents?.productCount);
    console.log('- nodes length:', immediateCart.data.cart?.contents?.nodes?.length || 0);
    console.log('- total:', immediateCart.data.cart?.total);

    if (immediateCart.data.cart?.contents?.nodes?.length > 0) {
      console.log('\n📦 ITENS ENCONTRADOS:');
      immediateCart.data.cart.contents.nodes.forEach((item, index) => {
        console.log(`  ${index + 1}. ${item.product?.node?.name} (qty: ${item.quantity}, key: ${item.key})`);
      });
    }

    // 4. Aguardar um pouco e verificar novamente
    console.log('\n4️⃣ AGUARDANDO 2 SEGUNDOS E VERIFICANDO NOVAMENTE...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const delayedCart = await client.query({
      query: GET_CART_COMPLETE,
      fetchPolicy: 'network-only',
    });
    
    console.log('📋 Estado após delay:');
    console.log('- isEmpty:', delayedCart.data.cart?.isEmpty);
    console.log('- itemCount:', delayedCart.data.cart?.contents?.itemCount);
    console.log('- nodes length:', delayedCart.data.cart?.contents?.nodes?.length || 0);

    // 5. Comparação de resultados
    console.log('\n5️⃣ ANÁLISE COMPARATIVA:');
    const initialCount = initialCart.data.cart?.contents?.itemCount || 0;
    const afterAddCount = addResult.data.addToCart?.cart?.contents?.itemCount || 0;
    const immediateCount = immediateCart.data.cart?.contents?.itemCount || 0;
    const delayedCount = delayedCart.data.cart?.contents?.itemCount || 0;

    console.log(`- Inicial: ${initialCount} items`);
    console.log(`- Após mutação: ${afterAddCount} items`);
    console.log(`- Verificação imediata: ${immediateCount} items`);
    console.log(`- Verificação com delay: ${delayedCount} items`);

    if (afterAddCount > initialCount && immediateCount === initialCount) {
      console.log('\n🚨 PROBLEMA IDENTIFICADO: Mutação retorna sucesso mas query subsequente não mostra mudanças!');
      console.log('   Possíveis causas:');
      console.log('   - Problema de sessão/cookies');
      console.log('   - Cache do Apollo não sincronizado');
      console.log('   - Servidor não persistindo mudanças');
      console.log('   - Contexto de usuário diferente');
    }

  } catch (error) {
    console.error('❌ ERRO NO DEBUG:', error);
    if (error.graphQLErrors) {
      console.error('GraphQL Errors:', error.graphQLErrors);
    }
    if (error.networkError) {
      console.error('Network Error:', error.networkError);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('🏁 DEBUG CONCLUÍDO');
}

// Executar debug se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  debugCartFlow().then(() => {
    console.log('\n✨ Debug completo. Verifique os resultados acima.');
    process.exit(0);
  }).catch(error => {
    console.error('💥 Erro fatal no debug:', error);
    process.exit(1);
  });
}

export { debugCartFlow, GET_CART_COMPLETE, ADD_TO_CART_DEBUG };
