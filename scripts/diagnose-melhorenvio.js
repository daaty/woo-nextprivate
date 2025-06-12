/**
 * Melhor Envio API - Diagnostic Utility
 * 
 * This script checks the configuration and connection to the Melhor Envio API.
 * It helps diagnose common issues with the integration.
 */
require('dotenv').config({ path: '.env.local' });
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// ANSI colors for better readability
const colors = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m", 
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
  bgRed: "\x1b[41m",
  bgGreen: "\x1b[42m"
};

// Print header
console.log(`${colors.cyan}==============================================`);
console.log(`MELHOR ENVIO API INTEGRATION - DIAGNOSTIC TOOL`);
console.log(`==============================================\n${colors.reset}`);

// Check environment configuration
async function checkEnvironment() {
  console.log(`${colors.blue}[1/5] Checking environment configuration...${colors.reset}`);
  
  // Check .env.local file
  const envPath = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) {
    console.log(`${colors.red}❌ .env.local file not found${colors.reset}`);
    console.log(`${colors.yellow}Create a .env.local file based on .env.local.example${colors.reset}`);
    return false;
  }
  
  console.log(`${colors.green}✓ .env.local file exists${colors.reset}`);
  
  // Check required variables
  const requiredVars = [
    { name: 'CEP_ORIGEM', description: 'Origin ZIP code' },
    { name: 'MELHORENVIO_TOKEN', description: 'Melhor Envio API token' }
  ];
  
  let allVarsPresent = true;
  
  for (const v of requiredVars) {
    if (!process.env[v.name]) {
      console.log(`${colors.red}❌ Missing ${v.description} (${v.name})${colors.reset}`);
      allVarsPresent = false;
    } else {
      console.log(`${colors.green}✓ ${v.description} configured${colors.reset}`);
    }
  }
  
  // Check sandbox mode
  const isSandbox = process.env.MELHORENVIO_SANDBOX === 'true';
  console.log(`${colors.blue}• API Mode: ${isSandbox ? 'Sandbox (testing)' : 'Production'}${colors.reset}`);
  
  return allVarsPresent;
}

// Check token validity
async function checkTokenValidity() {
  console.log(`\n${colors.blue}[2/5] Checking Melhor Envio token validity...${colors.reset}`);
  
  const token = process.env.MELHORENVIO_TOKEN;
  if (!token) {
    console.log(`${colors.red}❌ No token found in environment variables${colors.reset}`);
    return false;
  }
  
  try {
    const isSandbox = process.env.MELHORENVIO_SANDBOX === 'true';
    const baseURL = isSandbox
      ? 'https://sandbox.melhorenvio.com.br/api/v2'
      : 'https://www.melhorenvio.com.br/api/v2';
    
    const response = await axios.get(`${baseURL}/me/shipment/companies`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'User-Agent': 'WooCommerce Integration Diagnostic Tool'
      },
      timeout: 10000
    });
    
    if (response.status === 200) {
      console.log(`${colors.green}✓ Token is valid${colors.reset}`);
      return true;
    }
    
    console.log(`${colors.red}❌ Unexpected response: ${response.status}${colors.reset}`);
    return false;
  } catch (error) {
    console.log(`${colors.red}❌ Token validation failed${colors.reset}`);
    
    if (error.response && error.response.status === 401) {
      console.log(`${colors.yellow}The token is invalid or expired. Please generate a new token.${colors.reset}`);
    } else if (error.code === 'ENOTFOUND' || error.code === 'EAI_AGAIN') {
      console.log(`${colors.yellow}Network error: Cannot connect to Melhor Envio servers. Check your internet connection.${colors.reset}`);
    } else {
      console.log(`${colors.yellow}Error: ${error.message}${colors.reset}`);
    }
    
    return false;
  }
}

