const { ApolloClient, InMemoryCache, gql, createHttpLink } = require('@apollo/client/core');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config({ path: './.env.local' });

// Configuração do cliente Apollo
const httpLink = createHttpLink({
  uri: process.env.NEXT_PUBLIC_WORDPRESS_SITE_URL + '/graphql',
  fetch: require('cross-fetch'),
});

const client = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      errorPolicy: 'all',
    },
    query: {
      errorPolicy: 'all',
    },
  },
});

// Mutation ADD_TO_CART completa
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
          itemCount
          productCount
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
        subtotal
        total
      }
    }
  }
`;

// Query para obter o carrinho atual
const GET_CART = gql`
  query GET_CART {
    cart {
      contents {
        itemCount
        productCount
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
      subtotal
      total
    }
  }
`;

// Query para limpar o carrinho
const CLEAR_CART = gql`
  mutation CLEAR_CART($input: RemoveItemsFromCartInput!) {
    removeItemsFromCart(input: $input) {
      cartItems {
        quantity
      }
    }
  }
`;

async function testAddToCart() {
  console.log('🧪 TESTE: Verificando acumulação vs substituição de produtos no carrinho WooCommerce\n');
  
  try {
    // 1. Limpar o carrinho primeiro
    console.log('1️⃣ Limpando carrinho...');
    await client.mutate({
      mutation: CLEAR_CART,
      variables: {
        input: {
          clientMutationId: uuidv4(),
          all: true
        }
      }
    });
    
    // 2. Verificar se carrinho está vazio
    let cartResponse = await client.query({
      query: GET_CART,
      fetchPolicy: 'no-cache'
    });
    
    console.log('Carrinho após limpeza:', {
      itemCount: cartResponse.data?.cart?.contents?.itemCount || 0,
      productCount: cartResponse.data?.cart?.contents?.productCount || 0,
      items: cartResponse.data?.cart?.contents?.nodes?.length || 0
    });
    
    // 3. Adicionar primeiro produto (ID: 1085)
    console.log('\n2️⃣ Adicionando primeiro produto (ID: 1085)...');
    const firstProduct = await client.mutate({
      mutation: ADD_TO_CART,
      variables: {
        input: {
          clientMutationId: uuidv4(),
          productId: 1085,
          quantity: 1
        }
      }
    });
    
    console.log('✅ Primeiro produto adicionado:');
    console.log('- Produto:', firstProduct.data?.addToCart?.cartItem?.product?.node?.name);
    console.log('- Quantidade:', firstProduct.data?.addToCart?.cartItem?.quantity);
    console.log('- Total de itens no carrinho:', firstProduct.data?.addToCart?.cart?.contents?.itemCount);
    console.log('- Total de produtos no carrinho:', firstProduct.data?.addToCart?.cart?.contents?.productCount);
    console.log('- Itens no carrinho:', firstProduct.data?.addToCart?.cart?.contents?.nodes?.map(n => ({
      id: n.product.node.databaseId,
      name: n.product.node.name,
      qty: n.quantity
    })));
    
    // 4. Aguardar um pouco (simular tempo real)
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 5. Verificar estado do carrinho
    console.log('\n3️⃣ Verificando estado do carrinho...');
    cartResponse = await client.query({
      query: GET_CART,
      fetchPolicy: 'no-cache'
    });
    
    console.log('Estado atual do carrinho:', {
      itemCount: cartResponse.data?.cart?.contents?.itemCount || 0,
      productCount: cartResponse.data?.cart?.contents?.productCount || 0,
      items: cartResponse.data?.cart?.contents?.nodes?.map(n => ({
        id: n.product.node.databaseId,
        name: n.product.node.name,
        qty: n.quantity,
        key: n.key
      })) || []
    });
    
    // 6. Adicionar segundo produto (ID: 1086)
    console.log('\n4️⃣ Adicionando segundo produto (ID: 1086)...');
    const secondProduct = await client.mutate({
      mutation: ADD_TO_CART,
      variables: {
        input: {
          clientMutationId: uuidv4(),
          productId: 1086,
          quantity: 1
        }
      }
    });
    
    console.log('✅ Segundo produto adicionado:');
    console.log('- Produto:', secondProduct.data?.addToCart?.cartItem?.product?.node?.name);
    console.log('- Quantidade:', secondProduct.data?.addToCart?.cartItem?.quantity);
    console.log('- Total de itens no carrinho:', secondProduct.data?.addToCart?.cart?.contents?.itemCount);
    console.log('- Total de produtos no carrinho:', secondProduct.data?.addToCart?.cart?.contents?.productCount);
    console.log('- Itens no carrinho:', secondProduct.data?.addToCart?.cart?.contents?.nodes?.map(n => ({
      id: n.product.node.databaseId,
      name: n.product.node.name,
      qty: n.quantity
    })));
    
    // 7. Verificar estado final
    console.log('\n5️⃣ Verificação final do carrinho...');
    cartResponse = await client.query({
      query: GET_CART,
      fetchPolicy: 'no-cache'
    });
    
    const finalCart = cartResponse.data?.cart;
    console.log('Estado final do carrinho:', {
      itemCount: finalCart?.contents?.itemCount || 0,
      productCount: finalCart?.contents?.productCount || 0,
      items: finalCart?.contents?.nodes?.map(n => ({
        id: n.product.node.databaseId,
        name: n.product.node.name,
        qty: n.quantity,
        key: n.key
      })) || []
    });
    
    // 8. Análise dos resultados
    console.log('\n🔍 ANÁLISE DOS RESULTADOS:');
    
    const totalItems = finalCart?.contents?.itemCount || 0;
    const totalProducts = finalCart?.contents?.productCount || 0;
    const uniqueProducts = finalCart?.contents?.nodes?.length || 0;
    
    if (uniqueProducts >= 2) {
      console.log('✅ SUCESSO: Carrinho está acumulando produtos corretamente!');
      console.log(`   - ${uniqueProducts} produtos únicos no carrinho`);
      console.log(`   - ${totalItems} itens totais`);
    } else if (uniqueProducts === 1) {
      console.log('❌ PROBLEMA: Carrinho está substituindo produtos ao invés de acumular!');
      console.log(`   - Apenas ${uniqueProducts} produto no carrinho`);
      console.log('   - O segundo produto substituiu o primeiro');
      
      // Verificar qual produto ficou
      const remainingProduct = finalCart?.contents?.nodes?.[0];
      if (remainingProduct) {
        console.log(`   - Produto restante: ${remainingProduct.product.node.name} (ID: ${remainingProduct.product.node.databaseId})`);
      }
    } else {
      console.log('❓ ESTRANHO: Carrinho está vazio após adicionar produtos');
    }
    
    // 9. Testar adicionar o mesmo produto duas vezes
    console.log('\n6️⃣ Testando adicionar o mesmo produto duas vezes...');
    
    // Limpar carrinho novamente
    await client.mutate({
      mutation: CLEAR_CART,
      variables: {
        input: {
          clientMutationId: uuidv4(),
          all: true
        }
      }
    });
    
    // Adicionar produto duas vezes
    const sameProduct1 = await client.mutate({
      mutation: ADD_TO_CART,
      variables: {
        input: {
          clientMutationId: uuidv4(),
          productId: 1085,
          quantity: 1
        }
      }
    });
    
    console.log('Primeira adição do mesmo produto:', {
      itemCount: sameProduct1.data?.addToCart?.cart?.contents?.itemCount,
      productCount: sameProduct1.data?.addToCart?.cart?.contents?.productCount
    });
    
    const sameProduct2 = await client.mutate({
      mutation: ADD_TO_CART,
      variables: {
        input: {
          clientMutationId: uuidv4(),
          productId: 1085,
          quantity: 1
        }
      }
    });
    
    console.log('Segunda adição do mesmo produto:', {
      itemCount: sameProduct2.data?.addToCart?.cart?.contents?.itemCount,
      productCount: sameProduct2.data?.addToCart?.cart?.contents?.productCount,
      items: sameProduct2.data?.addToCart?.cart?.contents?.nodes?.map(n => ({
        id: n.product.node.databaseId,
        name: n.product.node.name,
        qty: n.quantity
      }))
    });
    
    // Análise do mesmo produto
    const sameProductCount = sameProduct2.data?.addToCart?.cart?.contents?.itemCount || 0;
    if (sameProductCount === 2) {
      console.log('✅ CORRETO: Mesmo produto acumula quantidade corretamente');
    } else {
      console.log('❌ PROBLEMA: Mesmo produto não está acumulando quantidade');
    }
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error.message);
    if (error.graphQLErrors && error.graphQLErrors.length > 0) {
      console.error('Erros GraphQL:', error.graphQLErrors);
    }
    if (error.networkError) {
      console.error('Erro de rede:', error.networkError);
    }
  }
}

// Executar o teste
testAddToCart();
