# 📦 Melhor Envio API Integration Guide

This guide provides step-by-step instructions for integrating the Melhor Envio shipping API into your Next.js e-commerce application.

## 📋 Overview

This integration replaces the unreliable `correios-brasil` library with a direct implementation of the Melhor Envio API for shipping calculations.

### Key Features
- ✅ Reliable shipping rate calculations 
- ✅ Multiple shipping carriers (not just Correios)
- ✅ Built-in fallback system for API outages
- ✅ Detailed error handling and diagnostics

## 🛠️ Setup Process

### Step 1: Set Up a Melhor Envio Account
1. Go to [melhorenvio.com.br](https://melhorenvio.com.br) and create an account if you don't have one
2. Complete your business profile (required to use the API)

### Step 2: Generate API Token
1. Log in to your Melhor Envio account
2. Navigate to **Settings > Tokens**
3. Click **Generate Token**
4. Name your token (e.g., "E-commerce Integration")
5. Select at minimum these permissions:
   - ✓ `shipping-calculate`
   - ✓ `shipping-services`
6. Click **Generate Token** and copy the token

### Step 3: Configure Environment Variables
1. Create or edit the `.env.local` file in your project root
2. Add these variables:
```
# Origin postal code where products ship from (no hyphens)
CEP_ORIGEM=78515000

# Melhor Envio API configuration
MELHORENVIO_TOKEN=your_token_here
MELHORENVIO_SANDBOX=true
```

3. For production, change `MELHORENVIO_SANDBOX` to `false`

### Step 4: Test the Integration

#### Option 1: Run the diagnostic tool
```powershell
npm run diagnose:shipping
```
Or double-click `diagnose-melhorenvio.bat` file.

#### Option 2: Run the test script
```powershell
npm run test:shipping
```
Or double-click `test-melhorenvio.bat` file.

#### Option 3: Test in the browser
1. Start your development server (`npm run dev`)
2. Open `http://localhost:3000/api/test/melhor-envio-status` in your browser
3. You should see a JSON response indicating if the connection was successful

## 🔍 Troubleshooting

### 401 Unauthorized Error
If you see a 401 error:
- Verify your token is correctly copied into `.env.local` (no extra spaces)
- Check if the token is still valid (they can expire)
- Ensure the token has the required permissions

### Network Connection Issues
If the test fails with network errors:
- Check your internet connection
- Verify that the Melhor Envio API is not down (rare, but possible)
- Ensure your server's network allows outgoing connections to Melhor Envio

### No Shipping Options
If no shipping options are returned:
- Verify the origin and destination ZIP codes are valid 
- Check that the product dimensions are reasonable
- The Melhor Envio API may not have carriers available for that route

## 📚 Additional Resources

- [Melhor Envio Documentation](https://docs.melhorenvio.com.br/)
- [Local Integration Documentation](./docs/melhor-envio-usage.md)
- [Configuration Reference](./MELHOR-ENVIO-CONFIG.md)

## 🔄 Fallback System

If the Melhor Envio API is unavailable, the system automatically uses a fallback calculation based on:
- Distance between origin and destination ZIP codes
- Total weight of the products
- Standard delivery timeframes

The fallback system ensures customers can always get shipping estimates, even when the API is down.

---

If you need further assistance, contact the development team or refer to the detailed documentation in the `docs` directory.
