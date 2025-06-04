const { ApolloClient, InMemoryCache, gql, createHttpLink } = require('@apollo/client');
const fetch = require('cross-fetch');

// Configurar Apollo Client
const httpLink = createHttpLink({
  uri: 'https://rota.rotadoscelulares.com/graphql',
  fetch: fetch,
  credentials: 'include'
});

const client = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      errorPolicy: 'all'
    },
    query: {
      errorPolicy: 'all'
    }
  }
});

// Query para buscar carrinho
const GET_CART = gql`
  query GetCart {
    cart {
      contents {
        nodes {
          key
          product {
            node {
              id
              databaseId
              name
              ... on SimpleProduct {
                price
              }
            }
          }
          quantity
          total
        }
      }
      total
      subtotal
      totalTax
      shippingTotal
      shippingTax
      discountTotal
      discountTax
      appliedCoupons {
        code
        discountAmount
      }
    }
  }
`;

// Mutation para adicionar ao carrinho
const ADD_TO_CART = gql`
  mutation AddToCart($clientMutationId: String!, $productId: Int!, $quantity: Int) {
    addToCart(
      input: {
        clientMutationId: $clientMutationId
        productId: $productId
        quantity: $quantity
      }
    ) {
      clientMutationId
      cartItem {
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
      cart {
        contents {
          nodes {
            key
            product {
              node {
                id
                databaseId
                name
                ... on SimpleProduct {
                  price
                }
              }
            }
            quantity
            total
          }
        }
        total
        subtotal
        totalTax
        shippingTotal
        shippingTax
        discountTotal
        discountTax
      }
    }
  }
`;

// Mutation para limpar carrinho
const CLEAR_CART = gql`
  mutation ClearCart($clientMutationId: String!) {
    removeItemsFromCart(
      input: {
        clientMutationId: $clientMutationId
        all: true
      }
    ) {
      clientMutationId
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
      }
    }
  }
`;

async function testMultipleProducts() {
  console.log('🧪 TESTE: Adicionando múltiplos produtos ao carrinho');
  console.log('=' * 60);

  try {
    // 1. Limpar carrinho primeiro
    console.log('\n1️⃣ Limpando carrinho...');
    try {
      const clearResult = await client.mutate({
        mutation: CLEAR_CART,
        variables: {
          clientMutationId: `clear_cart_${Date.now()}_test`
        }
      });
      console.log('✅ Carrinho limpo');
    } catch (clearError) {
      console.log('⚠️ Erro ao limpar carrinho (pode estar vazio):', clearError.message);
    }

    // 2. Verificar carrinho vazio
    console.log('\n2️⃣ Verificando carrinho vazio...');
    const emptyCart = await client.query({
      query: GET_CART,
      fetchPolicy: 'network-only'
    });
    console.log('Itens no carrinho vazio:', emptyCart.data.cart?.contents?.nodes?.length || 0);

    // 3. Adicionar primeiro produto (ID: 137)
    console.log('\n3️⃣ Adicionando primeiro produto (ID: 137)...');
    const firstAdd = await client.mutate({
      mutation: ADD_TO_CART,
      variables: {
        clientMutationId: `add_to_cart_${Date.now()}_137`,
        productId: 137,
        quantity: 1
      }
    });

    const firstCartItems = firstAdd.data.addToCart.cart.contents.nodes;
    console.log('✅ Primeiro produto adicionado');    console.log('📦 Itens no carrinho:', firstCartItems.length);
    console.log('🏷️ Produtos:', firstCartItems.map(item => ({
      id: item.product.node.databaseId,
      name: item.product.node.name,
      qty: item.quantity,
      total: item.total
    })));
    console.log('💰 Total do carrinho:', firstAdd.data.addToCart.cart.total);

    // 4. Verificar carrinho via query separada
    console.log('\n4️⃣ Verificando carrinho via query separada...');
    const cartAfterFirst = await client.query({
      query: GET_CART,
      fetchPolicy: 'network-only'
    });
    const itemsAfterFirst = cartAfterFirst.data.cart?.contents?.nodes || [];    console.log('📦 Itens via query:', itemsAfterFirst.length);
    console.log('🏷️ Produtos via query:', itemsAfterFirst.map(item => ({
      id: item.product.node.databaseId,
      name: item.product.node.name,
      qty: item.quantity,
      total: item.total
    })));

    // 5. Adicionar segundo produto (ID: 117)
    console.log('\n5️⃣ Adicionando segundo produto (ID: 117)...');
    const secondAdd = await client.mutate({
      mutation: ADD_TO_CART,
      variables: {
        clientMutationId: `add_to_cart_${Date.now()}_117`,
        productId: 117,
        quantity: 1
      }
    });

    const secondCartItems = secondAdd.data.addToCart.cart.contents.nodes;
    console.log('✅ Segundo produto adicionado');    console.log('📦 Itens no carrinho:', secondCartItems.length);
    console.log('🏷️ Produtos:', secondCartItems.map(item => ({
      id: item.product.node.databaseId,
      name: item.product.node.name,
      qty: item.quantity,
      total: item.total
    })));
    console.log('💰 Total do carrinho:', secondAdd.data.addToCart.cart.total);

    // 6. Verificar carrinho final via query separada
    console.log('\n6️⃣ Verificando carrinho final via query separada...');
    const finalCart = await client.query({
      query: GET_CART,
      fetchPolicy: 'network-only'
    });
    const finalItems = finalCart.data.cart?.contents?.nodes || [];    console.log('📦 Itens finais via query:', finalItems.length);
    console.log('🏷️ Produtos finais via query:', finalItems.map(item => ({
      id: item.product.node.databaseId,
      name: item.product.node.name,
      qty: item.quantity,
      total: item.total
    })));
    console.log('💰 Total final via query:', finalCart.data.cart?.total);

    // 7. Análise do problema
    console.log('\n📊 ANÁLISE DO PROBLEMA:');
    console.log('=' * 40);
    
    if (secondCartItems.length === 2) {
      console.log('✅ SUCESSO: Carrinho acumula produtos corretamente');
    } else if (secondCartItems.length === 1) {
      console.log('❌ PROBLEMA: Carrinho substitui produto ao invés de acumular');
      console.log('🔍 Produto final:', secondCartItems[0].product.node.name);
    } else {
      console.log('⚠️ COMPORTAMENTO INESPERADO: Quantidade de itens:', secondCartItems.length);
    }

    if (finalItems.length !== secondCartItems.length) {
      console.log('❌ INCONSISTÊNCIA: Query separada retorna dados diferentes da mutation');
      console.log(`   Mutation: ${secondCartItems.length} itens`);
      console.log(`   Query: ${finalItems.length} itens`);
    }

  } catch (error) {
    console.error('❌ Erro no teste:', error);
    if (error.graphQLErrors) {
      error.graphQLErrors.forEach(err => {
        console.error('GraphQL Error:', err.message);
      });
    }
    if (error.networkError) {
      console.error('Network Error:', error.networkError);
    }
  }
}

// Executar teste
testMultipleProducts()
  .then(() => {
    console.log('\n🏁 Teste concluído!');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Erro crítico:', error);
    process.exit(1);
  });
