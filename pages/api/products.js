import { gql } from "@apollo/client";
import client from '../../src/components/ApolloClient';
import { PRODUCTS_BY_CATEGORY_QUERY, PRODUCTS_ON_SALE_QUERY, FEATURED_PRODUCTS_QUERY } from '../../src/queries/product-queries';

/**
 * Endpoint para buscar produtos com filtragem opcional
 * Versão GraphQL - padronizando a abordagem de acesso a dados
 * 
 * Esta API serve como um proxy para consultas GraphQL do WooCommerce,
 * permitindo que o front-end mantenha sua simplicidade de uso.
 */
export default async function handler(req, res) {
  try {
    const { category, per_page = 4, page = 1, on_sale, featured, id } = req.query;
    
    console.group("API Request: /api/products");
    console.log("Parâmetros:", { category, per_page, page, on_sale, featured, id });
    
    // Caso especial: buscar produto por ID específico
    if (id) {
      console.log(`🎯 Buscando produto específico por ID: ${id}`);
      const PRODUCT_BY_ID_QUERY = gql`
        query GetProductById($id: ID!) {
          product(id: $id, idType: DATABASE_ID) {
            id
            databaseId
            name
            slug
            description
            shortDescription
            type
            onSale
            averageRating
            reviewCount
            image {
              id
              sourceUrl
              altText
              title
            }
            ... on SimpleProduct {
              price(format: RAW)
              regularPrice(format: RAW)
              salePrice(format: RAW)
            }
            ... on VariableProduct {
              price(format: RAW)
              regularPrice(format: RAW)
              salePrice(format: RAW)
            }
          }
        }
      `;
      
      try {
        const { data } = await client.query({
          query: PRODUCT_BY_ID_QUERY,
          variables: { id: parseInt(id) }
        });
        
        if (data?.product) {
          const product = {
            id: data.product.databaseId || data.product.id,
            databaseId: data.product.databaseId,
            name: data.product.name,
            slug: data.product.slug,
            description: data.product.description,
            shortDescription: data.product.shortDescription,
            price: data.product.price || data.product.regularPrice || '',
            regularPrice: data.product.regularPrice || '',
            salePrice: data.product.salePrice || '',
            onSale: data.product.onSale || false,
            averageRating: data.product.averageRating || 0,
            reviewCount: data.product.reviewCount || 0,
            image: data.product.image?.sourceUrl || null,
            imageAlt: data.product.image?.altText || data.product.name
          };
          
          console.log(`✅ Produto encontrado: ${product.name} (${product.slug})`);
          console.groupEnd();
          return res.status(200).json([product]); // Retorna array para compatibilidade
        } else {
          console.warn(`⚠️ Produto não encontrado para ID: ${id}`);
          console.groupEnd();
          return res.status(404).json({ error: 'Produto não encontrado' });
        }
      } catch (error) {
        console.error(`❌ Erro ao buscar produto por ID ${id}:`, error);
        console.groupEnd();
        return res.status(500).json({ error: 'Erro interno do servidor' });
      }
    }
    
    // Lógica original para busca de múltiplos produtos
    // Seleciona a query apropriada baseada nos parâmetros
    let query;
    if (featured === 'true') {
      query = FEATURED_PRODUCTS_QUERY;
      console.log("🔍 Usando FEATURED_PRODUCTS_QUERY para buscar produtos em destaque");
    } else if (on_sale === 'true') {
      query = PRODUCTS_ON_SALE_QUERY;
      console.log("🔍 Usando PRODUCTS_ON_SALE_QUERY");
    } else {
      query = PRODUCTS_BY_CATEGORY_QUERY;
      console.log("🔍 Usando PRODUCTS_BY_CATEGORY_QUERY");
    }
      
    // Variáveis para a query
    const variables = {
      first: parseInt(per_page),
      after: page > 1 ? btoa(`arrayconnection:${(page-1) * parseInt(per_page) - 1}`) : null
    };
    
    // Adiciona slug da categoria se fornecida
    if (category && !featured) {
      variables.categorySlug = Array.isArray(category) ? category : [category];
    }
    
    // Adiciona filtro por marca (brand) se fornecido
    if (req.query.brand) {
      let PRODUCTS_BY_BRAND_QUERY;
      let useBrand = true;
      try {
        PRODUCTS_BY_BRAND_QUERY = gql`
          query ProductsByBrand($brand: String, $first: Int, $after: String) {
            products(
              where: {
                attribute: "pa_brand"
                attributeTerm: $brand
                status: "publish"
              }
              first: $first
              after: $after
            ) {
              edges {
                node {
                  id
                  databaseId
                  name
                  slug
                  type
                  averageRating
                  shortDescription
                  image {
                    id
                    sourceUrl
                    altText
                  }
                  ... on SimpleProduct {
                    price
                    regularPrice
                    salePrice
                    stockStatus
                    stockQuantity
                  }
                  ... on VariableProduct {
                    price
                    regularPrice
                    salePrice
                    stockStatus
                    stockQuantity
                  }
                }
              }
            }
          }
        `;
        query = PRODUCTS_BY_BRAND_QUERY;
        variables.brand = req.query.brand;
        console.log("🔍 Usando PRODUCTS_BY_BRAND_QUERY para buscar produtos por marca", variables.brand);
        // Testa a query de marca antes de seguir
        const testResult = await client.query({
          query,
          variables,
          fetchPolicy: 'no-cache'
        });
        if (!testResult?.data?.products?.edges?.length) {
          throw new Error('Nenhum produto encontrado por marca, usando fallback por categoria');
        }
      } catch (e) {
        // Fallback: usa categoria
        query = PRODUCTS_BY_CATEGORY_QUERY;
        variables.categorySlug = Array.isArray(req.query.brand) ? req.query.brand : [req.query.brand];
        console.log("🔍 Fallback: Usando PRODUCTS_BY_CATEGORY_QUERY para buscar produtos por categoria", variables.categorySlug);
      }
    }
    
    console.log('Executando consulta GraphQL com variáveis:', variables);
    
    // Executa a query GraphQL
    console.log("⏳ Executando consulta GraphQL...");
    const { data, errors } = await client.query({
      query,
      variables,
      fetchPolicy: 'no-cache' // Garante dados atualizados
    });
    
    if (errors) {
      console.error("❌ Erros na consulta GraphQL:", errors);
      throw new Error("Falha na consulta GraphQL");
    }
    
    console.log("✅ Consulta GraphQL executada com sucesso");
    
    // Verificar a estrutura dos dados
    console.log("Estrutura da resposta:", {
      temProdutos: !!data?.products,
      temEdges: !!data?.products?.edges,
      quantidadeProdutos: data?.products?.edges?.length || 0
    });
    
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
            src: product.image.sourceUrl || '/banners/placeholder.jpg',
            alt: product.image.altText || product.name || 'Produto'
          }
        ] : [{ src: '/banners/placeholder.jpg', alt: product.name || 'Produto' }],
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
    
    // Para produtos em destaque, mostrar informações específicas
    if (featured === 'true') {
      console.log(`🌟 ${products.length} produtos em destaque encontrados`);
      products.forEach((p, idx) => {
        console.log(`  ${idx + 1}. ${p.name} (${p.id}) - Tem imagem: ${!!p.images?.[0]?.src}`);
      });
    }
    
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
    
    // Formato da resposta depende do tipo de consulta
    if (on_sale === 'true') {
      res.status(200).json({
        products: products,
        saleEndDate: globalSaleEndDate
      });
    } else if (featured === 'true' && products.length === 0) {
      // Se não encontrou produtos em destaque, busca os mais recentes/populares
      console.log("⚠️ Nenhum produto em destaque encontrado, buscando produtos populares/recentes...");
      
      try {
        const { data: popularData } = await client.query({
          query: gql`
            query RecentProducts($first: Int) {
              products(first: $first, where: {orderby: {field: DATE, order: DESC}}) {
                edges {
                  node {
                    id
                    databaseId
                    name
                    slug
                    type
                    averageRating
                    image {
                      id
                      sourceUrl
                      altText
                    }
                    ... on SimpleProduct {
                      price
                      regularPrice
                      stockStatus
                    }
                    ... on VariableProduct {
                      price
                      regularPrice
                      stockStatus
                    }
                  }
                }
              }
            }
          `,
          variables: { first: parseInt(per_page) },
          fetchPolicy: 'no-cache'
        });
        
        // Processar produtos populares para o mesmo formato
        const popularProducts = popularData?.products?.edges?.map(edge => {
          const product = edge.node;
          
          return {
            id: product.databaseId || product.id,
            name: product.name,
            price: product.price || '0',
            regular_price: product.regularPrice || product.price || '0',
            slug: product.slug,
            on_sale: false,
            images: product.image ? [
              {
                src: product.image.sourceUrl,
                alt: product.image.altText || product.name
              }
            ] : [{ src: '/banners/placeholder.jpg' }],
          };
        }) || [];
        
        console.log(`🆕 Substituindo com ${popularProducts.length} produtos recentes`);
        res.status(200).json(popularProducts);
      } catch (fallbackError) {
        console.error("❌ Erro ao buscar produtos alternativos:", fallbackError);
        res.status(200).json([]);  // Array vazio em vez de mock data
      }
    } else {
      res.status(200).json(products);
    }
    console.groupEnd();  } catch (error) {
    console.error('❌ Erro ao buscar produtos via GraphQL:', error);
    
    // Retornar erro real em vez de dados mockados
    res.status(500).json({
      error: 'Erro ao buscar produtos',
      message: error.message,
      products: []
    });
  }
}
