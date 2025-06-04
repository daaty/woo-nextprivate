export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('[Test WooCommerce] 🔧 Testando credenciais WooCommerce...');
    
    // Verificar múltiplas variações dos nomes das variáveis
    const consumerKey = process.env.WC_CONSUMER_KEY || process.env.WOO_CONSUMER_KEY;
    const consumerSecret = process.env.WC_CONSUMER_SECRET || process.env.WOO_CONSUMER_SECRET;
    const wordpressUrl = process.env.NEXT_PUBLIC_WORDPRESS_URL;
    
    console.log('[Test WooCommerce] 📊 Variáveis de ambiente:', {
      WC_CONSUMER_KEY: !!process.env.WC_CONSUMER_KEY ? 'Definida' : 'NÃO DEFINIDA',
      WC_CONSUMER_SECRET: !!process.env.WC_CONSUMER_SECRET ? 'Definida' : 'NÃO DEFINIDA',
      WOO_CONSUMER_KEY: !!process.env.WOO_CONSUMER_KEY ? 'Definida (fallback)' : 'NÃO DEFINIDA',
      WOO_CONSUMER_SECRET: !!process.env.WOO_CONSUMER_SECRET ? 'Definida (fallback)' : 'NÃO DEFINIDA',
      NEXT_PUBLIC_WORDPRESS_URL: wordpressUrl || 'NÃO DEFINIDA',
      usandoCredenciais: {
        key: consumerKey ? consumerKey.substring(0, 8) + '...' : 'NENHUMA',
        secret: consumerSecret ? consumerSecret.substring(0, 8) + '...' : 'NENHUMA'
      }
    });
    
    if (!consumerKey || !consumerSecret || !wordpressUrl) {
      return res.status(400).json({
        success: false,
        error: 'Credenciais WooCommerce não configuradas',
        details: {
          consumer_key: !!consumerKey,
          consumer_secret: !!consumerSecret,
          wordpress_url: !!wordpressUrl
        },
        found_variables: {
          WC_CONSUMER_KEY: !!process.env.WC_CONSUMER_KEY,
          WC_CONSUMER_SECRET: !!process.env.WC_CONSUMER_SECRET,
          WOO_CONSUMER_KEY: !!process.env.WOO_CONSUMER_KEY,
          WOO_CONSUMER_SECRET: !!process.env.WOO_CONSUMER_SECRET
        }
      });
    }
    
    // Testar autenticação com múltiplas estratégias
    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
    
    const testStrategies = [
      {
        name: 'Basic Auth - Produtos',
        url: `${process.env.NEXT_PUBLIC_WORDPRESS_URL}/wp-json/wc/v3/products?per_page=1`,
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json'
        }
      },
      {
        name: 'Query Params - Produtos',
        url: `${process.env.NEXT_PUBLIC_WORDPRESS_URL}/wp-json/wc/v3/products?per_page=1&consumer_key=${process.env.WC_CONSUMER_KEY}&consumer_secret=${process.env.WC_CONSUMER_SECRET}`,
        headers: {
          'Content-Type': 'application/json'
        }
      },
      {
        name: 'System Status',
        url: `${process.env.NEXT_PUBLIC_WORDPRESS_URL}/wp-json/wc/v3/system_status`,
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json'
        }
      }
    ];
    
    const results = [];
    
    for (const strategy of testStrategies) {
      try {
        console.log(`[Test WooCommerce] 🔄 Testando: ${strategy.name}`);
        
        const response = await fetch(strategy.url, {
          headers: strategy.headers,
          timeout: 5000
        });
        
        const result = {
          strategy: strategy.name,
          status: response.status,
          success: response.ok,
          error: null
        };
        
        if (response.ok) {
          const data = await response.json();
          result.data_preview = Array.isArray(data) ? `Array com ${data.length} itens` : 'Objeto retornado';
          console.log(`[Test WooCommerce] ✅ ${strategy.name} - Sucesso`);
        } else {
          const errorText = await response.text();
          result.error = errorText.substring(0, 200);
          console.log(`[Test WooCommerce] ❌ ${strategy.name} - Erro ${response.status}`);
        }
        
        results.push(result);
      } catch (error) {
        results.push({
          strategy: strategy.name,
          status: 0,
          success: false,
          error: error.message
        });
        console.log(`[Test WooCommerce] ❌ ${strategy.name} - Exceção:`, error.message);
      }
    }
    
    const successfulStrategies = results.filter(r => r.success);
    
    return res.status(200).json({
      success: successfulStrategies.length > 0,
      message: successfulStrategies.length > 0 
        ? `${successfulStrategies.length} estratégia(s) funcionando` 
        : 'Nenhuma estratégia funcionou',
      results,
      recommendations: successfulStrategies.length === 0 ? [
        'Verificar se as credenciais WooCommerce estão corretas',
        'Verificar se a API REST do WooCommerce está habilitada',
        'Verificar se o domínio WordPress está acessível',
        'Verificar permissões das chaves de API'
      ] : [
        'Credenciais funcionando!',
        'Use a estratégia que teve sucesso no seu código'
      ]
    });
    
  } catch (error) {
    console.error('[Test WooCommerce] ❌ Erro geral:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
