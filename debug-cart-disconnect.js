/**
 * Debug específico para entender a desconexão entre mutation de sucesso e carrinho vazio
 */

const { ApolloClient, InMemoryCache, gql, createHttpLink } = require('@apollo/client');
const fetch = require('cross-fetch');

// Configuração do cliente Apollo
const httpLink = createHttpLink({
  uri: 'https://site.rotadoscelulares.com/graphql',
  fetch: fetch,
});

const client = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'no-cache',
    },
    query: {
      fetchPolicy: 'no-cache',
    },
  },
});

// Query para buscar carrinho
const GET_CART = gql`
  query GET_CART {
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
              onSale
              slug
              averageRating
              reviewCount
              image {
                id
                sourceUrl
                srcSet
                altText
                title
              }
              galleryImages {
                nodes {
                  id
                  sourceUrl
                  srcSet
                  altText
                  title
                }
              }
            }
          }
          variation {
            node {
              id
              databaseId
              name
              description
              type
              onSale
              price
              regularPrice
              salePrice
              image {
                id
                sourceUrl
                srcSet
                altText
                title
              }
            }
          }
          quantity
          total
          subtotal
        }
      }
      appliedCoupons {
        nodes {
          code
          description
          discountAmount
          discountType
        }
      }
      subtotal
      subtotalTax
      shippingTax
      shippingTotal
      total
      totalTax
      feeTax
      feeTotal
      discountTax
      discountTotal
    }
  }
`;

// Mutation para adicionar ao carrinho
const ADD_TO_CART = gql`
  mutation ADD_TO_CART($input: AddToCartInput!) {
    addToCart(input: $input) {
      cartItem {
        key
        product {
          node {
            id
            databaseId
            name
            type
            slug
            description
            shortDescription
            sku
            image {
              id
              sourceUrl
              altText
              title
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
            }
          }
        }
        variation {
          node {
            id
            databaseId
            name
            description
            type
            sku
            price
            regularPrice
            salePrice
            image {
              id
              sourceUrl
              altText
              title
            }
          }
        }
        quantity
        total
        subtotal
      }
      cart {
        contents {
          nodes {
            key
            product {
              node {
                id
                databaseId
                name
              }
            }
            quantity
            total
          }
        }
        total
        subtotal
        totalTax
      }
    }
  }
`;

