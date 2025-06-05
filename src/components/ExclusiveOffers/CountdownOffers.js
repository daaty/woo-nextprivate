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
  const productLink = product.slug ? `/product/${product.slug}` : '#';
  
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

  // Função para adicionar ao carrinho usando a mesma lógica do AddToCartButton
  const handleAddToCart = (e) => {
    e.preventDefault();
    
    const button = e.currentTarget;
    
    // Não permitir múltiplos cliques
    if (button.classList.contains('loading') || button.disabled) {
      return;
    }
    
    // Salvar estado original do botão
    const originalContent = button.innerHTML;
    const originalStyles = {
      background: button.style.background,
      color: button.style.color,
      border: button.style.border,
      padding: button.style.padding,
      borderRadius: button.style.borderRadius,
      fontSize: button.style.fontSize,
      fontWeight: button.style.fontWeight,
      textTransform: button.style.textTransform,
      boxShadow: button.style.boxShadow,
    };
    
    // Adicionar classe de loading e desabilitar o botão
    button.classList.add('loading');
    button.disabled = true;
    
    // FASE 1: MOSTRAR SPINNER DE LOADING
    button.innerHTML = '';
    button.style.position = 'relative';
    button.style.minHeight = '48px';
    
    const spinnerContainer = document.createElement('div');
    spinnerContainer.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      display: flex;
      align-items: center;
      justify-content: center;
    `;
    
    spinnerContainer.innerHTML = `
      <style>
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes spin-reverse {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(-360deg); }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.1); opacity: 0.8; }
        }
        @keyframes successPulse {
          0% { transform: scale(0.7); opacity: 0.5; }
          50% { transform: scale(1.05); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
      </style>
      <div style="
          position: relative;
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
      ">
          <div style="
              position: absolute;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              border: 2px solid rgba(0, 168, 225, 0.3);
              border-radius: 50%;
              animation: pulse 2s infinite;
          "></div>
          <div style="
              position: absolute;
              width: 24px;
              height: 24px;
              border: 2px solid transparent;
              border-left: 2px solid #00a8e1;
              border-bottom: 2px solid #ff6900;
              border-radius: 50%;
              animation: spin-reverse 1.5s linear infinite;
          "></div>
      </div>
    `;
    
    button.appendChild(spinnerContainer);
    
    // Processar a adição ao carrinho de forma assíncrona
    (async () => {
      try {
        // Extrair dados do produto
        const productData = {
          id: product.id,
          name: product.name || 'Produto sem nome',
          price: priceData.salePrice || product.price,
          image: getImageUrl()
        };
        
        console.log('🔍 [CountdownOffers Button] Dados do produto:', productData);
        
        // Chamar a API REST v2
        const response = await fetch('/api/v2/cart', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            product: {
              id: productData.id,
              name: productData.name,
              price: productData.price,
              image: productData.image
            },
            quantity: 1
          })
        });

        const result = await response.json();
        
        if (result.success) {
          console.log('✅ [CountdownOffers Button] Produto adicionado com sucesso!');
          
          // FASE 2: MOSTRAR FEEDBACK DE SUCESSO
          button.innerHTML = '';
          button.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
          button.style.border = 'none';
          button.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)';
          button.style.color = 'white';
          
          // Container do ícone de sucesso
          const successContainer = document.createElement('div');
          successContainer.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
          `;
          
          successContainer.innerHTML = `
            <div style="
              width: 40px;
              height: 40px;
              display: flex;
              align-items: center;
              justify-content: center;
              background: white;
              border-radius: 50%;
              animation: successPulse 0.6s ease-out;
            ">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="3">
                <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          `;
          
          button.appendChild(successContainer);
          
          // Vibração de sucesso no mobile
          if (navigator.vibrate) {
            navigator.vibrate(100);
          }
          
          // Mostrar notificação de sucesso se disponível
          if (window.showNotification) {
            window.showNotification('Produto adicionado ao carrinho!', 'success');
          }
          
          // Atualizar contador do carrinho se disponível
          if (window.updateCartCount) {
            window.updateCartCount();
          }
          
          // Disparar evento personalizado para atualizar outras partes da aplicação
          window.dispatchEvent(new CustomEvent('cartUpdated', { 
            detail: { product: productData, quantity: 1 } 
          }));
          
          // Disparar evento específico para o contador do Layout
          window.dispatchEvent(new CustomEvent('productAddedToCart', {
            detail: {
              productId: productData.id,
              productName: productData.name,
              quantity: 1,
              timestamp: Date.now()
            }
          }));
          
          // FASE 3: AGUARDAR 2 SEGUNDOS E RESTAURAR O BOTÃO ORIGINAL
          setTimeout(() => {
            button.classList.remove('loading');
            button.disabled = false;
            button.innerHTML = originalContent;
            button.style.background = originalStyles.background;
            button.style.color = originalStyles.color;
            button.style.border = originalStyles.border;
            button.style.padding = originalStyles.padding;
            button.style.borderRadius = originalStyles.borderRadius;
            button.style.fontSize = originalStyles.fontSize;
            button.style.fontWeight = originalStyles.fontWeight;
            button.style.textTransform = originalStyles.textTransform;
            button.style.boxShadow = originalStyles.boxShadow;
            button.style.minHeight = '';
            button.style.position = '';
          }, 2000);
          
        } else {
          throw new Error(result.error || 'Erro ao adicionar produto');
        }
        
      } catch (error) {
        console.error('❌ [CountdownOffers Button] Erro:', error);
        
        // FASE 2 (ERRO): MOSTRAR FEEDBACK DE ERRO
        button.innerHTML = '';
        button.style.background = 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
        button.style.border = 'none';
        button.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.3)';
        button.style.color = 'white';
        
        const errorContainer = document.createElement('div');
        errorContainer.style.cssText = `
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        `;
        
        errorContainer.innerHTML = `
          <div style="
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: white;
            border-radius: 50%;
          ">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="3">
              <line x1="18" y1="6" x2="6" y2="18" stroke-linecap="round" />
              <line x1="6" y1="6" x2="18" y2="18" stroke-linecap="round" />
            </svg>
          </div>
        `;
        
        button.appendChild(errorContainer);
        
        // Mostrar notificação de erro se disponível
        if (window.showNotification) {
          window.showNotification('Erro ao adicionar produto ao carrinho', 'error');
        }
        
        // FASE 3: AGUARDAR 2 SEGUNDOS E RESTAURAR O BOTÃO ORIGINAL
        setTimeout(() => {
          button.classList.remove('loading');
          button.disabled = false;
          button.innerHTML = originalContent;
          button.style.background = originalStyles.background;
          button.style.color = originalStyles.color;
          button.style.border = originalStyles.border;
          button.style.padding = originalStyles.padding;
          button.style.borderRadius = originalStyles.borderRadius;
          button.style.fontSize = originalStyles.fontSize;
          button.style.fontWeight = originalStyles.fontWeight;
          button.style.textTransform = originalStyles.textTransform;
          button.style.boxShadow = originalStyles.boxShadow;
          button.style.minHeight = '';
          button.style.position = '';
        }, 2000);
      }
    })();
  };
  
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
      
      <button 
        className={styles.addToCart}
        onClick={handleAddToCart}
        data-product-id={product.id}
        data-product-name={product.name}
        data-product-price={priceData.salePrice}
        data-product-image={getImageUrl()}
      >
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
        
        // Tentar buscar produtos em oferta
        try {
          console.log("Buscando produtos em oferta via GraphQL...");
          const response = await fetch('/api/products?on_sale=true&per_page=4');
          
          if (!response.ok) {
            console.warn(`API retornou status ${response.status}: ${response.statusText}`);
            throw new Error(`API retornou status ${response.status}: ${response.statusText}`);
          }
          
          // Nova estrutura de resposta: { products: [...], saleEndDate: "..." }
          const responseData = await response.json();
          
          if (responseData && responseData.products) {
            console.log(`✅ Recebidos ${responseData.products.length} produtos em oferta`);
            
            // Processar produtos
            setProducts(responseData.products);
            
            // Processar data de expiração
            if (responseData.saleEndDate) {
              try {
                const saleEndDate = new Date(responseData.saleEndDate);
                console.log(`✅ Data de expiração da oferta recebida: ${saleEndDate.toLocaleString()}`);
                setEndTime(saleEndDate);
              } catch (dateError) {
                console.error("Erro ao processar data de expiração:", dateError);
                // Fallback para data padrão
                const defaultDate = new Date();
                defaultDate.setDate(defaultDate.getDate() + 30);
                setEndTime(defaultDate);
              }
            } else {
              console.warn("Nenhuma data de expiração recebida, usando padrão");
              const defaultDate = new Date();
              defaultDate.setDate(defaultDate.getDate() + 30);
              setEndTime(defaultDate);
            }
            
            // Log detalhado do primeiro produto
            if (responseData.products.length > 0) {
              const firstProduct = responseData.products[0];
              console.log("Primeiro produto recebido:", {
                nome: firstProduct.name,
                preco: firstProduct.price,
                precoRegular: firstProduct.regular_price,
                emOferta: firstProduct.on_sale || firstProduct.is_on_sale,
                dataFim: firstProduct.sale_end_date
              });
            }
          } else {
            // Formato de resposta inesperado ou sem produtos
            console.warn("Resposta da API em formato inesperado:", responseData);
            throw new Error("Formato de resposta inválido ou nenhum produto encontrado");
          }
        } catch (error) {
          console.error("❌ Erro ao buscar produtos:", error);
          throw error; // Propagar para tratamento externo
        }
        
        // Log de conclusão
        const fetchEndTime = performance.now();
        console.log(`✨ Busca concluída em ${(fetchEndTime - fetchStartTime).toFixed(2)}ms`);
        console.groupEnd();
        
      } catch (error) {
        console.error("❌ Erro geral:", error);
        setError(`Falha ao carregar ofertas: ${error.message}`);
        setProducts([]);
        
        // Definir data padrão em caso de erro
        const defaultDate = new Date();
        defaultDate.setDate(defaultDate.getDate() + 30);
        setEndTime(defaultDate);
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
      
      // Calcular dias, horas, minutos e segundos restantes
      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);
      
      // Se faltam mais de 24 horas, mostrar o total de horas
      const totalHours = days * 24 + hours;
      
      // Formatar os números para sempre terem dois dígitos
      setTimeLeft({
        hours: totalHours.toString().padStart(2, '0'),
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
