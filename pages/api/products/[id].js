export default async function handler(req, res) {
  const { id } = req.query;
  
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    if (!id) {
      return res.status(400).json({ success: false, message: 'Product ID é obrigatório' });
    }

    console.log('[API Product Get] 📦 Buscando produto:', id);
    
    const startTime = Date.now();
    
    // Buscar produto via WooCommerce REST API
    const auth = Buffer.from(`${process.env.WC_CONSUMER_KEY}:${process.env.WC_CONSUMER_SECRET}`).toString('base64');
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_WORDPRESS_URL}/wp-json/wc/v3/products/${id}`, {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        throw new Error(`WooCommerce API error: ${response.status} ${response.statusText}`);
      }
      
      throw new Error(errorData.message || `Produto não encontrado: ${response.status}`);
    }

    const productData = await response.json();
    const responseTime = Date.now() - startTime;
    
    console.log(`[API Product Get] ✅ Produto encontrado em ${responseTime}ms:`, productData.name);

    // Formatar dados do produto
    const formattedProduct = {
      id: productData.id,
      name: productData.name,
      slug: productData.slug,
      price: parseFloat(productData.price),
      regular_price: parseFloat(productData.regular_price),
      sale_price: productData.sale_price ? parseFloat(productData.sale_price) : null,
      sku: productData.sku,
      weight: productData.weight,
      dimensions: productData.dimensions,
      images: productData.images?.map(img => ({
        id: img.id,
        src: img.src,
        name: img.name,
        alt: img.alt
      })) || [],
      categories: productData.categories?.map(cat => ({
        id: cat.id,
        name: cat.name,
        slug: cat.slug
      })) || [],
      tags: productData.tags?.map(tag => ({
        id: tag.id,
        name: tag.name,
        slug: tag.slug
      })) || [],
      attributes: productData.attributes || [],
      variations: productData.variations || [],
      stock_status: productData.stock_status,
      stock_quantity: productData.stock_quantity,
      manage_stock: productData.manage_stock,
      description: productData.description,
      short_description: productData.short_description
    };

    return res.status(200).json({
      success: true,
      product: formattedProduct,
      responseTime
    });

  } catch (error) {
    console.error('[API Product Get] ❌ Erro:', error);
    
    return res.status(500).json({
      success: false,
      message: error.message || 'Erro ao buscar produto',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
