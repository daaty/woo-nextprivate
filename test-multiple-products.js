/**
 * Teste para verificar se conseguimos adicionar múltiplos produtos ao carrinho
 * e se o WooCommerce está mantendo ambos ou substituindo
 */

const { ApolloClient, InMemoryCache, gql } = require('@apollo/client');
const fetch = require('cross-fetch');
const { createHttpLink } = require('@apollo/client/link/http');

// Configurar Apollo Client
const httpLink = createHttpLink({
  uri: 'https://rota.rotadoscelulares.com/graphql',
  fetch,
});

const client = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache(),
});

// Mutation para adicionar ao carrinho
const ADD_TO_CART = gql`
  mutation ADD_TO_CART($input: AddToCartInput!) {
    addToCart(input: $input) {
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
              }
            }
            quantity
            total
          }
          itemCount
          productCount
        }
        subtotal
        total
      }
    }
  }
`;

// Query para verificar carrinho
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
            }
          }
          quantity
          total
        }
        itemCount
        productCount
      }
      subtotal
      total
    }
  }
`;

async function testMultipleProducts() {
  try {
    console.log('🧪 TESTE: Adicionando múltiplos produtos ao carrinho\n');

    // 1. Adicionar primeiro produto (ID 137)
    console.log('📦 Adicionando produto 137...');
    const result1 = await client.mutate({
      mutation: ADD_TO_CART,
      variables: {
        input: {
          clientMutationId: `test_add_1_${Date.now()}`,
          productId: 137,
          quantity: 1
        }
      }
    });

    console.log('✅ Produto 137 adicionado');
    console.log('   - Produtos no carrinho:', result1.data.addToCart.cart.contents.productCount);
    console.log('   - Itens no carrinho:', result1.data.addToCart.cart.contents.itemCount);
    console.log('   - Total:', result1.data.addToCart.cart.total);
    
    // Mostrar produtos no carrinho
    if (result1.data.addToCart.cart.contents.nodes.length > 0) {
      console.log('   - Produtos atuais:');
      result1.data.addToCart.cart.contents.nodes.forEach((node, i) => {
        console.log(`     ${i+1}. ${node.product.node.name} (ID: ${node.product.node.databaseId}) - Qty: ${node.quantity}`);
      });
    }

    console.log('\n⏱️  Aguardando 2 segundos...\n');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 2. Adicionar segundo produto (ID 117)
    console.log('📦 Adicionando produto 117...');
    const result2 = await client.mutate({
      mutation: ADD_TO_CART,
      variables: {
        input: {
          clientMutationId: `test_add_2_${Date.now()}`,
          productId: 117,
          quantity: 1
        }
      }
    });

    console.log('✅ Produto 117 adicionado');
    console.log('   - Produtos no carrinho:', result2.data.addToCart.cart.contents.productCount);
    console.log('   - Itens no carrinho:', result2.data.addToCart.cart.contents.itemCount);
    console.log('   - Total:', result2.data.addToCart.cart.total);
    
    // Mostrar produtos no carrinho após segunda adição
    if (result2.data.addToCart.cart.contents.nodes.length > 0) {
      console.log('   - Produtos atuais:');
      result2.data.addToCart.cart.contents.nodes.forEach((node, i) => {
        console.log(`     ${i+1}. ${node.product.node.name} (ID: ${node.product.node.databaseId}) - Qty: ${node.quantity}`);
      });
    }

    console.log('\n⏱️  Aguardando 2 segundos...\n');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 3. Verificar carrinho com query separada
    console.log('🔍 Verificando carrinho com query separada...');
    const cartCheck = await client.query({
      query: GET_CART,
      fetchPolicy: 'network-only' // Força buscar do servidor
    });

    console.log('📊 Status final do carrinho:');
    console.log('   - Produtos no carrinho:', cartCheck.data.cart.contents.productCount);
    console.log('   - Itens no carrinho:', cartCheck.data.cart.contents.itemCount);
    console.log('   - Total:', cartCheck.data.cart.total);
    
    if (cartCheck.data.cart.contents.nodes.length > 0) {
      console.log('   - Produtos finais:');
      cartCheck.data.cart.contents.nodes.forEach((node, i) => {
        console.log(`     ${i+1}. ${node.product.node.name} (ID: ${node.product.node.databaseId}) - Qty: ${node.quantity}`);
      });
    }

    // 4. Análise
    console.log('\n📈 ANÁLISE:');
    if (cartCheck.data.cart.contents.productCount >= 2) {
      console.log('✅ SUCESSO: Múltiplos produtos foram mantidos no carrinho!');
    } else if (cartCheck.data.cart.contents.productCount === 1) {
      console.log('❌ PROBLEMA: Apenas 1 produto no carrinho - produtos estão sendo substituídos!');
    } else {
      console.log('❌ ERRO: Carrinho vazio após adições!');
    }

  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
    if (error.graphQLErrors) {
      console.error('   - Erros GraphQL:', error.graphQLErrors);
    }
    if (error.networkError) {
      console.error('   - Erro de rede:', error.networkError);
    }
  }
}

// Executar teste
testMultipleProducts().then(() => {
  console.log('\n🏁 Teste concluído');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Falha no teste:', error);
  process.exit(1);
});