// Test simple shipping calculation
async function testShippingCalculation() {
  console.log(`\n${colors.blue}[3/5] Testing shipping calculation...${colors.reset}`);
  
  const fromZip = process.env.CEP_ORIGEM?.replace(/\D/g, '') || '78515000';
  const toZip = '01001000'; // São Paulo downtown
  
  // Test product
  const testProduct = {
    peso: 0.5,
    comprimento: 20,
    altura: 5,
    largura: 15,
    quantidade: 1
  };
  
  try {
    const isSandbox = process.env.MELHORENVIO_SANDBOX === 'true';
    const baseURL = isSandbox
      ? 'https://sandbox.melhorenvio.com.br/api/v2'
      : 'https://www.melhorenvio.com.br/api/v2';
    
    const token = process.env.MELHORENVIO_TOKEN;
    if (!token) {
      console.log(`${colors.red}❌ Cannot test shipping calculation without a token${colors.reset}`);
      return false;
    }
    
    const requestBody = {
      from: { postal_code: fromZip },
      to: { postal_code: toZip },
      products: [{
        id: 'test-product',
        width: testProduct.largura,
        height: testProduct.altura,
        length: testProduct.comprimento,
        weight: testProduct.peso,
        insurance_value: 50,
        quantity: testProduct.quantidade
      }],
      options: {
        receipt: false,
        own_hand: false,
        collect: false
      }
    };
    
    console.log(`${colors.blue}• Testing: ${fromZip} → ${toZip} (${testProduct.peso}kg)${colors.reset}`);
    
    const response = await axios.post(`${baseURL}/me/shipment/calculate`, requestBody, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
        'User-Agent': 'WooCommerce Integration Diagnostic Tool'
      },
      timeout: 15000
    });
    
    if (response.status === 200 && Array.isArray(response.data)) {
      console.log(`${colors.green}✓ Shipping calculation successful${colors.reset}`);
      
      // Show available shipping options
      const options = response.data.filter(opt => !opt.error);
      if (options.length > 0) {
        console.log(`${colors.green}✓ Found ${options.length} shipping options${colors.reset}`);
        
        // Display the cheapest option
        const cheapest = options.reduce((min, opt) => opt.price < min.price ? opt : min, options[0]);
        console.log(`${colors.blue}• Cheapest option: ${cheapest.name} - ${cheapest.company.name} (R$ ${cheapest.price}, ${cheapest.delivery_time} days)${colors.reset}`);
        
        return true;
      } else {
        console.log(`${colors.yellow}⚠ No shipping options available for the test parameters${colors.reset}`);
        return false;
      }
    }
    
    console.log(`${colors.red}❌ Unexpected response from shipping calculation${colors.reset}`);
    return false;
  } catch (error) {
    console.log(`${colors.red}❌ Shipping calculation failed${colors.reset}`);
    
    if (error.response) {
      console.log(`${colors.yellow}API Response Error: ${error.response.status} - ${error.response.data?.message || 'Unknown error'}${colors.reset}`);
    } else if (error.code === 'ENOTFOUND' || error.code === 'EAI_AGAIN') {
      console.log(`${colors.yellow}Network error: Cannot connect to Melhor Envio servers. Check your internet connection.${colors.reset}`);
    } else {
      console.log(`${colors.yellow}Error: ${error.message}${colors.reset}`);
    }
    
    return false;
  }
}

// Test connection to local API
async function testLocalApi() {
  console.log(`\n${colors.blue}[4/5] Testing local API endpoint...${colors.reset}`);
  console.log(`${colors.yellow}Note: This test requires the Next.js development server to be running${colors.reset}`);
  
  try {
    const response = await axios.post('http://localhost:3000/api/shipping/calculate', {
      cepDestino: '01001000', // São Paulo downtown
      produtos: [{
        peso: 0.5,
        comprimento: 20,
        altura: 5,
        largura: 15,
        quantidade: 1
      }]
    }, {
      timeout: 10000
    });
    
    if (response.status === 200) {
      console.log(`${colors.green}✓ Local API endpoint is responding${colors.reset}`);
      
      if (response.data.isFallback) {
        console.log(`${colors.yellow}⚠ API is using fallback values due to: ${response.data.motivoFallback || 'unknown reason'}${colors.reset}`);
      } else {
        console.log(`${colors.green}✓ API is using real shipping rates from Melhor Envio${colors.reset}`);
      }
      
      return true;
    }
    
    console.log(`${colors.red}❌ Unexpected response from local API: ${response.status}${colors.reset}`);
    return false;
  } catch (error) {
    console.log(`${colors.red}❌ Local API test failed${colors.reset}`);
    
    if (error.code === 'ECONNREFUSED') {
      console.log(`${colors.yellow}Could not connect to the local Next.js server. Is it running?${colors.reset}`);
      console.log(`${colors.yellow}Try running 'npm run dev' in a separate terminal window.${colors.reset}`);
    } else {
      console.log(`${colors.yellow}Error: ${error.message}${colors.reset}`);
    }
    
    return false;
  }
}

