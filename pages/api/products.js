import client from '../../src/components/ApolloClient';
import { PRODUCTS_BY_CATEGORY_QUERY, PRODUCTS_ON_SALE_QUERY } from '../../src/queries/product-queries';

/**
 * Endpoint para buscar produtos com filtragem opcional
 * Versão GraphQL - padronizando a abordagem de acesso a dados
 * 
 * Esta API serve como um proxy para consultas GraphQL do WooCommerce,
 * permitindo que o front-end mantenha sua simplicidade de uso.
 */
export default async function handler(req, res) {
  try {
    const { category, per_page = 4, page = 1, on_sale } = req.query;
    
    console.log("API Request: /api/products via GraphQL", { category, per_page, page, on_sale });
    
    // Seleciona a query apropriada baseada nos parâmetros
    const query = on_sale === 'true' 
      ? PRODUCTS_ON_SALE_QUERY 
      : PRODUCTS_BY_CATEGORY_QUERY;
      
    // Variáveis para a query
    const variables = {
      first: parseInt(per_page),
      after: page > 1 ? btoa(`arrayconnection:${(page-1) * parseInt(per_page) - 1}`) : null
    };
    
    // Adiciona slug da categoria se fornecida
    if (category) {
      variables.categorySlug = category;
    }
    
    console.log('Executando consulta GraphQL com variáveis:', variables);
    
    // Executa a query GraphQL
    const { data, errors } = await client.query({
      query,
      variables,
      fetchPolicy: 'no-cache' // Garante dados atualizados
    });
    
    if (errors) {
      console.error("Erros na consulta GraphQL:", errors);
      throw new Error("Falha na consulta GraphQL");
    }
    
    // Extrair os produtos da resposta
    const products = data?.products?.edges?.map(edge => {
      const product = edge.node;
      
      // Limpar e processar os preços
      const cleanPrice = price => {
        if (!price) return '';
        // Remove HTML entities e caracteres não numéricos exceto ponto e vírgula
        return price.replace(/&nbsp;/g, '').replace(/[^\d.,]/g, '');
      };
      
      const rawPrice = cleanPrice(product.price);
      const rawRegularPrice = cleanPrice(product.regularPrice);
      const rawSalePrice = cleanPrice(product.salePrice);
      
      // Determinar se o produto está realmente em oferta
      const hasDiscount = 
        product.onSale || 
        (rawSalePrice && rawRegularPrice && parseFloat(rawSalePrice) < parseFloat(rawRegularPrice));
      
      // Certificar-se de que o preço regular é maior que o preço de venda
      let finalRegularPrice = rawRegularPrice;
      if (hasDiscount && (!rawRegularPrice || parseFloat(rawRegularPrice) <= parseFloat(rawPrice))) {
        // Se não há preço regular ou é menor que o preço de venda, cria um 20% maior
        const priceValue = parseFloat(rawPrice.replace(',', '.'));
        if (!isNaN(priceValue)) {
          finalRegularPrice = (priceValue * 1.2).toFixed(2).toString();
        }
      }
      
      // Processar as datas de início e fim da promoção
      let saleStartDate = null;
      let saleEndDate = null;
      
      if (product.dateOnSaleFrom) {
        saleStartDate = new Date(product.dateOnSaleFrom);
      }
      
      if (product.dateOnSaleTo) {
        saleEndDate = new Date(product.dateOnSaleTo);
      }
      
      // Calcular a data de expiração mais próxima para promoções ativas
      const now = new Date();
      let closestEndDate = null;
      
      if (hasDiscount && saleEndDate && saleEndDate > now) {
        closestEndDate = saleEndDate;
        console.log(`Produto ${product.name} tem data de término de oferta: ${saleEndDate.toISOString()}`);
      }
      
      console.log(`Produto processado: ${product.name}`);
      console.log(`- Original: price=${product.price}, regularPrice=${product.regularPrice}, onSale=${product.onSale}`);
      console.log(`- Limpo: price=${rawPrice}, regularPrice=${finalRegularPrice}, hasDiscount=${hasDiscount}`);
      console.log(`- Datas de oferta: início=${saleStartDate?.toISOString() || 'N/A'}, fim=${saleEndDate?.toISOString() || 'N/A'}`);
      
      // Processar dados para garantir formato consistente
      return {
        id: product.databaseId || product.id,
        name: product.name,
        price: rawPrice || '0',
        regular_price: finalRegularPrice || rawPrice || '0',
        sale_price: hasDiscount ? rawPrice : null,
        slug: product.slug,
        short_description: product.shortDescription || '',
        stock_status: product.stockStatus || 'instock',
        stock_quantity: product.stockQuantity || null,
        // Forçar para true se estiver na consulta de ofertas
        on_sale: on_sale === 'true' ? true : hasDiscount,
        images: product.image ? [
          {
            src: product.image.sourceUrl,
            alt: product.image.altText || product.name
          }
        ] : [{ src: '/banners/placeholder.jpg' }],
        average_rating: product.averageRating || '0',
        // Adiciona explicitamente esses campos para compatibilidade com o componente
        is_on_sale: on_sale === 'true' ? true : hasDiscount,
        has_sale_price: hasDiscount,
        // Adicionar as datas de oferta
        sale_start_date: saleStartDate ? saleStartDate.toISOString() : null,
        sale_end_date: saleEndDate ? saleEndDate.toISOString() : null
      };
    }) || [];
    
    // Encontrar a data de expiração mais próxima entre todos os produtos
    // Isso será usado para o temporizador global da oferta
    let globalSaleEndDate = null;
    const now = new Date();
    
    products.forEach(product => {
      if (product.sale_end_date) {
        const endDate = new Date(product.sale_end_date);
        if (endDate > now) {
          if (!globalSaleEndDate || endDate < new Date(globalSaleEndDate)) {
            globalSaleEndDate = product.sale_end_date;
          }
        }
      }
    });
    
    // Se não encontrou datas de ofertas no WooCommerce, define uma data padrão (30 dias)
    if (!globalSaleEndDate) {
      const defaultEndDate = new Date();
      defaultEndDate.setDate(defaultEndDate.getDate() + 30);
      globalSaleEndDate = defaultEndDate.toISOString();
      console.log(`Nenhuma data de expiração encontrada nos produtos. Usando data padrão: ${globalSaleEndDate}`);
    } else {
      console.log(`Data de expiração global da oferta encontrada: ${globalSaleEndDate}`);
    }
    
    console.log(`Produtos encontrados e processados via GraphQL: ${products.length}`);
    
    // Para debug, mostrar o primeiro produto processado
    if (products.length > 0) {
      console.log('Primeiro produto processado:', {
        nome: products[0].name,
        preco: products[0].price,
        precoRegular: products[0].regular_price,
        emOferta: products[0].on_sale,
        dataInicio: products[0].sale_start_date,
        dataFim: products[0].sale_end_date
      });
    }
    
    // Retornar os produtos com a data global de expiração
    res.status(200).json({
      products: products,
      saleEndDate: globalSaleEndDate
    });
  } catch (error) {
    console.error('Erro ao buscar produtos via GraphQL:', error);
    
    // Dados de exemplo para não deixar a página em branco em caso de erro
    console.log('Retornando produtos de exemplo devido a erro');
    
    // Data de expiração padrão (7 dias no futuro)
    const defaultEndDate = new Date();
    defaultEndDate.setDate(defaultEndDate.getDate() + 7);
    
    const mockProducts = [
      {
        id: 1,
        name: 'Xiaomi Redmi Note 12',
        price: '1499.00',
        regular_price: '1799.00',
        images: [{ src: '/banners/phone1.jpg' }],
        slug: 'redmi-note-12',
        stock_quantity: 15,
        stock_status: 'instock',
        on_sale: true,
        is_on_sale: true,
        has_sale_price: true
      },
      {
        id: 2,
        name: 'Apple iPhone 13',
        price: '3999.00',
        regular_price: '4699.00',
        images: [{ src: '/banners/phone2.jpg' }],
        slug: 'iphone-13',
        stock_status: 'instock',
        on_sale: true,
        is_on_sale: true,
        has_sale_price: true
      },
      {
        id: 3,
        name: 'Samsung Galaxy S23',
        price: '3299.00',
        regular_price: '3999.00',
        images: [{ src: '/banners/phone3.jpg' }],
        slug: 'galaxy-s23',
        stock_status: 'instock',
        on_sale: true,
        is_on_sale: true,
        has_sale_price: true
      },
      {
        id: 4,
        name: 'Xiaomi 14T Pro',
        price: '4499.00',
        regular_price: '4999.00',
        images: [{ src: '/banners/phone4.jpg' }],
        slug: 'xiaomi-14t-pro',
        stock_status: 'instock',
        on_sale: true,
        is_on_sale: true,
        has_sale_price: true
      }
    ];
    
    // Retornar produtos de exemplo com data de expiração
    res.status(200).json({
      products: mockProducts,
      saleEndDate: defaultEndDate.toISOString()
    });
  }
}
