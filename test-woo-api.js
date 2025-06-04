/**
 * Teste rápido para verificar se a API WooCommerce está funcionando
 */
require('dotenv').config();

async function testWooCommerceAPI() {
    const WC_BASE_URL = process.env.WOO_SITE_URL;
    const WC_CONSUMER_KEY = process.env.WOO_CONSUMER_KEY;
    const WC_CONSUMER_SECRET = process.env.WOO_CONSUMER_SECRET;
    
    console.log('🔧 Testando conexão com WooCommerce API...');
    console.log('URL:', WC_BASE_URL);
    console.log('Consumer Key:', WC_CONSUMER_KEY ? 'Definido' : 'ERRO: Não definido');
    console.log('Consumer Secret:', WC_CONSUMER_SECRET ? 'Definido' : 'ERRO: Não definido');
    
    if (!WC_BASE_URL || !WC_CONSUMER_KEY || !WC_CONSUMER_SECRET) {
        console.error('❌ Credenciais não configuradas!');
        return;
    }
    
    const auth = Buffer.from(`${WC_CONSUMER_KEY}:${WC_CONSUMER_SECRET}`).toString('base64');
    
    try {
        // Testar endpoint de clientes
        const customersUrl = `${WC_BASE_URL}/wp-json/wc/v3/customers`;
        console.log('\n📡 Testando endpoint de clientes:', customersUrl);
        
        const response = await fetch(customersUrl, {
            method: 'GET',
            headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/json',
            },
        });
        
        const data = await response.json();
        
        if (response.ok) {
            console.log('✅ Conexão com API WooCommerce bem-sucedida!');
            console.log(`📊 Clientes encontrados: ${data.length}`);
            if (data.length > 0) {
                console.log(`🔍 Primeiro cliente - ID: ${data[0].id}, Nome: ${data[0].first_name} ${data[0].last_name}`);
            }
        } else {
            console.error('❌ Erro na API:', response.status, data);
        }
        
    } catch (error) {
        console.error('❌ Erro de conexão:', error.message);
    }
}

testWooCommerceAPI();