// Generate recommendations based on test results
function generateRecommendations(results) {
  console.log(`\n${colors.blue}[5/5] Generating recommendations...${colors.reset}`);
  
  const { envCheck, tokenCheck, shippingCheck, localApiCheck } = results;
  
  if (envCheck && tokenCheck && shippingCheck && localApiCheck) {
    console.log(`\n${colors.bgGreen}${colors.reset} ${colors.green}All tests passed! Your Melhor Envio integration is working correctly.${colors.reset}`);
    console.log(`${colors.green}You can now use the integration in your application.${colors.reset}`);
    return;
  }
  
  console.log(`\n${colors.yellow}Here are some recommendations based on the test results:${colors.reset}`);
  
  if (!envCheck) {
    console.log(`\n${colors.yellow}[Environment Configuration]${colors.reset}`);
    console.log(`• Create or update your .env.local file with the required variables:`);
    console.log(`  - CEP_ORIGEM=your_origin_zip_code`);
    console.log(`  - MELHORENVIO_TOKEN=your_token_here`);
    console.log(`  - MELHORENVIO_SANDBOX=true (or false for production)`);
  }
  
  if (!tokenCheck) {
    console.log(`\n${colors.yellow}[Token Issues]${colors.reset}`);
    console.log(`• Verify your Melhor Envio token:`);
    console.log(`  1. Go to your Melhor Envio account → Settings → Tokens`);
    console.log(`  2. Generate a new token with shipping-calculate and shipping-services permissions`);
    console.log(`  3. Copy the token to your .env.local file`);
  }
  
  if (!shippingCheck) {
    console.log(`\n${colors.yellow}[Shipping Calculation]${colors.reset}`);
    console.log(`• Check that the Melhor Envio API is accessible from your network`);
    console.log(`• Verify that your origin and destination ZIP codes are valid`);
    console.log(`• Ensure the product dimensions are within acceptable ranges`);
  }
  
  if (!localApiCheck) {
    console.log(`\n${colors.yellow}[Local API Issues]${colors.reset}`);
    console.log(`• Make sure your Next.js development server is running`);
    console.log(`• Check for errors in the server console`);
    console.log(`• Review your implementation in pages/api/shipping/calculate.js`);
  }
  
  console.log(`\n${colors.yellow}For more detailed information, see:${colors.reset}`);
  console.log(`• docs/melhor-envio-usage.md`);
  console.log(`• MELHOR-ENVIO-CONFIG.md`);
}

// Run all diagnostic tests
async function runDiagnostics() {
  try {
    const results = {
      envCheck: await checkEnvironment(),
      tokenCheck: await checkTokenValidity(),
      shippingCheck: await testShippingCalculation(),
      localApiCheck: await testLocalApi()
    };
    
    generateRecommendations(results);
    
    console.log(`\n${colors.cyan}==============================================`);
    console.log(`DIAGNOSTIC COMPLETE`);
    console.log(`==============================================\n${colors.reset}`);
  } catch (error) {
    console.log(`\n${colors.bgRed}${colors.reset} ${colors.red}Unexpected error during diagnostics: ${error.message}${colors.reset}`);
    console.log(`\n${colors.red}Stack trace: ${error.stack}${colors.reset}`);
  }
}

// Execute diagnostics
runDiagnostics();
