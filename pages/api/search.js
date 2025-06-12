import { gql } from "@apollo/client";
import client from '../../src/components/ApolloClient';

/**
 * Endpoint para buscar produtos por termo de pesquisa
 * 
 * Esta API aceita um termo de busca e retorna produtos que correspondem
 * ao termo no título, descrição ou propriedades.
 */
export default async function handler(req, res) {
  try {
    const { query, per_page = 12, page = 1 } = req.query;
    
    if (!query || query.trim() === '') {
      return res.status(400).json({ 
        error: true,
        message: "O termo de busca é obrigatório" 
      });
    }
    
    console.group("API Request: /api/search");
    console.log("Parâmetros:", { query, per_page, page });
    
    // Query GraphQL para buscar produtos
    const SEARCH_PRODUCTS_QUERY = gql`
      query SearchProducts($search: String!, $first: Int, $after: String) {
        products(
          where: {
            search: $search
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
                onSale
                stockStatus
                stockQuantity
              }
              ... on VariableProduct {
                price
                regularPrice
                salePrice
                onSale
                stockStatus
                stockQuantity
              }
            }
          }
        }
      }
    `;
    
    // Variáveis para a query
    const variables = {
      search: query,
      first: parseInt(per_page),
      after: page > 1 ? btoa(`arrayconnection:${(page-1) * parseInt(per_page) - 1}`) : null
    };
    
    console.log("⏳ Executando consulta de pesquisa GraphQL...");
    const { data, errors } = await client.query({
      query: SEARCH_PRODUCTS_QUERY,
      variables,
      fetchPolicy: 'no-cache' // Garante dados atualizados
    });
    
    if (errors) {
      console.error("❌ Erros na consulta GraphQL:", errors);
      return res.status(500).json({
        error: true,
        message: "Falha na consulta GraphQL",
        errors
      });
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
        stock_quantity: product.stockQuantity || 0,
        on_sale: hasDiscount,
        average_rating: product.averageRating || '0',
        image: product.image ? {
          id: product.image.id,
          src: product.image.sourceUrl,
          alt: product.image.altText || product.name
        } : null,
        images: product.image ? [{
          id: product.image.id,
          src: product.image.sourceUrl,
          alt: product.image.altText || product.name
        }] : []
      };
    }) || [];
    
    console.log(`✅ ${products.length} produtos encontrados para o termo: "${query}"`);
    console.groupEnd();
    
    // Retorna os produtos formatados
    return res.status(200).json(products);
    
  } catch (error) {
    console.error("❌ Erro ao processar a solicitação de pesquisa:", error);
    console.groupEnd();
    
    return res.status(500).json({
      error: true,
      message: "Erro interno do servidor",
      details: error.message
    });
  }
}
