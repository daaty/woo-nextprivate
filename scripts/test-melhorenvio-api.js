/**
 * Test script for Melhor Envio API integration
 * 
 * This script helps verify that the Melhor Envio API integration
 * works correctly by performing test calculations
 */
require('dotenv').config({ path: '.env.local' });
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// ANSI color codes for terminal output
const colors = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m"
};

// Check if .env.local exists and contains required variables
function checkEnvironmentSetup() {
  console.log(`${colors.cyan}Checking environment setup...${colors.reset}`);
  
  const envPath = path.join(process.cwd(), '.env.local');
  const envExists = fs.existsSync(envPath);
  
  if (!envExists) {
    console.log(`${colors.red}❌ .env.local file not found!${colors.reset}`);
    console.log(`${colors.yellow}Please create a .env.local file based on .env.local.example${colors.reset}`);
    return false;
  }
  
  console.log(`${colors.green}✓ .env.local file exists${colors.reset}`);
  
  // Check for required variables
  const requiredVars = ['CEP_ORIGEM', 'MELHORENVIO_TOKEN'];
  const missing = [];
  
  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  }
  
  if (missing.length > 0) {
    console.log(`${colors.red}❌ Missing required environment variables: ${missing.join(', ')}${colors.reset}`);
    console.log(`${colors.yellow}Please update your .env.local file with these variables${colors.reset}`);
    return false;
  }
  
  console.log(`${colors.green}✓ All required environment variables are set${colors.reset}`);
  console.log(`${colors.cyan}• Mode: ${process.env.MELHORENVIO_SANDBOX === 'true' ? 'Sandbox' : 'Production'}${colors.reset}`);
  console.log(`${colors.cyan}• CEP origem: ${process.env.CEP_ORIGEM}${colors.reset}`);
  return true;
}

// Test configuration
const config = {
  fromZipCode: process.env.CEP_ORIGEM || '78515000', // Use value from .env.local
  toZipCode: '01001000',   // São Paulo downtown
  products: [
    {
      peso: 0.5,           // 500g
      comprimento: 20,     // 20cm
      altura: 5,           // 5cm
      largura: 15,         // 15cm
      quantidade: 1,
      valor: 50.0          // R$ 50 (for insurance)
    }
  ]
};

// Function to test the API endpoint
async function testShippingCalculation() {
  console.log(`${colors.blue}Testing Melhor Envio API integration...${colors.reset}`);
  
  // First check environment setup
  if (!checkEnvironmentSetup()) {
    console.log(`${colors.yellow}Environment check failed. Continuing with default values for testing...${colors.reset}`);
  }
  
  console.log(`${colors.blue}Configuration:${colors.reset}`, JSON.stringify(config, null, 2));
  
  try {
    console.log('\nSending request to calculate shipping...');
    const response = await axios.post('http://localhost:3000/api/shipping/calculate', {
      cepDestino: config.toZipCode,
      produtos: config.products
    });
    
    console.log('\n✅ API Response:');
    console.log(JSON.stringify(response.data, null, 2));
    
    if (response.data.isFallback) {
      console.log('\n⚠️ Warning: API is using fallback values');
      console.log(`Reason: ${response.data.motivoFallback || 'unknown'}`);
    } else {
      console.log('\n✅ Success: API returned real shipping rates from Melhor Envio');
    }
    
    // Display shipping options in a table format
    if (response.data.opcoes && response.data.opcoes.length > 0) {
      console.log('\nShipping Options:');
      console.log('---------------------------------------------------');
      console.log('| Service             | Price (R$) | Delivery Days |');
      console.log('---------------------------------------------------');
      
      response.data.opcoes.forEach(option => {
        const name = option.nome.padEnd(20);
        const price = `R$ ${option.valor.toFixed(2)}`.padEnd(10);
        const days = `${option.prazo} days`.padEnd(12);
        console.log(`| ${name} | ${price} | ${days} |`);
      });
      
      console.log('---------------------------------------------------');
    }
    
    return true;
  } catch (error) {
    console.log('\n❌ Error testing API:');
    
    if (error.response) {
      // The server responded with a status code outside the 2xx range
      console.log('Status:', error.response.status);
      console.log('Response data:', error.response.data);
    } else if (error.request) {
      // The request was made but no response was received
      console.log('No response received. Is the server running?');
    } else {
      // Something happened in setting up the request
      console.log('Error message:', error.message);
    }
    
    return false;
  }
}

