import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './CountdownOffers.module.css';

// Componente para o cartão do produto
const ProductCard = ({ product, discount }) => {
  // Formatar preço para o formato brasileiro
  const formatPrice = (price) => {
    console.group(`Formatando preço: "${price}" (${typeof price})`);
    
    if (!price) {
      console.log("Preço vazio, retornando R$ 0,00");
      console.groupEnd();
      return 'R$ 0,00';
    }
    
    try {
      // Converter o preço para número antes de formatar
      let numericValue;
      
      if (typeof price === 'string') {
        // Limpar o preço, removendo caracteres não numéricos exceto pontos e vírgulas
        const cleanPrice = price.replace(/[^\d.,]/g, '');
        
        // Tratar casos específicos de formatação
        if (cleanPrice.includes('.') && cleanPrice.includes(',')) {
          // Formato brasileiro: 1.000,00
          const withoutDots = cleanPrice.replace(/\./g, '');
          numericValue = parseFloat(withoutDots.replace(',', '.'));
          console.log(`Preço no formato brasileiro com pontos e vírgulas: ${price} -> ${numericValue}`);
        } else if (cleanPrice.includes(',')) {
          // Formato com vírgula decimal: 1000,00
          numericValue = parseFloat(cleanPrice.replace(',', '.'));
          console.log(`Preço no formato com vírgula decimal: ${price} -> ${numericValue}`);
        } else if (cleanPrice.includes('.')) {
          // Formato americano: 1000.00
          numericValue = parseFloat(cleanPrice);
          console.log(`Preço no formato americano: ${price} -> ${numericValue}`);
        } else if (/^\d+$/.test(cleanPrice)) {
          // Número puro: "9000"
          numericValue = parseInt(cleanPrice, 10);
          console.log(`Preço é número puro: ${price} -> ${numericValue}`);
        } else {
          // Último recurso
          numericValue = parseFloat(cleanPrice);
          console.log(`Preço tratado como valor genérico: ${price} -> ${numericValue}`);
        }
      } else if (typeof price === 'number') {
        numericValue = price;
        console.log(`Preço já é número: ${price}`);
      }
      
      if (isNaN(numericValue)) {
        console.warn(`Conversão falhou: "${price}" não é um número válido`);
        console.groupEnd();
        return 'R$ 0,00';
      }
      
      // Formatação final para moeda brasileira
      const formatted = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(numericValue);
      
      console.log(`Preço formatado final: ${formatted}`);
      console.groupEnd();
      return formatted;
    } catch (e) {
      console.error(`Erro ao formatar preço:`, e);
      console.groupEnd();
      return 'R$ 0,00';
    }
  };

  // Verificar estoque limitado (menos de 5 unidades)
  const isLimitedStock = product.stock_quantity && product.stock_quantity < 5;
  
  // Criar URL segura para o produto
  const productLink = product.slug ? `/produto/${product.slug}` : '#';
  
  // Obter URL da imagem com fallback
  const getImageUrl = () => {
    if (product.images && product.images.length > 0 && product.images[0].src) {
      return product.images[0].src;
    }
    return '/banners/placeholder.jpg';
  };

  // Função para extrair e validar os preços do produto
  const getProductPrices = () => {
    // Logs detalhados do produto
    console.group(`[Produto: ${product.name || 'sem nome'} (ID: ${product.id})]`);
    console.log("Campos de preço brutos:");
    console.log(`- price: "${product.price}" (${typeof product.price})`);
    console.log(`- regular_price: "${product.regular_price}" (${typeof product.regular_price})`);
    console.log(`- sale_price: "${product.sale_price || 'não definido'}" (${typeof product.sale_price})`);
    console.log(`- on_sale: ${product.on_sale}`);
    console.log(`- is_on_sale: ${product.is_on_sale}`);
    console.log(`- has_sale_price: ${product.has_sale_price}`);

    // Vamos usar diretamente os campos tratados pela API
    let regularPrice = product.regular_price || product.price;
    let salePrice = product.price;
    
    // Verificar se os preços são válidos e extrair valores numéricos para cálculos
    // Esta função converte qualquer formato de preço para número
    const extractNumber = (priceStr) => {
      if (!priceStr) return 0;
      if (typeof priceStr === 'number') return priceStr;
      
      // Remover tudo exceto números, pontos e vírgulas
      const cleaned = priceStr.replace(/[^\d.,]/g, '');
      
      // Tratar diferentes formatos
      if (cleaned.includes('.') && cleaned.includes(',')) {
        // Formato brasileiro: 1.234,56
        return parseFloat(cleaned.replace(/\./g, '').replace(',', '.'));
      } else if (cleaned.includes(',')) {
        // Formato europeu: 1234,56
        return parseFloat(cleaned.replace(',', '.'));
      } else {
        // Formato americano ou número puro: 1234.56 ou 1234
        return parseFloat(cleaned);
      }
    };
    
    const regPriceNumeric = extractNumber(regularPrice);
    const salePriceNumeric = extractNumber(salePrice);
    
    console.log("Preços convertidos para números:");
    console.log(`- regPriceNumeric: ${regPriceNumeric}`);
    console.log(`- salePriceNumeric: ${salePriceNumeric}`);
    
    const hasValidPrices = !isNaN(regPriceNumeric) && !isNaN(salePriceNumeric);
    // Um produto está em oferta se qualquer um dos indicadores mostrar que sim
    const hasDiscount = product.on_sale || product.is_on_sale || product.has_sale_price || 
                        (hasValidPrices && regPriceNumeric > salePriceNumeric && regPriceNumeric > 0);
    
    let discountPercent = 0;
    if (hasDiscount && hasValidPrices && regPriceNumeric > 0) {
      discountPercent = Math.round((1 - salePriceNumeric / regPriceNumeric) * 100);
      console.log(`Produto com desconto: ${discountPercent}%`);
    } else {
      console.log("Produto sem desconto detectado");
    }
    
    const result = {
      regularPrice,
      salePrice,
      hasDiscount,
      discountPercent
    };
    
    console.log("Resultado final:", result);
    console.groupEnd();
    
    return result;
  };
  
  // Obter preços reais diretamente dos dados do WooCommerce
  const priceData = getProductPrices();
  
  return (
    <div className={styles.productCard}>
      {priceData.hasDiscount && priceData.discountPercent > 0 && (
        <div className={styles.discountTag}>
          <span>-{priceData.discountPercent}%</span>
        </div>
      )}
      
      <Link href={productLink}>
        <a className={styles.productLink}>
          <div className={styles.productImage}>
            <img 
              src={getImageUrl()} 
              alt={product.name || 'Produto'} 
            />
          </div>
          
          <div className={styles.productInfo}>
            <h3 className={styles.productName}>{product.name || 'Produto sem nome'}</h3>
            
            <div className={styles.productPrices}>
              {/* Mostrar preço regular apenas se houver desconto */}
              {priceData.hasDiscount && (
                <div className={styles.priceWrapper}>
                  <span className={styles.priceLabel}>De:</span>
                  <span className={styles.regularPrice}>
                    {formatPrice(priceData.regularPrice)}
                  </span>
                </div>
              )}
              
              <div className={styles.priceWrapper}>
                <span className={styles.priceLabel}>{priceData.hasDiscount ? 'Por:' : 'Preço:'}</span>
                <span className={styles.salePrice}>
                  {formatPrice(priceData.salePrice)}
                </span>
              </div>
              
              {priceData.hasDiscount && priceData.discountPercent > 0 && (
                <div className={styles.saveInfo}>
                  <span>Economize {priceData.discountPercent}%</span>
                </div>
              )}
            </div>
            
            <div className={styles.installments}>
              em até <strong>12x</strong> sem juros
            </div>
            
            {isLimitedStock && (
              <div className={styles.stockWarning}>
                Apenas {product.stock_quantity} {product.stock_quantity === 1 ? 'unidade' : 'unidades'} disponível!
              </div>
            )}
          </div>
        </a>
      </Link>
      
      <button className={styles.addToCart}>
        Adicionar ao Carrinho
      </button>
    </div>
  );
};

