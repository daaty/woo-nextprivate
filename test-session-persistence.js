const { ApolloClient, InMemoryCache, gql, createHttpLink, ApolloLink } = require('@apollo/client');
const fetch = require('cross-fetch');

// Simular localStorage (para Node.js)
const localStorage = {
  storage: {},
  getItem: function(key) {
    return this.storage[key] || null;
  },
  setItem: function(key, value) {
    this.storage[key] = value;
    console.log(`📦 [localStorage] Salvando ${key}: ${value}`);
  },
  removeItem: function(key) {
    delete this.storage[key];
    console.log(`🗑️ [localStorage] Removendo ${key}`);
  }
};

// Middleware para adicionar session header
const middleware = new ApolloLink((operation, forward) => {
  const session = localStorage.getItem("woo-session");
  console.log(`🔍 [Middleware] Verificando sessão: ${session || 'NENHUMA'}`);

  if (session) {
    operation.setContext(({ headers = {} }) => ({
      headers: {
        ...headers,
        "woocommerce-session": `Session ${session}`
      }
    }));
    console.log(`📤 [Middleware] Header adicionado: woocommerce-session = Session ${session}`);
  }

  return forward(operation);
});

// Afterware para capturar session header
const afterware = new ApolloLink((operation, forward) => {
  return forward(operation).map(response => {
    const context = operation.getContext();
    const { response: { headers } } = context;
    const session = headers.get("woocommerce-session");

    console.log(`📥 [Afterware] Header recebido: woocommerce-session = ${session || 'NENHUM'}`);

    if (session) {
      if ("false" === session) {
        localStorage.removeItem("woo-session");
        console.log(`🗑️ [Afterware] Sessão destruída`);
      } else if (localStorage.getItem("woo-session") !== session) {
        localStorage.setItem("woo-session", session);
        console.log(`💾 [Afterware] Sessão atualizada: ${session}`);
      }
    }

    return response;
  });
});

// HTTP Link
const httpLink = createHttpLink({
  uri: 'https://rota.rotadoscelulares.com/graphql',
  fetch: fetch,
  credentials: 'include'
});

// Client com middleware/afterware
const client = new ApolloClient({
  link: ApolloLink.from([middleware, afterware, httpLink]),
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: { errorPolicy: 'all' },
    query: { errorPolicy: 'all' }
  }
});

// Queries e Mutations
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
`;

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

async function testSessionPersistence() {
  console.log('🔍 TESTE: Persistência de Sessão WooCommerce');
  console.log('=' * 50);

  try {
    // 1. Estado inicial
    console.log('\n1️⃣ Estado inicial da sessão:');
    console.log(`   localStorage: ${localStorage.getItem("woo-session") || 'VAZIO'}`);

    // 2. Primeira query
    console.log('\n2️⃣ Primeira query do carrinho:');
    const firstQuery = await client.query({
      query: GET_CART,
      fetchPolicy: 'network-only'
    });
    console.log(`   Resultado: ${firstQuery.data.cart?.contents?.nodes?.length || 0} itens`);

    // 3. Primeira mutation
    console.log('\n3️⃣ Primeira mutation (adicionar produto 137):');
    const firstMutation = await client.mutate({
      mutation: ADD_TO_CART,
      variables: {
        clientMutationId: `test_session_${Date.now()}_1`,
        productId: 137,
        quantity: 1
      }
    });
    const firstItems = firstMutation.data.addToCart.cart.contents.nodes;
    console.log(`   Resultado: ${firstItems.length} itens no carrinho`);
    if (firstItems.length > 0) {
      console.log(`   Produto: ${firstItems[0].product.node.name}`);
    }

    // 4. Query intermediária
    console.log('\n4️⃣ Query intermediária:');
    const midQuery = await client.query({
      query: GET_CART,
      fetchPolicy: 'network-only'
    });
    console.log(`   Resultado: ${midQuery.data.cart?.contents?.nodes?.length || 0} itens`);

    // 5. Segunda mutation
    console.log('\n5️⃣ Segunda mutation (adicionar produto 117):');
    const secondMutation = await client.mutate({
      mutation: ADD_TO_CART,
      variables: {
        clientMutationId: `test_session_${Date.now()}_2`,
        productId: 117,
        quantity: 1
      }
    });
    const secondItems = secondMutation.data.addToCart.cart.contents.nodes;
    console.log(`   Resultado: ${secondItems.length} itens no carrinho`);
    if (secondItems.length > 0) {
      console.log(`   Produtos:`);
      secondItems.forEach((item, index) => {
        console.log(`     ${index + 1}. ${item.product.node.name} (Qty: ${item.quantity})`);
      });
    }

    // 6. Query final
    console.log('\n6️⃣ Query final:');
    const finalQuery = await client.query({
      query: GET_CART,
      fetchPolicy: 'network-only'
    });
    console.log(`   Resultado: ${finalQuery.data.cart?.contents?.nodes?.length || 0} itens`);

    // 7. Análise
    console.log('\n📊 ANÁLISE:');
    console.log('=' * 30);
    console.log(`Sessão final: ${localStorage.getItem("woo-session") || 'VAZIA'}`);
    
    if (secondItems.length >= 2) {
      console.log('✅ SUCCESS: Carrinho acumula produtos corretamente');
    } else if (secondItems.length === 1) {
      console.log('❌ PROBLEMA: Carrinho substitui produto (não acumula)');
    }

    if (finalQuery.data.cart?.contents?.nodes?.length === 0) {
      console.log('❌ PROBLEMA: Query separada não mantém sessão');
    } else {
      console.log('✅ SUCCESS: Sessão persiste entre requests');
    }

  } catch (error) {
    console.error('❌ Erro no teste:', error);
    if (error.graphQLErrors) {
      error.graphQLErrors.forEach(err => {
        console.error('GraphQL Error:', err.message);
      });
    }
  }
}

// Executar teste
testSessionPersistence()
  .then(() => {
    console.log('\n🏁 Teste de sessão concluído!');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Erro crítico:', error);
    process.exit(1);
  });