async function debugCartDisconnect() {
  console.log('🔍 INICIANDO DEBUG DA DESCONEXÃO MUTATION/CARRINHO');
  console.log('='.repeat(60));
  
  try {
    // 1. Verificar estado inicial do carrinho
    console.log('\n1️⃣ VERIFICANDO ESTADO INICIAL DO CARRINHO');
    console.log('-'.repeat(40));
    
    const initialCartResult = await client.query({
      query: GET_CART,
      fetchPolicy: 'no-cache'
    });
    
    console.log('📊 Estado inicial do carrinho:');
    console.log('- Dados brutos:', JSON.stringify(initialCartResult.data, null, 2));
    
    if (initialCartResult.data?.cart?.contents?.nodes) {
      console.log(`- Quantidade de itens: ${initialCartResult.data.cart.contents.nodes.length}`);
      console.log('- Total do carrinho:', initialCartResult.data.cart?.total || 'N/A');
    } else {
      console.log('❌ Carrinho vazio ou estrutura inválida');
    }
    
    // 2. Executar mutation de adição
    console.log('\n2️⃣ EXECUTANDO MUTATION DE ADIÇÃO');
    console.log('-'.repeat(40));
    
    const mutationInput = {
      clientMutationId: `debug_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      productId: 137, // iPhone 11 64 Gb's Branco
      quantity: 1
    };
    
    console.log('📤 Input da mutation:', JSON.stringify(mutationInput, null, 2));
    
    const addResult = await client.mutate({
      mutation: ADD_TO_CART,
      variables: {
        input: mutationInput
      }
    });
    
    console.log('\n📨 RESPOSTA DA MUTATION:');
    console.log('- Dados completos:', JSON.stringify(addResult.data, null, 2));
    
    if (addResult.data?.addToCart?.cartItem) {
      const cartItem = addResult.data.addToCart.cartItem;
      console.log('✅ CartItem criado:');
      console.log(`  - Key: ${cartItem.key}`);
      console.log(`  - Produto: ${cartItem.product?.node?.name} (ID: ${cartItem.product?.node?.databaseId})`);
      console.log(`  - Quantidade: ${cartItem.quantity}`);
      console.log(`  - Total: ${cartItem.total}`);
    }
    
    if (addResult.data?.addToCart?.cart) {
      const cartInResponse = addResult.data.addToCart.cart;
      console.log('📦 Carrinho na resposta da mutation:');
      console.log(`  - Total: ${cartInResponse.total}`);
      console.log(`  - Subtotal: ${cartInResponse.subtotal}`);
      console.log(`  - Itens: ${cartInResponse.contents?.nodes?.length || 0}`);
      
      if (cartInResponse.contents?.nodes?.length > 0) {
        cartInResponse.contents.nodes.forEach((item, index) => {
          console.log(`    ${index + 1}. ${item.product?.node?.name} (Qty: ${item.quantity})`);
        });
      }
    }
    
    // 3. Aguardar um pouco e verificar carrinho novamente
    console.log('\n3️⃣ AGUARDANDO E VERIFICANDO CARRINHO NOVAMENTE');
    console.log('-'.repeat(40));
    
    await new Promise(resolve => setTimeout(resolve, 1000)); // Aguardar 1 segundo
    
    const finalCartResult = await client.query({
      query: GET_CART,
      fetchPolicy: 'no-cache'
    });
    
    console.log('📊 Estado final do carrinho:');
    console.log('- Dados brutos:', JSON.stringify(finalCartResult.data, null, 2));
    
    if (finalCartResult.data?.cart?.contents?.nodes) {
      console.log(`- Quantidade de itens: ${finalCartResult.data.cart.contents.nodes.length}`);
      console.log('- Total do carrinho:', finalCartResult.data.cart?.total || 'N/A');
      
      if (finalCartResult.data.cart.contents.nodes.length > 0) {
        console.log('- Itens no carrinho:');
        finalCartResult.data.cart.contents.nodes.forEach((item, index) => {
          console.log(`  ${index + 1}. ${item.product?.node?.name} (Key: ${item.key}, Qty: ${item.quantity})`);
        });
      }
    } else {
      console.log('❌ Carrinho ainda vazio após mutation');
    }
    
    // 4. Análise da discrepância
    console.log('\n4️⃣ ANÁLISE DA DISCREPÂNCIA');
    console.log('-'.repeat(40));
    
    const mutationHadItems = addResult.data?.addToCart?.cart?.contents?.nodes?.length > 0;
    const finalQueryHasItems = finalCartResult.data?.cart?.contents?.nodes?.length > 0;
    
    console.log(`🔍 Mutation retornou itens no carrinho: ${mutationHadItems ? '✅ SIM' : '❌ NÃO'}`);
    console.log(`🔍 Query final encontrou itens no carrinho: ${finalQueryHasItems ? '✅ SIM' : '❌ NÃO'}`);
    
    if (mutationHadItems && !finalQueryHasItems) {
      console.log('\n🚨 PROBLEMA IDENTIFICADO:');
      console.log('- A mutation adiciona o produto com sucesso');
      console.log('- Mas o carrinho fica vazio na query seguinte');
      console.log('- Possíveis causas:');
      console.log('  1. Problema de sessão/cookies');
      console.log('  2. Cache do Apollo Client');
      console.log('  3. Configuração do WooCommerce');
      console.log('  4. Problema no backend WordPress');
    } else if (!mutationHadItems) {
      console.log('\n🚨 PROBLEMA NA MUTATION:');
      console.log('- A mutation não está retornando o carrinho atualizado');
    } else if (finalQueryHasItems) {
      console.log('\n✅ FUNCIONANDO CORRETAMENTE:');
      console.log('- Produto foi adicionado e permaneceu no carrinho');
    }
    
    // 5. Verificar headers e cookies
    console.log('\n5️⃣ VERIFICANDO INFORMAÇÕES DE SESSÃO');
    console.log('-'.repeat(40));
    
    // Tentar detectar cookies ou headers de sessão
    const headers = addResult.response?.http?.headers;
    if (headers) {
      console.log('📝 Headers da resposta da mutation:');
      console.log(headers);
    } else {
      console.log('ℹ️  Headers não disponíveis na resposta');
    }
    
  } catch (error) {
    console.error('\n❌ ERRO DURANTE O DEBUG:', error);
    console.error('- Mensagem:', error.message);
    if (error.graphQLErrors?.length > 0) {
      console.error('- Erros GraphQL:', error.graphQLErrors);
    }
    if (error.networkError) {
      console.error('- Erro de rede:', error.networkError);
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('🏁 DEBUG CONCLUÍDO');
}

// Executar debug
debugCartDisconnect()
  .then(() => {
    console.log('\n✅ Debug executado com sucesso');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erro no debug:', error);
    process.exit(1);
  });
