// Test script for cart functionality
require('dotenv').config({ path: '.env.local' });
const https = require('https');

console.log('=== TESTANDO CART FUNCTIONALITY ===');

// Test current environment variables
console.log('URLS in .env.local:');
console.log('NEXT_PUBLIC_WORDPRESS_URL:', process.env.NEXT_PUBLIC_WORDPRESS_URL || 'NOT SET');
console.log('NEXT_PUBLIC_SITE_URL:', process.env.NEXT_PUBLIC_SITE_URL || 'NOT SET');

// Check if the GraphQL endpoint is responding
const testGraphQL = () => {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      query: `query { __typename }`
    });

    const options = {
      hostname: 'rota.rotadoscelulares.com',
      path: '/graphql',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(body);
          resolve({ status: res.statusCode, result });
        } catch (e) {
          resolve({ status: res.statusCode, error: e.message, body });
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
};

// Test cart query
const testCartQuery = () => {
  return new Promise((resolve, reject) => {
    const cartQuery = {
      query: `
        query GetCart {
          cart {
            contents {
              nodes {
                key
                product {
                  node {
                    id
                    name
                  }
                }
                quantity
              }
            }
            total
            subtotal
          }
        }
      `
    };

    const data = JSON.stringify(cartQuery);
    const options = {
      hostname: 'rota.rotadoscelulares.com',
      path: '/graphql',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(body);
          resolve({ status: res.statusCode, result });
        } catch (e) {
          resolve({ status: res.statusCode, error: e.message, body });
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
};

// Run tests
async function runTests() {
  try {
    console.log('\n=== GraphQL Endpoint Test ===');
    const graphqlTest = await testGraphQL();
    console.log('Status:', graphqlTest.status);
    if (graphqlTest.result) {
      console.log('Response:', graphqlTest.result);
    } else {
      console.log('Error:', graphqlTest.error);
      console.log('Body:', graphqlTest.body?.substring(0, 500));
    }

    console.log('\n=== Cart Query Test ===');
    const cartTest = await testCartQuery();
    console.log('Status:', cartTest.status);
    if (cartTest.result) {
      console.log('Cart Response:', JSON.stringify(cartTest.result, null, 2));
    } else {
      console.log('Cart Error:', cartTest.error);
      console.log('Cart Body:', cartTest.body?.substring(0, 500));
    }

  } catch (error) {
    console.error('Connection error:', error.message);
  }
}

runTests();
