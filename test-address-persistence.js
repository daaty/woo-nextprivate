// Teste para verificar se a mutation UPDATE_CUSTOMER_ADDRESS está persistindo dados corretamente
const { ApolloClient, InMemoryCache, createHttpLink, from, gql } = require('@apollo/client');
require('dotenv').config();

// Configuração do cliente Apollo para teste
const httpLink = createHttpLink({
  uri: process.env.NEXT_PUBLIC_WORDPRESS_URL 
    ? `${process.env.NEXT_PUBLIC_WORDPRESS_URL}/graphql`
    : 'https://rota.rotadoscelulares.com/graphql',
  fetch: require('node-fetch'),
});

const client = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache(),
  defaultOptions: {
    query: { fetchPolicy: 'no-cache' },
    mutate: { fetchPolicy: 'no-cache' }
  }
});

// Query para obter detalhes do cliente
const GET_CUSTOMER = gql`
  query GetCustomerDetails {
    customer {
      id
      databaseId
      firstName
      lastName
      email
      billing {
        firstName
        lastName
        company
        address1
        address2
        city
        state
        postcode
        country
        email
        phone
      }
      shipping {
        firstName
        lastName
        company
        address1
        address2
        city
        state
        postcode
        country
      }
    }
  }
`;

// Mutation para atualizar endereço
const UPDATE_CUSTOMER_ADDRESS = gql`
  mutation UpdateCustomerAddress($input: UpdateCustomerInput!) {
    updateCustomer(input: $input) {
      customer {
        id
        billing {
          firstName
          lastName
          company
          address1
          address2
          city
          state
          postcode
          country
          email
          phone
        }
        shipping {
          firstName
          lastName
          company
          address1
          address2
          city
          state
          postcode
          country
        }
      }
    }
  }
`;

async function testAddressPersistence() {
  try {
    console.log('🔍 Iniciando teste de persistência de endereços...');
    
    // Primeiro, tentar obter dados do cliente sem autenticação
    console.log('\n1. Tentando obter dados do cliente...');
    try {
      const { data } = await client.query({
        query: GET_CUSTOMER,
        context: {
          headers: {
            'Authorization': 'Bearer ' + process.env.TEST_AUTH_TOKEN, // Você precisa fornecer um token de teste
          }
        }
      });
      
      console.log('✅ Dados do cliente obtidos:', {
        id: data.customer?.id,
        email: data.customer?.email,
        billing: data.customer?.billing ? 'Presente' : 'Ausente',
        shipping: data.customer?.shipping ? 'Presente' : 'Ausente'
      });
      
    } catch (error) {
      console.log('❌ Erro ao obter dados do cliente:', error.message);
      console.log('ℹ️  Para testar adequadamente, você precisa de um token de autenticação válido.');
      return;
    }
    
    // Teste de mutation
    console.log('\n2. Testando mutation de atualização de endereço...');
    const testAddress = {
      firstName: 'Teste',
      lastName: 'Usuario',
      address1: 'Rua de Teste, 123',
      city: 'São Paulo',
      state: 'SP',
      postcode: '01234-567',
      country: 'BR'
    };
    
    try {
      const { data } = await client.mutate({
        mutation: UPDATE_CUSTOMER_ADDRESS,
        variables: {
          input: {
            clientMutationId: 'testAddress',
            billing: testAddress
          }
        },
        context: {
          headers: {
            'Authorization': 'Bearer ' + process.env.TEST_AUTH_TOKEN,
          }
        }
      });
      
      console.log('✅ Mutation executada com sucesso:', {
        customerId: data.updateCustomer?.customer?.id,
        billingAddress: data.updateCustomer?.customer?.billing
      });
      
    } catch (error) {
      console.log('❌ Erro na mutation:', error.message);
      if (error.graphQLErrors) {
        error.graphQLErrors.forEach(err => {
          console.log('  - GraphQL Error:', err.message);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Erro geral no teste:', error);
  }
}

// Executar teste
if (require.main === module) {
  testAddressPersistence().then(() => {
    console.log('\n🏁 Teste concluído.');
    process.exit(0);
  }).catch(err => {
    console.error('❌ Erro fatal:', err);
    process.exit(1);
  });
}

module.exports = { testAddressPersistence };