// Function to check the direct API endpoint
async function testMelhorEnvioStatus() {
  try {
    console.log(`\n${colors.blue}Testing Melhor Envio connection status...${colors.reset}`);
    
    const response = await axios.get('http://localhost:3000/api/test/melhor-envio-status');
    console.log(`\n${colors.blue}API Status Response:${colors.reset}`);
    console.log(JSON.stringify(response.data, null, 2));
    
    if (response.data.status === 'success') {
      console.log(`\n${colors.green}✅ Melhor Envio API connection test passed!${colors.reset}`);
      return true;
    } else {
      console.log(`\n${colors.red}❌ Melhor Envio API connection test failed${colors.reset}`);
      console.log(`${colors.yellow}Reason: ${response.data.message}${colors.reset}`);
      return false;
    }
  } catch (error) {
    console.log(`\n${colors.red}❌ Error testing API status:${colors.reset}`);
    
    if (error.code === 'ECONNREFUSED') {
      console.log(`${colors.yellow}Could not connect to the server. Is your Next.js development server running?${colors.reset}`);
      console.log(`${colors.yellow}Try running 'npm run dev' in a separate terminal window first.${colors.reset}`);
    } else {
      console.log(error.message);
    }
    
    return false;
  }
}

// Function to provide recommendations based on test results
function provideRecommendations(shippingSuccess, statusSuccess) {
  console.log(`\n${colors.cyan}=== TEST SUMMARY ===${colors.reset}`);
  
  if (shippingSuccess && statusSuccess) {
    console.log(`${colors.green}All tests passed! Your Melhor Envio integration is working correctly.${colors.reset}`);
    console.log(`${colors.green}You can now use the integration in your application.${colors.reset}`);
  } else {
    console.log(`${colors.yellow}Some tests failed. Here are some recommendations:${colors.reset}`);
    
    if (!statusSuccess) {
      console.log(`\n${colors.yellow}1. Verify your Melhor Envio token:${colors.reset}`);
      console.log(`   • Check if the token is correctly set in your .env.local file`);
      console.log(`   • Ensure the token has the necessary permissions (shipping-calculate, shipping-services)`);
      console.log(`   • Try generating a new token if the current one is not working`);
    }
    
    if (!shippingSuccess) {
      console.log(`\n${colors.yellow}2. Check your shipping calculation:${colors.reset}`);
      console.log(`   • Make sure your Next.js server is running`);
      console.log(`   • Verify the product dimensions are within acceptable ranges`);
      console.log(`   • Check that the origin and destination ZIP codes are valid`);
    }
    
    console.log(`\n${colors.yellow}3. For more information, check:${colors.reset}`);
    console.log(`   • docs/melhor-envio-usage.md`);
    console.log(`   • MELHOR-ENVIO-CONFIG.md`);
  }
}

// Run the test
console.log('==================================================');
console.log(`${colors.cyan}MELHOR ENVIO API INTEGRATION TEST${colors.reset}`);
console.log('==================================================\n');

// Run both tests sequentially and provide recommendations
async function runAllTests() {
  const shippingSuccess = await testShippingCalculation();
  const statusSuccess = await testMelhorEnvioStatus();
  provideRecommendations(shippingSuccess, statusSuccess);
}

runAllTests().catch(err => {
  console.log(`\n${colors.red}❌ Unexpected error:${colors.reset}`, err);
});