const CountdownOffers = () => {
  // Estado para o tempo restante da oferta
  const [timeLeft, setTimeLeft] = useState({
    hours: '00',
    minutes: '00',
    seconds: '00'
  });
  
  // Estado para os produtos em oferta
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Estado para armazenar a data de expiração mais próxima
  const [endTime, setEndTime] = useState(null);
  
  // Buscar produtos em oferta
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.group("Busca de produtos para ofertas");
        const fetchStartTime = performance.now();
        console.log(`Iniciando busca: ${new Date().toLocaleString()}`);
        
        // Tentar buscar produtos em oferta primeiro
        let productData = [];
        let saleEndDateFromAPI = null;
        
        try {
          console.log("Buscando produtos em oferta via GraphQL...");
          const response = await fetch('/api/products?on_sale=true&per_page=4');
          
          if (!response.ok) {
            console.warn(`API retornou status ${response.status}: ${response.statusText}`);
            throw new Error(`API retornou status ${response.status}: ${response.statusText}`);
          }
          
          const responseData = await response.json();
          
          // O formato mudou, agora temos {products: [...], saleEndDate: "..."}
          if (responseData.products && Array.isArray(responseData.products)) {
            productData = responseData.products;
            saleEndDateFromAPI = responseData.saleEndDate;
            
            console.log(`✅ Recebidos ${productData.length} produtos em oferta`);
            console.log(`✅ Data de expiração da oferta: ${saleEndDateFromAPI}`);
            
            if (saleEndDateFromAPI) {
              // Usar a data de expiração da API
              try {
                const apiEndDate = new Date(saleEndDateFromAPI);
                setEndTime(apiEndDate);
                console.log(`Data de expiração definida para: ${apiEndDate.toLocaleString()}`);
              } catch (dateError) {
                console.error(`Erro ao processar data de expiração: ${dateError}`);
                // Fallback para data padrão
                const fallbackDate = new Date();
                fallbackDate.setDate(fallbackDate.getDate() + 30);
                setEndTime(fallbackDate);
              }
            } else {
              // Se não recebeu data da API, usar padrão
              const defaultDate = new Date();
              defaultDate.setDate(defaultDate.getDate() + 30);
              setEndTime(defaultDate);
              console.log(`Usando data de expiração padrão: ${defaultDate.toLocaleString()}`);
            }
          } else {
            // Formato antigo ou inesperado
            console.warn("Formato de resposta inesperado:", responseData);
            productData = Array.isArray(responseData) ? responseData : [];
            
            // Data padrão
            const defaultDate = new Date();
            defaultDate.setDate(defaultDate.getDate() + 30);
            setEndTime(defaultDate);
          }
          
          // Validação dos dados recebidos e debug
          if (productData && productData.length > 0) {
            console.log("Primeiro produto recebido:", {
              nome: productData[0].name,
              preco: productData[0].price,
              precoRegular: productData[0].regular_price,
              emOferta: productData[0].on_sale || productData[0].is_on_sale,
              dataFim: productData[0].sale_end_date
            });
          } else {
            console.warn("Nenhum produto em oferta encontrado");
            throw new Error("Nenhum produto em oferta encontrado");
          }
        } catch (error) {
          console.warn("❌ Falha ao buscar produtos em oferta:", error);
          
          // Vamos tentar buscar produtos regulares como fallback
          try {
            console.log("Buscando produtos regulares via GraphQL...");
            const fallbackResponse = await fetch('/api/products?per_page=4');
            
            if (!fallbackResponse.ok) {
              throw new Error(`Fallback API retornou status ${fallbackResponse.status}`);
            }
            
            productData = await fallbackResponse.json();
            console.log(`✅ Recebidos ${productData.length} produtos regulares`);
            
            if (!productData || productData.length === 0) {
              throw new Error("Nenhum produto regular encontrado");
            }
          } catch (fallbackError) {
            console.error("❌ Falha no fallback para produtos regulares:", fallbackError);
            throw fallbackError;
          }
        }
        
        // Verificar explicitamente que temos um array de produtos
        if (!Array.isArray(productData)) {
          console.error("Dados de produto inválidos:", productData);
          throw new Error("Formato de dados inválido");
        }
        
        // Definir produtos encontrados
        setProducts(productData);
        
        // Log de conclusão
        const fetchEndTime = performance.now();
        console.log(`✨ Busca concluída em ${(fetchEndTime - fetchStartTime).toFixed(2)}ms`);
        console.groupEnd();
        
      } catch (error) {
        console.error("❌ Erro ao buscar produtos:", error);
        setError(`Falha ao carregar ofertas: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProducts();
  }, []);
  
  // Atualizar o contador quando endTime mudar ou a cada segundo
  useEffect(() => {
    if (!endTime) return;
    
    const updateCountdown = () => {
      const now = new Date();
      const difference = endTime - now;
      
      // Quando a oferta expira
      if (difference <= 0) {
        setTimeLeft({ hours: '00', minutes: '00', seconds: '00' });
        return;
      }
      
      // Calcular horas, minutos e segundos restantes
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);
      
      // Formatar os números para sempre terem dois dígitos
      setTimeLeft({
        hours: hours.toString().padStart(2, '0'),
        minutes: minutes.toString().padStart(2, '0'),
        seconds: seconds.toString().padStart(2, '0')
      });
    };
    
    // Atualizar imediatamente
    updateCountdown();
    
    // Configurar o intervalo
    const timer = setInterval(updateCountdown, 1000);
    
    return () => clearInterval(timer);
  }, [endTime]);

  // Verificar se a oferta ainda está válida
  const offerIsActive = endTime ? new Date() < endTime : true;
  
  return (
    <section className={styles.countdown}>
      <div className={styles.container}>
        <div className={styles.countBox}>
          <div className={styles.empty}></div>
          <h2>Ofertas Exclusivas</h2>
          <hr className={styles.divider} />
          <div className={styles.offerEndInfo}>
            {endTime && (
              <>
                <p className={styles.endTimeLabel}>
                  Termina em:
                </p>
                <div className={styles.endTimeDate}>
                  {endTime.toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                  })}
                </div>
              </>
            )}
            <div className={styles.time}>  
              <span className={styles.hour}>{timeLeft.hours}</span>
              <p className={styles.colon}>:</p>
              <span className={styles.min}>{timeLeft.minutes}</span>
              <p className={styles.colon}>:</p>
              <span className={styles.sec}>{timeLeft.seconds}</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className={styles.productGrid}>
        {loading ? (
          <div className={styles.loading}>Carregando ofertas...</div>
        ) : error ? (
          <div className={styles.error}>{error}</div>
        ) : !offerIsActive ? (
          <div className={styles.expired}>Esta oferta já expirou!</div>
        ) : products.length === 0 ? (
          <div className={styles.noProducts}>Nenhuma oferta disponível no momento.</div>
        ) : (
          products.map(product => (
            <ProductCard 
              key={product.id}
              product={product}
              discount={0}
            />
          ))
        )}
      </div>
    </section>
  );
};

export default CountdownOffers;
