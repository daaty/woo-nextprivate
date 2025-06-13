import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import Link from 'next/link';
import Layout from '../../src/components/Layout';
import { isEmpty } from 'lodash';
import Head from 'next/head';
import SEO from '../../src/components/seo/SEO';
import LoadingSpinner from '../../src/components/LoadingSpinner';
import { calculateInstallmentValue, INSTALLMENT_INTEREST_RATE, MAX_INSTALLMENTS } from '../../src/utils/installment-utils';
import { priceToNumber, formatPrice } from '../../src/utils/format-price';

// Importação de componentes
import GalleryCarousel from "../../src/components/single-product/gallery-carousel";
console.log('🔍 IMPORT: GalleryCarousel carregado na página [slug].js', GalleryCarousel);
import SectionContainer from '../../src/components/layout/SectionContainer';
import { ProductSchema, BreadcrumbSchema } from '../../src/components/seo/SchemaOrg';
import ProductReviews from "../../src/components/single-product/ProductReviews";
import ShareButtons from "../../src/components/single-product/ShareButtons";
import StarRating from "../../src/components/single-product/StarRating";

// Função utilitária para formatar preço em reais
const formatPriceBRL = (price) => {
  if (!price) return 'R$ 0,00';
  
  // Se o preço já vier formatado com R$, remove para processar corretamente
  if (typeof price === 'string') {
    // Remover 'R$', '&nbsp;', e outros caracteres HTML
    price = price.replace(/R\$\s*|&nbsp;|&#\d+;/g, '');
  }
  
  // Converte para número se for string
  let numericPrice;
  try {
    if (typeof price === 'string') {
      // Normaliza o formato: substitui vírgula por ponto para conversão numérica
      numericPrice = parseFloat(price.replace(/\./g, '').replace(',', '.'));
    } else {
      numericPrice = price;
    }
    
    // Se NaN ou inválido, retorna zero formatado
    if (isNaN(numericPrice)) {
      return 'R$ 0,00';
    }

    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2
    }).format(numericPrice);
  } catch (e) {
    console.error('Erro ao formatar preço:', e);
    return 'R$ 0,00';
  }
};

export default function ProdutoDetalhe() {
  const router = useRouter();
  const { slug } = router.query;
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedMemory, setSelectedMemory] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [filteredVariants, setFilteredVariants] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('description');  
  const [relatedProducts, setRelatedProducts] = useState([]);  const [showImageModal, setShowImageModal] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);  const [promoProducts, setPromoProducts] = useState([]);
  const [newProducts, setNewProducts] = useState([]);

  // Função para calcular o preço total baseado na quantidade
  const calculateTotalPrice = () => {
    if (!product || !product.price) return 'R$ 0,00';
    
    let basePrice = product.price;
    
    // Se o preço for string, converte para número
    if (typeof basePrice === 'string') {
      basePrice = basePrice.replace(/R\$\s*|&nbsp;|&#\d+;/g, '');
      basePrice = parseFloat(basePrice.replace(/\./g, '').replace(',', '.'));
    }
    
    if (isNaN(basePrice)) return 'R$ 0,00';
    
    const totalPrice = basePrice * quantity;
    return formatPrice(totalPrice);
  };  // Função para calcular o preço de parcela baseado na quantidade
  const getInstallmentPriceWithQuantity = () => {
    if (!product || !product.price) return 'R$ 0,00';
    const totalPrice = priceToNumber(product.price) * quantity;
    const installmentValue = calculateInstallmentValue(totalPrice, MAX_INSTALLMENTS);
    return formatPrice(installmentValue);
  };

  // Função para calcular preço de parcela (versão original para compatibilidade)
  const getInstallmentPrice = (price) => {
    if (!price) return 'R$ 0,00';
    const numericPrice = priceToNumber(price);
    const installmentValue = calculateInstallmentValue(numericPrice, MAX_INSTALLMENTS);
    return formatPrice(installmentValue);
  };// Função para adicionar produto ao carrinho com feedback visual melhorado
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
      width: button.style.width,
      minHeight: button.style.minHeight,
      display: button.style.display,
      alignItems: button.style.alignItems,
      justifyContent: button.style.justifyContent,
      position: button.style.position,
      overflow: button.style.overflow,
      transition: button.style.transition,
      opacity: button.style.opacity,
      cursor: button.style.cursor
    };
    
    // Adicionar classe de loading e desabilitar o botão
    button.classList.add('loading');
    button.disabled = true;
    
    // FASE 1: MOSTRAR SPINNER DE LOADING
    button.innerHTML = '';
    button.style.position = 'relative';
    
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
        // 🔍 DEBUG TEMPORÁRIO - Logs detalhados do produto
        console.group('🐛 [DEBUG] Dados do produto no handleAddToCart [slug].js');
        console.log('📦 Objeto produto completo:', product);
        console.log('💰 Preço bruto product.price:', product.price, typeof product.price);
        console.log('💰 Preço regular product.regularPrice:', product.regularPrice, typeof product.regularPrice);
        console.log('💰 Preço de venda product.salePrice:', product.salePrice, typeof product.salePrice);
        console.log('🏷️ Produto em oferta product.onSale:', product.onSale);
        console.groupEnd();
        
        // Garantir que temos o ID numérico do produto
        const productId = product.databaseId || 
                         (typeof product.id === 'string' && product.id.includes('post:') 
                          ? parseInt(product.id.split(':')[1]) 
                          : product.id);
        
        console.log(`📦 [Produto ${slug}] Adicionando ao carrinho via Cart v2 - ID: ${productId}, Quantidade: ${quantity}`);
        
        // Preparar dados do produto para envio
        const productData = {
          id: productId,
          name: product.name || `Produto ${productId}`,
          price: product.price || product.regularPrice || '0',
          image: product.image?.sourceUrl || product.featuredImage?.node?.sourceUrl || null
        };
        
        // 🔍 DEBUG TEMPORÁRIO - Logs dos dados preparados para envio
        console.group('🐛 [DEBUG] Dados preparados para Cart v2 API');
        console.log('📦 productData completo:', productData);
        console.log('💰 productData.price:', productData.price, typeof productData.price);
        console.groupEnd();
        
        // Se existe uma variante selecionada, incluir no envio
        if (selectedVariant) {
          const variantId = selectedVariant.databaseId || 
                           (typeof selectedVariant.id === 'string' && selectedVariant.id.includes('product_variation:') 
                            ? parseInt(selectedVariant.id.split(':')[1]) 
                            : selectedVariant.id);
          
          productData.variantId = variantId;
          productData.price = selectedVariant.price || selectedVariant.regularPrice || productData.price;
          console.log(`📦 [Produto ${slug}] Variante selecionada: ${variantId}`);
        }
        
        // Chamar API Cart v2
        const response = await fetch('/api/v2/cart', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-cart-source': 'product-page',
            'x-request-time': Date.now().toString()
          },
          body: JSON.stringify({
            product: productData,
            quantity: quantity
          })
        });
        
        const result = await response.json();
        
        if (result.success) {
          console.log(`✅ [Produto ${slug}] Produto adicionado com sucesso ao Cart v2!`);
          
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
            navigator.vibrate([200, 100, 200]);
          }
          
          // Mostrar notificação de sucesso se disponível
          if (window.showNotification) {
            window.showNotification('Produto adicionado ao carrinho!', 'success');
          }
          
          // Atualizar contador do carrinho se disponível
          if (window.updateCartCount) {
            window.updateCartCount();
          }
          
          // Disparar eventos para sincronizar contador global
          window.dispatchEvent(new CustomEvent('cartUpdated', { 
            detail: { 
              product: {
                id: productId,
                name: product.name,
                price: parseFloat(product.price || product.regularPrice || 0),
                image: product.image?.sourceUrl || product.featuredImage?.node?.sourceUrl
              },
              quantity: quantity,
              timestamp: Date.now()
            } 
          }));
          
          // Disparar evento específico para o contador do Layout
          window.dispatchEvent(new CustomEvent('productAddedToCart', {
            detail: {
              productId: productId,
              productName: product.name,
              quantity: quantity,
              timestamp: Date.now()
            }
          }));
          
          // FASE 3: AGUARDAR 2 SEGUNDOS E RESTAURAR O BOTÃO ORIGINAL
          setTimeout(() => {
            button.classList.remove('loading');
            button.disabled = false;
            button.innerHTML = originalContent;
            Object.keys(originalStyles).forEach(key => {
              if (originalStyles[key]) {
                button.style[key] = originalStyles[key];
              }
            });
          }, 2000);
          
        } else {
          throw new Error(result.error || 'Erro ao adicionar produto');
        }
        
      } catch (error) {
        console.error(`❌ [Produto ${slug}] Erro ao adicionar ao carrinho:`, error);
        
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
          Object.keys(originalStyles).forEach(key => {
            if (originalStyles[key]) {
              button.style[key] = originalStyles[key];
            }
          });
        }, 2000);
      }
    })();
  };

  // Cores comuns de smartphones com códigos de cores correspondentes
  const colorMap = {
    'preto': '#000000',
    'black': '#000000',
    'branco': '#FFFFFF',
    'white': '#FFFFFF',
    'azul': '#0075FF',
    'blue': '#0075FF',
    'verde': '#00AA55',
    'green': '#00AA55',
    'vermelho': '#FF0000',
    'red': '#FF0000',
    'rosa': '#FF69B4',
    'pink': '#FF69B4',
    'roxo': '#8A2BE2',
    'purple': '#8A2BE2',
    'amarelo': '#FFD700',
    'yellow': '#FFD700',
    'cinza': '#808080',
    'gray': '#808080',
    'dourado': '#D4AF37',
    'gold': '#D4AF37',
    'prata': '#C0C0C0',
    'silver': '#C0C0C0',
    'grafite': '#4D4D4D',
    'graphite': '#4D4D4D',
    'meia-noite': '#191970',
    'midnight': '#191970'
  };

  // Carregar dados do produto quando o slug mudar
  useEffect(() => {
    if (!slug) return;
    
    setLoading(true);
    setError(null);
    
  // Verificar se é uma solicitação para a página de promocoes ou lancamentos
    if (slug === 'promocoes') {
      // Buscar produtos em promoção
      fetch('/api/products?on_sale=true&per_page=12')
        .then(async (res) => {
          if (!res.ok) throw new Error(`API retornou status ${res.status}`);
          
          const data = await res.json();
          console.log(`✓ ${Array.isArray(data) ? data.length : 0} produtos em promoção encontrados`);
          
          // Garantir que temos um array de produtos
          const productArray = Array.isArray(data) ? data : data.products || [];
          setPromoProducts(productArray);
          setLoading(false);
        })
        .catch((err) => {
          console.error('❌ Erro ao buscar produtos em promoção:', err);
          setError(err.message);
          setLoading(false);
        });
      return;
    }
    
    // Verificar se é uma solicitação para a página de lançamentos
    if (slug === 'lancamentos') {
      // Buscar produtos ordenados por data (mais recentes primeiro)
      fetch('/api/products?orderby=date&order=desc&per_page=12')
        .then(async (res) => {
          if (!res.ok) throw new Error(`API retornou status ${res.status}`);
          
          const data = await res.json();
          console.log(`✓ ${Array.isArray(data) ? data.length : 0} lançamentos encontrados`);
          
          // Garantir que temos um array de produtos
          const productArray = Array.isArray(data) ? data : data.products || [];
          setNewProducts(productArray);
          setLoading(false);
        })
        .catch((err) => {
          console.error('❌ Erro ao buscar lançamentos:', err);
          setError(err.message);
          setLoading(false);
        });
      return;
    }
    
    // Acessórios - Carregadores e Power Banks
    if (slug === 'carregadores-power-banks') {
      fetch('/api/products?category=carregadores-power-banks&per_page=12')
        .then(async (res) => {
          if (!res.ok) throw new Error(`API retornou status ${res.status}`);
          
          const data = await res.json();
          console.log(`✓ ${Array.isArray(data) ? data.length : 0} carregadores e power banks encontrados`);
          
          // Garantir que temos um array de produtos
          const productArray = Array.isArray(data) ? data : data.products || [];
          setPromoProducts(productArray); // Reutilizamos o estado promoProducts
          setLoading(false);
        })
        .catch((err) => {
          console.error('❌ Erro ao buscar carregadores e power banks:', err);
          setError(err.message);
          setLoading(false);
        });
      return;
    }
    
    // Acessórios - Cabos
    if (slug === 'cabos') {
      fetch('/api/products?category=cabos&per_page=12')
        .then(async (res) => {
          if (!res.ok) throw new Error(`API retornou status ${res.status}`);
          
          const data = await res.json();
          console.log(`✓ ${Array.isArray(data) ? data.length : 0} cabos encontrados`);
          
          // Garantir que temos um array de produtos
          const productArray = Array.isArray(data) ? data : data.products || [];
          setPromoProducts(productArray);
          setLoading(false);
        })
        .catch((err) => {
          console.error('❌ Erro ao buscar cabos:', err);
          setError(err.message);
          setLoading(false);
        });
      return;
    }
    
    // Acessórios - Capas
    if (slug === 'capas') {
      fetch('/api/products?category=capas&per_page=12')
        .then(async (res) => {
          if (!res.ok) throw new Error(`API retornou status ${res.status}`);
          
          const data = await res.json();
          console.log(`✓ ${Array.isArray(data) ? data.length : 0} capas encontradas`);
          
          // Garantir que temos um array de produtos
          const productArray = Array.isArray(data) ? data : data.products || [];
          setPromoProducts(productArray);
          setLoading(false);
        })
        .catch((err) => {
          console.error('❌ Erro ao buscar capas:', err);
          setError(err.message);
          setLoading(false);
        });
      return;
    }
    
    // Acessórios - Películas
    if (slug === 'peliculas') {
      fetch('/api/products?category=peliculas&per_page=12')
        .then(async (res) => {
          if (!res.ok) throw new Error(`API retornou status ${res.status}`);
          
          const data = await res.json();
          console.log(`✓ ${Array.isArray(data) ? data.length : 0} películas encontradas`);
          
          // Garantir que temos um array de produtos
          const productArray = Array.isArray(data) ? data : data.products || [];
          setPromoProducts(productArray);
          setLoading(false);
        })
        .catch((err) => {
          console.error('❌ Erro ao buscar películas:', err);
          setError(err.message);
          setLoading(false);
        });
      return;
    }
    
    // Acessórios - Ver todos
    if (slug === 'acessórios') {
      fetch('/api/products?category=acessorios&per_page=12')
        .then(async (res) => {
          if (!res.ok) throw new Error(`API retornou status ${res.status}`);
          
          const data = await res.json();
          console.log(`✓ ${Array.isArray(data) ? data.length : 0} acessórios encontrados`);
          
          // Garantir que temos um array de produtos
          const productArray = Array.isArray(data) ? data : data.products || [];
          setPromoProducts(productArray);
          setLoading(false);
        })
        .catch((err) => {
          console.error('❌ Erro ao buscar acessórios:', err);
          setError(err.message);
          setLoading(false);
        });
      return;
    }
    
    // Áudio - Fones sem Fio
    if (slug === 'fone-sem-fio') {
      fetch('/api/products?category=fone-sem-fio&per_page=12')
        .then(async (res) => {
          if (!res.ok) throw new Error(`API retornou status ${res.status}`);
          
          const data = await res.json();
          console.log(`✓ ${Array.isArray(data) ? data.length : 0} fones sem fio encontrados`);
          
          // Garantir que temos um array de produtos
          const productArray = Array.isArray(data) ? data : data.products || [];
          setPromoProducts(productArray);
          setLoading(false);
        })
        .catch((err) => {
          console.error('❌ Erro ao buscar fones sem fio:', err);
          setError(err.message);
          setLoading(false);
        });
      return;
    }
    
    // Áudio - Fones com Fio
    if (slug === 'fone-com-fio') {
      fetch('/api/products?category=fone-com-fio&per_page=12')
        .then(async (res) => {
          if (!res.ok) throw new Error(`API retornou status ${res.status}`);
          
          const data = await res.json();
          console.log(`✓ ${Array.isArray(data) ? data.length : 0} fones com fio encontrados`);
          
          // Garantir que temos um array de produtos
          const productArray = Array.isArray(data) ? data : data.products || [];
          setPromoProducts(productArray);
          setLoading(false);
        })
        .catch((err) => {
          console.error('❌ Erro ao buscar fones com fio:', err);
          setError(err.message);
          setLoading(false);
        });
      return;
    }
    
    // Áudio - Caixas de Som
    if (slug === 'caixa-som') {
      fetch('/api/products?category=caixa-som&per_page=12')
        .then(async (res) => {
          if (!res.ok) throw new Error(`API retornou status ${res.status}`);
          
          const data = await res.json();
          console.log(`✓ ${Array.isArray(data) ? data.length : 0} caixas de som encontradas`);
          
          // Garantir que temos um array de produtos
          const productArray = Array.isArray(data) ? data : data.products || [];
          setPromoProducts(productArray);
          setLoading(false);
        })
        .catch((err) => {
          console.error('❌ Erro ao buscar caixas de som:', err);
          setError(err.message);
          setLoading(false);
        });
      return;
    }
    
    // Áudio - Assistentes Virtuais
    if (slug === 'assistente-virtual') {
      fetch('/api/products?category=assistente-virtual&per_page=12')
        .then(async (res) => {
          if (!res.ok) throw new Error(`API retornou status ${res.status}`);
          
          const data = await res.json();
          console.log(`✓ ${Array.isArray(data) ? data.length : 0} assistentes virtuais encontrados`);
          
          // Garantir que temos um array de produtos
          const productArray = Array.isArray(data) ? data : data.products || [];
          setPromoProducts(productArray);
          setLoading(false);
        })
        .catch((err) => {
          console.error('❌ Erro ao buscar assistentes virtuais:', err);
          setError(err.message);
          setLoading(false);
        });
      return;
    }
    
    // Áudio - Ver todos
    if (slug === 'áudio') {
      fetch('/api/products?category=audio&per_page=12')
        .then(async (res) => {
          if (!res.ok) throw new Error(`API retornou status ${res.status}`);
          
          const data = await res.json();
          console.log(`✓ ${Array.isArray(data) ? data.length : 0} produtos de áudio encontrados`);
          
          // Garantir que temos um array de produtos
          const productArray = Array.isArray(data) ? data : data.products || [];
          setPromoProducts(productArray);
          setLoading(false);
        })
        .catch((err) => {
          console.error('❌ Erro ao buscar produtos de áudio:', err);
          setError(err.message);
          setLoading(false);
        });
      return;
    }
    
    // Se não for a página de promoções, carregar dados do produto individual
    fetch(`/api/product?slug=${slug}`)
      .then(async (res) => {
        if (!res.ok) throw new Error(`API retornou status ${res.status}`);
        console.log('✅ Resposta da API recebida');
        
        const data = await res.json();
        console.log('📦 Dados do produto recebidos:', data);
        
        // Se não tiver um produto nos dados
        if (!data || (typeof data === 'object' && Object.keys(data).length === 0)) {
          throw new Error('Produto não encontrado');
        }
        
        setProduct(data);
        
        // Buscar produtos relacionados (mesma categoria)
        if (data.productCategories?.nodes?.length > 0) {
          const categorySlug = data.productCategories.nodes[0].slug;
          console.log(`🔍 Buscando produtos relacionados da categoria: ${categorySlug}`);
          
          fetch(`/api/products?category=${categorySlug}&per_page=4&exclude=${data.databaseId || data.id}`)
            .then(async (relRes) => {
              if (!relRes.ok) return [];
              const relData = await relRes.json();
              console.log(`✓ ${Array.isArray(relData) ? relData.length : 0} produtos relacionados encontrados`);
              
              const relatedArray = Array.isArray(relData) ? relData : relData.products || [];
              setRelatedProducts(relatedArray.filter(p => p.id !== data.id).slice(0, 4));
            })
            .catch(err => {
              console.warn('⚠️ Erro ao buscar produtos relacionados:', err);
              setRelatedProducts([]);
            });
        }
      })
      .catch((err) => {
        console.error('❌ Erro ao buscar produto:', err);
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, [slug]);

  // Efeito para filtrar variantes quando a cor ou memória são alteradas
  useEffect(() => {
    if (!product?.variations?.nodes || product.variations.nodes.length === 0) return;
    
    // Filtrar variantes com base nas seleções atuais
    let filtered = [...product.variations.nodes];
    
    if (selectedColor) {
      filtered = filtered.filter(variant => {
        return variant.attributes?.nodes?.some(attr => 
          (attr.name.toLowerCase().includes('cor') || attr.name.toLowerCase().includes('color')) && 
          attr.value.toLowerCase() === selectedColor.name.toLowerCase()
        );
      });
    }
    
    if (selectedMemory) {
      filtered = filtered.filter(variant => {
        return variant.attributes?.nodes?.some(attr => 
          (attr.name.toLowerCase().includes('memória') || 
           attr.name.toLowerCase().includes('memoria') ||
           attr.name.toLowerCase().includes('memory') ||
           attr.name.toLowerCase().includes('armazenamento') ||
           attr.name.toLowerCase().includes('storage') ||
           attr.name.toLowerCase().includes('capacidade') ||
           attr.name.toLowerCase().includes('capacity')) && 
          attr.value === selectedMemory
        );
      });
    }
    
    setFilteredVariants(filtered);
    
    // Se houver apenas uma variante filtrada, selecioná-la automaticamente
    if (filtered.length === 1) {
      setSelectedVariant(filtered[0]);
      console.log('Variante selecionada automaticamente:', filtered[0]);
    } else if (filtered.length === 0) {
      // Se não houver variantes correspondentes, manter a seleção anterior
      console.log('Nenhuma variante correspondente encontrada');
    }
  }, [selectedColor, selectedMemory, product]);

  // Função para atualizar o preço baseado na variante selecionada
  const getVariantPrice = () => {
    if (selectedVariant) {
      return {
        price: selectedVariant.price,
        regularPrice: selectedVariant.regularPrice,
        onSale: selectedVariant.onSale
      };
    }
    
    return {
      price: product.price,
      regularPrice: product.regularPrice,
      onSale: product.onSale
    };
  };

  // Exibir página de carregamento enquanto a página está sendo gerada
  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <LoadingSpinner />
        </div>
      </Layout>
    );
  }  // Verificar se é a página de promocoes
  if ((slug === 'promocoes' || 
      slug === 'carregadores-power_banks' || 
      slug === 'cabos' || 
      slug === 'capas' || 
      slug === 'peliculas' || 
      slug === 'acessórios' || 
      slug === 'fone-sem-fio' || 
      slug === 'fone-com-fio' || 
      slug === 'caixa-som' || 
      slug === 'assistente-virtual' || 
      slug === 'áudio') && !loading) {
    
    // Importe estilos no início do arquivo
    const productGridStyles = require('../../styles/ProductGrid.module.css');
    
    // Configurar o título e a tag baseado no slug
    let pageTitle = '';
    let tagLabel = '';
    let tagClass = '';
    
    switch(slug) {
      case 'promocoes':
        pageTitle = 'Produtos em Promoção';
        tagLabel = 'OFERTA';
        tagClass = productGridStyles.saleTag;
        break;
      case 'carregadores-power-banks':
        pageTitle = 'Carregadores e Power Banks';
        tagLabel = 'ACESSÓRIO';
        tagClass = productGridStyles.categoryTag;
        break;
      case 'cabos':
        pageTitle = 'Cabos';
        tagLabel = 'ACESSÓRIO';
        tagClass = productGridStyles.categoryTag;
        break;
      case 'capas':
        pageTitle = 'Capas';
        tagLabel = 'ACESSÓRIO';
        tagClass = productGridStyles.categoryTag;
        break;
      case 'peliculas':
        pageTitle = 'Películas';
        tagLabel = 'ACESSÓRIO';
        tagClass = productGridStyles.categoryTag;
        break;
      case 'acessórios':
        pageTitle = 'Todos os Acessórios';
        tagLabel = 'ACESSÓRIO';
        tagClass = productGridStyles.categoryTag;
        break;
      case 'fone-sem-fio':
        pageTitle = 'Fones de Ouvido sem Fio';
        tagLabel = 'ÁUDIO';
        tagClass = productGridStyles.categoryTag;
        break;
      case 'fone-com-fio':
        pageTitle = 'Fones de Ouvido com Fio';
        tagLabel = 'ÁUDIO';
        tagClass = productGridStyles.categoryTag;
        break;
      case 'caixa-som':
        pageTitle = 'Caixas de Som';
        tagLabel = 'ÁUDIO';
        tagClass = productGridStyles.categoryTag;
        break;
      case 'assistente-virtual':
        pageTitle = 'Assistentes Virtuais';
        tagLabel = 'ÁUDIO';
        tagClass = productGridStyles.categoryTag;
        break;
      case 'áudio':
        pageTitle = 'Produtos de Áudio';
        tagLabel = 'ÁUDIO';
        tagClass = productGridStyles.categoryTag;
        break;
      default:
        pageTitle = 'Produtos';
        tagLabel = '';
        tagClass = '';
    }
    
    return (
      <Layout>
        <div className="container mx-auto py-10">
          <h1 className="text-3xl font-bold mb-8 text-center">{pageTitle}</h1>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
              <p>{error}</p>
            </div>
          )}
          
          {promoProducts.length === 0 && !error ? (
            <div className="text-center py-10">
              <p className="text-xl text-gray-600">Nenhum produto disponível no momento.</p>
            </div>
          ) : (
            <div className={productGridStyles.productsGrid}>
              {promoProducts.map(product => (
                <div key={product.id} className={productGridStyles.productCard}>
                  <Link href={`/produto/${product.slug}`}>
                    <a className={productGridStyles.productLink}>
                      <div className={productGridStyles.productImage}>
                        {product.image?.sourceUrl || product.images?.[0]?.src ? (
                          <Image
                            src={product.image?.sourceUrl || product.images?.[0]?.src}
                            alt={product.name}
                            width={240}
                            height={240}
                            className="object-contain"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-200">
                            <span className="text-gray-400">Sem imagem</span>
                          </div>
                        )}
                        {tagLabel && <span className={tagClass}>{tagLabel}</span>}
                      </div>
                      <div className={productGridStyles.productInfo}>
                        <h2 className={productGridStyles.productName}>{product.name}</h2>
                        <div className={productGridStyles.productPricing}>
                          {(product.onSale || product.on_sale) && (
                            <span className={productGridStyles.regularPrice}>
                              {formatPrice(product.regularPrice || product.regular_price)}
                            </span>
                          )}
                          <span className={productGridStyles.price}>
                            {formatPrice(product.price)}
                          </span>
                          <span className={productGridStyles.installments}>em até <strong>12x</strong> sem juros</span>
                        </div>
                      </div>
                    </a>
                  </Link>
                  <div className={productGridStyles.productActions}>
                    <Link href={`/produto/${product.slug}`}>
                      <a className={productGridStyles.addToCartButton}>
                        Ver detalhes
                      </a>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Layout>
    );
  }
  // Lançamentos
  if (slug === 'lancamentos' && !loading) {
    // Importe estilos no início do arquivo
    const productGridStyles = require('../../styles/ProductGrid.module.css');
    
    return (
      <Layout>
        <div className="container mx-auto py-10">
          <h1 className="text-3xl font-bold mb-8 text-center">Lançamentos</h1>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
              <p>{error}</p>
            </div>
          )}
          
          {newProducts.length === 0 && !error ? (
            <div className="text-center py-10">
              <p className="text-xl text-gray-600">Nenhum produto lançamento disponível no momento.</p>
            </div>
          ) : (
            <div className={productGridStyles.productsGrid}>
              {newProducts.map(product => (
                <div key={product.id} className={productGridStyles.productCard}>
                  <Link href={`/produto/${product.slug}`}>
                    <a className={productGridStyles.productLink}>
                      <div className={productGridStyles.productImage}>
                        {product.image?.sourceUrl || product.images?.[0]?.src ? (
                          <Image
                            src={product.image?.sourceUrl || product.images?.[0]?.src}
                            alt={product.name}
                            width={240}
                            height={240}
                            className="object-contain"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-200">
                            <span className="text-gray-400">Sem imagem</span>
                          </div>
                        )}
                        <span className={productGridStyles.newTag}>LANÇAMENTO</span>
                      </div>
                      <div className={productGridStyles.productInfo}>
                        <h2 className={productGridStyles.productName}>{product.name}</h2>
                        <div className={productGridStyles.productPricing}>
                          {(product.onSale || product.on_sale) && (
                            <span className={productGridStyles.regularPrice}>
                              {formatPrice(product.regularPrice || product.regular_price)}
                            </span>
                          )}
                          <span className={productGridStyles.price}>
                            {formatPrice(product.price)}
                          </span>
                          <span className={productGridStyles.installments}>em até <strong>12x</strong> sem juros</span>
                        </div>
                      </div>
                    </a>
                  </Link>
                  <div className={productGridStyles.productActions}>
                    <Link href={`/produto/${product.slug}`}>
                      <a className={productGridStyles.addToCartButton}>
                        Ver detalhes
                      </a>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Layout>
    );
  }

  // Verificar se é a página de carregadores e power banks
  if (slug === 'carregadores-power-banks' && !loading) {
    // Importe estilos no início do arquivo
    const productGridStyles = require('../../styles/ProductGrid.module.css');
    
    return (
      <Layout>
        <div className="container mx-auto py-10">
          <h1 className="text-3xl font-bold mb-8 text-center">Carregadores e Power Banks</h1>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
              <p>{error}</p>
            </div>
          )}
          
          {promoProducts.length === 0 && !error ? (
            <div className="text-center py-10">
              <p className="text-xl text-gray-600">Nenhum carregador ou power bank disponível no momento.</p>
            </div>
          ) : (
            <div className={productGridStyles.productsGrid}>
              {promoProducts.map(product => (
                <div key={product.id} className={productGridStyles.productCard}>
                  <Link href={`/produto/${product.slug}`}>
                    <a className={productGridStyles.productLink}>
                      <div className={productGridStyles.productImage}>
                        {product.image?.sourceUrl || product.images?.[0]?.src ? (
                          <Image
                            src={product.image?.sourceUrl || product.images?.[0]?.src}
                            alt={product.name}
                            width={240}
                            height={240}
                            className="object-contain"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-200">
                            <span className="text-gray-400">Sem imagem</span>
                          </div>
                        )}
                      </div>
                      <div className={productGridStyles.productInfo}>
                        <h2 className={productGridStyles.productName}>{product.name}</h2>
                        <div className={productGridStyles.productPricing}>
                          {(product.onSale || product.on_sale) && (
                            <span className={productGridStyles.regularPrice}>
                              {formatPrice(product.regularPrice || product.regular_price)}
                            </span>
                          )}
                          <span className={productGridStyles.price}>
                            {formatPrice(product.price)}
                          </span>
                          <span className={productGridStyles.installments}>em até <strong>12x</strong> sem juros</span>
                        </div>
                      </div>
                    </a>
                  </Link>
                  <div className={productGridStyles.productActions}>
                    <Link href={`/produto/${product.slug}`}>
                      <a className={productGridStyles.addToCartButton}>
                        Ver detalhes
                      </a>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Layout>
    );
  }

  // Verificar se é a página de cabos
  if (slug === 'cabos' && !loading) {
    // Importe estilos no início do arquivo
    const productGridStyles = require('../../styles/ProductGrid.module.css');
    
    return (
      <Layout>
        <div className="container mx-auto py-10">
          <h1 className="text-3xl font-bold mb-8 text-center">Cabos</h1>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
              <p>{error}</p>
            </div>
          )}
          
          {promoProducts.length === 0 && !error ? (
            <div className="text-center py-10">
              <p className="text-xl text-gray-600">Nenhum cabo disponível no momento.</p>
            </div>
          ) : (
            <div className={productGridStyles.productsGrid}>
              {promoProducts.map(product => (
                <div key={product.id} className={productGridStyles.productCard}>
                  <Link href={`/produto/${product.slug}`}>
                    <a className={productGridStyles.productLink}>
                      <div className={productGridStyles.productImage}>
                        {product.image?.sourceUrl || product.images?.[0]?.src ? (
                          <Image
                            src={product.image?.sourceUrl || product.images?.[0]?.src}
                            alt={product.name}
                            width={240}
                            height={240}
                            className="object-contain"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-200">
                            <span className="text-gray-400">Sem imagem</span>
                          </div>
                        )}
                      </div>
                      <div className={productGridStyles.productInfo}>
                        <h2 className={productGridStyles.productName}>{product.name}</h2>
                        <div className={productGridStyles.productPricing}>
                          {(product.onSale || product.on_sale) && (
                            <span className={productGridStyles.regularPrice}>
                              {formatPrice(product.regularPrice || product.regular_price)}
                            </span>
                          )}
                          <span className={productGridStyles.price}>
                            {formatPrice(product.price)}
                          </span>
                          <span className={productGridStyles.installments}>em até <strong>12x</strong> sem juros</span>
                        </div>
                      </div>
                    </a>
                  </Link>
                  <div className={productGridStyles.productActions}>
                    <Link href={`/produto/${product.slug}`}>
                      <a className={productGridStyles.addToCartButton}>
                        Ver detalhes
                      </a>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Layout>
    );
  }

  // Verificar se é a página de capas
  if (slug === 'capas' && !loading) {
    // Importe estilos no início do arquivo
    const productGridStyles = require('../../styles/ProductGrid.module.css');
    
    return (
      <Layout>
        <div className="container mx-auto py-10">
          <h1 className="text-3xl font-bold mb-8 text-center">Capas</h1>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
              <p>{error}</p>
            </div>
          )}
          
          {promoProducts.length === 0 && !error ? (
            <div className="text-center py-10">
              <p className="text-xl text-gray-600">Nenhuma capa disponível no momento.</p>
            </div>
          ) : (
            <div className={productGridStyles.productsGrid}>
              {promoProducts.map(product => (
                <div key={product.id} className={productGridStyles.productCard}>
                  <Link href={`/produto/${product.slug}`}>
                    <a className={productGridStyles.productLink}>
                      <div className={productGridStyles.productImage}>
                        {product.image?.sourceUrl || product.images?.[0]?.src ? (
                          <Image
                            src={product.image?.sourceUrl || product.images?.[0]?.src}
                            alt={product.name}
                            width={240}
                            height={240}
                            className="object-contain"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-200">
                            <span className="text-gray-400">Sem imagem</span>
                          </div>
                        )}
                      </div>
                      <div className={productGridStyles.productInfo}>
                        <h2 className={productGridStyles.productName}>{product.name}</h2>
                        <div className={productGridStyles.productPricing}>
                          {(product.onSale || product.on_sale) && (
                            <span className={productGridStyles.regularPrice}>
                              {formatPrice(product.regularPrice || product.regular_price)}
                            </span>
                          )}
                          <span className={productGridStyles.price}>
                            {formatPrice(product.price)}
                          </span>
                          <span className={productGridStyles.installments}>em até <strong>12x</strong> sem juros</span>
                        </div>
                      </div>
                    </a>
                  </Link>
                  <div className={productGridStyles.productActions}>
                    <Link href={`/produto/${product.slug}`}>
                      <a className={productGridStyles.addToCartButton}>
                        Ver detalhes
                      </a>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Layout>
    );
  }

  // Verificar se é a página de películas
  if (slug === 'peliculas' && !loading) {
    // Importe estilos no início do arquivo
    const productGridStyles = require('../../styles/ProductGrid.module.css');
    
    return (
      <Layout>
        <div className="container mx-auto py-10">
          <h1 className="text-3xl font-bold mb-8 text-center">Películas</h1>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
              <p>{error}</p>
            </div>
          )}
          
          {promoProducts.length === 0 && !error ? (
            <div className="text-center py-10">
              <p className="text-xl text-gray-600">Nenhuma película disponível no momento.</p>
            </div>
          ) : (
            <div className={productGridStyles.productsGrid}>
              {promoProducts.map(product => (
                <div key={product.id} className={productGridStyles.productCard}>
                  <Link href={`/produto/${product.slug}`}>
                    <a className={productGridStyles.productLink}>
                      <div className={productGridStyles.productImage}>
                        {product.image?.sourceUrl || product.images?.[0]?.src ? (
                          <Image
                            src={product.image?.sourceUrl || product.images?.[0]?.src}
                            alt={product.name}
                            width={240}
                            height={240}
                            className="object-contain"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-200">
                            <span className="text-gray-400">Sem imagem</span>
                          </div>
                        )}
                      </div>
                      <div className={productGridStyles.productInfo}>
                        <h2 className={productGridStyles.productName}>{product.name}</h2>
                        <div className={productGridStyles.productPricing}>
                          {(product.onSale || product.on_sale) && (
                            <span className={productGridStyles.regularPrice}>
                              {formatPrice(product.regularPrice || product.regular_price)}
                            </span>
                          )}
                          <span className={productGridStyles.price}>
                            {formatPrice(product.price)}
                          </span>
                          <span className={productGridStyles.installments}>em até <strong>12x</strong> sem juros</span>
                        </div>
                      </div>
                    </a>
                  </Link>
                  <div className={productGridStyles.productActions}>
                    <Link href={`/produto/${product.slug}`}>
                      <a className={productGridStyles.addToCartButton}>
                        Ver detalhes
                      </a>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Layout>
    );
  }

  // Verificar se é a página de acessórios
  if (slug === 'acessórios' && !loading) {
    // Importe estilos no início do arquivo
    const productGridStyles = require('../../styles/ProductGrid.module.css');
    
    return (
      <Layout>
        <div className="container mx-auto py-10">
          <h1 className="text-3xl font-bold mb-8 text-center">Acessórios</h1>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
              <p>{error}</p>
            </div>
          )}
          
          {promoProducts.length === 0 && !error ? (
            <div className="text-center py-10">
              <p className="text-xl text-gray-600">Nenhum acessório disponível no momento.</p>
            </div>
          ) : (
            <div className={productGridStyles.productsGrid}>
              {promoProducts.map(product => (
                <div key={product.id} className={productGridStyles.productCard}>
                  <Link href={`/produto/${product.slug}`}>
                    <a className={productGridStyles.productLink}>
                      <div className={productGridStyles.productImage}>
                        {product.image?.sourceUrl || product.images?.[0]?.src ? (
                          <Image
                            src={product.image?.sourceUrl || product.images?.[0]?.src}
                            alt={product.name}
                            width={240}
                            height={240}
                            className="object-contain"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-200">
                            <span className="text-gray-400">Sem imagem</span>
                          </div>
                        )}
                      </div>
                      <div className={productGridStyles.productInfo}>
                        <h2 className={productGridStyles.productName}>{product.name}</h2>
                        <div className={productGridStyles.productPricing}>
                          {(product.onSale || product.on_sale) && (
                            <span className={productGridStyles.regularPrice}>
                              {formatPrice(product.regularPrice || product.regular_price)}
                            </span>
                          )}
                          <span className={productGridStyles.price}>
                            {formatPrice(product.price)}
                          </span>
                          <span className={productGridStyles.installments}>em até <strong>12x</strong> sem juros</span>
                        </div>
                      </div>
                    </a>
                  </Link>
                  <div className={productGridStyles.productActions}>
                    <Link href={`/produto/${product.slug}`}>
                      <a className={productGridStyles.addToCartButton}>
                        Ver detalhes
                      </a>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Layout>
    );
  }

  // Verificar se é a página de fones sem fio
  if (slug === 'fone-sem-fio' && !loading) {
    // Importe estilos no início do arquivo
    const productGridStyles = require('../../styles/ProductGrid.module.css');
    
    return (
      <Layout>
        <div className="container mx-auto py-10">
          <h1 className="text-3xl font-bold mb-8 text-center">Fones sem Fio</h1>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
              <p>{error}</p>
            </div>
          )}
          
          {promoProducts.length === 0 && !error ? (
            <div className="text-center py-10">
              <p className="text-xl text-gray-600">Nenhum fone sem fio disponível no momento.</p>
            </div>
          ) : (
            <div className={productGridStyles.productsGrid}>
              {promoProducts.map(product => (
                <div key={product.id} className={productGridStyles.productCard}>
                  <Link href={`/produto/${product.slug}`}>
                    <a className={productGridStyles.productLink}>
                      <div className={productGridStyles.productImage}>
                        {product.image?.sourceUrl || product.images?.[0]?.src ? (
                          <Image
                            src={product.image?.sourceUrl || product.images?.[0]?.src}
                            alt={product.name}
                            width={240}
                            height={240}
                            className="object-contain"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-200">
                            <span className="text-gray-400">Sem imagem</span>
                          </div>
                        )}
                      </div>
                      <div className={productGridStyles.productInfo}>
                        <h2 className={productGridStyles.productName}>{product.name}</h2>
                        <div className={productGridStyles.productPricing}>
                          {(product.onSale || product.on_sale) && (
                            <span className={productGridStyles.regularPrice}>
                              {formatPrice(product.regularPrice || product.regular_price)}
                            </span>
                          )}
                          <span className={productGridStyles.price}>
                            {formatPrice(product.price)}
                          </span>
                          <span className={productGridStyles.installments}>em até <strong>12x</strong> sem juros</span>
                        </div>
                      </div>
                    </a>
                  </Link>
                  <div className={productGridStyles.productActions}>
                    <Link href={`/produto/${product.slug}`}>
                      <a className={productGridStyles.addToCartButton}>
                        Ver detalhes
                      </a>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Layout>
    );
  }

  // Verificar se é a página de fones com fio
  if (slug === 'fone-com-fio' && !loading) {
    // Importe estilos no início do arquivo
    const productGridStyles = require('../../styles/ProductGrid.module.css');
    
    return (
      <Layout>
        <div className="container mx-auto py-10">
          <h1 className="text-3xl font-bold mb-8 text-center">Fones com Fio</h1>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
              <p>{error}</p>
            </div>
          )}
          
          {promoProducts.length === 0 && !error ? (
            <div className="text-center py-10">
              <p className="text-xl text-gray-600">Nenhum fone com fio disponível no momento.</p>
            </div>
          ) : (
            <div className={productGridStyles.productsGrid}>
              {promoProducts.map(product => (
                <div key={product.id} className={productGridStyles.productCard}>
                  <Link href={`/produto/${product.slug}`}>
                    <a className={productGridStyles.productLink}>
                      <div className={productGridStyles.productImage}>
                        {product.image?.sourceUrl || product.images?.[0]?.src ? (
                          <Image
                            src={product.image?.sourceUrl || product.images?.[0]?.src}
                            alt={product.name}
                            width={240}
                            height={240}
                            className="object-contain"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-200">
                            <span className="text-gray-400">Sem imagem</span>
                          </div>
                        )}
                      </div>
                      <div className={productGridStyles.productInfo}>
                        <h2 className={productGridStyles.productName}>{product.name}</h2>
                        <div className={productGridStyles.productPricing}>
                          {(product.onSale || product.on_sale) && (
                            <span className={productGridStyles.regularPrice}>
                              {formatPrice(product.regularPrice || product.regular_price)}
                            </span>
                          )}
                          <span className={productGridStyles.price}>
                            {formatPrice(product.price)}
                          </span>
                          <span className={productGridStyles.installments}>em até <strong>12x</strong> sem juros</span>
                        </div>
                      </div>
                    </a>
                  </Link>
                  <div className={productGridStyles.productActions}>
                    <Link href={`/produto/${product.slug}`}>
                      <a className={productGridStyles.addToCartButton}>
                        Ver detalhes
                      </a>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Layout>
    );
  }

  // Verificar se é a página de caixas de som
  if (slug === 'caixa-som' && !loading) {
    // Importe estilos no início do arquivo
    const productGridStyles = require('../../styles/ProductGrid.module.css');
    
    return (
      <Layout>
        <div className="container mx-auto py-10">
          <h1 className="text-3xl font-bold mb-8 text-center">Caixas de Som</h1>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
              <p>{error}</p>
            </div>
          )}
          
          {promoProducts.length === 0 && !error ? (
            <div className="text-center py-10">
              <p className="text-xl text-gray-600">Nenhuma caixa de som disponível no momento.</p>
            </div>
          ) : (
            <div className={productGridStyles.productsGrid}>
              {promoProducts.map(product => (
                <div key={product.id} className={productGridStyles.productCard}>
                  <Link href={`/produto/${product.slug}`}>
                    <a className={productGridStyles.productLink}>
                      <div className={productGridStyles.productImage}>
                        {product.image?.sourceUrl || product.images?.[0]?.src ? (
                          <Image
                            src={product.image?.sourceUrl || product.images?.[0]?.src}
                            alt={product.name}
                            width={240}
                            height={240}
                            className="object-contain"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-200">
                            <span className="text-gray-400">Sem imagem</span>
                          </div>
                        )}
                      </div>
                      <div className={productGridStyles.productInfo}>
                        <h2 className={productGridStyles.productName}>{product.name}</h2>
                        <div className={productGridStyles.productPricing}>
                          {(product.onSale || product.on_sale) && (
                            <span className={productGridStyles.regularPrice}>
                              {formatPrice(product.regularPrice || product.regular_price)}
                            </span>
                          )}
                          <span className={productGridStyles.price}>
                            {formatPrice(product.price)}
                          </span>
                          <span className={productGridStyles.installments}>em até <strong>12x</strong> sem juros</span>
                        </div>
                      </div>
                    </a>
                  </Link>
                  <div className={productGridStyles.productActions}>
                    <Link href={`/produto/${product.slug}`}>
                      <a className={productGridStyles.addToCartButton}>
                        Ver detalhes
                      </a>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Layout>
    );
  }

  // Verificar se é a página de assistentes virtuais
  if (slug === 'assistente-virtual' && !loading) {
    // Importe estilos no início do arquivo
    const productGridStyles = require('../../styles/ProductGrid.module.css');
    
    return (
      <Layout>
        <div className="container mx-auto py-10">
          <h1 className="text-3xl font-bold mb-8 text-center">Assistentes Virtuais</h1>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
              <p>{error}</p>
            </div>
          )}
          
          {promoProducts.length === 0 && !error ? (
            <div className="text-center py-10">
              <p className="text-xl text-gray-600">Nenhum assistente virtual disponível no momento.</p>
            </div>
          ) : (
            <div className={productGridStyles.productsGrid}>
              {promoProducts.map(product => (
                <div key={product.id} className={productGridStyles.productCard}>
                  <Link href={`/produto/${product.slug}`}>
                    <a className={productGridStyles.productLink}>
                      <div className={productGridStyles.productImage}>
                        {product.image?.sourceUrl || product.images?.[0]?.src ? (
                          <Image
                            src={product.image?.sourceUrl || product.images?.[0]?.src}
                            alt={product.name}
                            width={240}
                            height={240}
                            className="object-contain"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-200">
                            <span className="text-gray-400">Sem imagem</span>
                          </div>
                        )}
                      </div>
                      <div className={productGridStyles.productInfo}>
                        <h2 className={productGridStyles.productName}>{product.name}</h2>
                        <div className={productGridStyles.productPricing}>
                          {(product.onSale || product.on_sale) && (
                            <span className={productGridStyles.regularPrice}>
                              {formatPrice(product.regularPrice || product.regular_price)}
                            </span>
                          )}
                          <span className={productGridStyles.price}>
                            {formatPrice(product.price)}
                          </span>
                          <span className={productGridStyles.installments}>em até <strong>12x</strong> sem juros</span>
                        </div>
                      </div>
                    </a>
                  </Link>
                  <div className={productGridStyles.productActions}>
                    <Link href={`/produto/${product.slug}`}>
                      <a className={productGridStyles.addToCartButton}>
                        Ver detalhes
                      </a>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Layout>
    );
  }

  // Verificar se é a página de áudio
  if (slug === 'áudio' && !loading) {
    // Importe estilos no início do arquivo
    const productGridStyles = require('../../styles/ProductGrid.module.css');
    
    return (
      <Layout>
        <div className="container mx-auto py-10">
          <h1 className="text-3xl font-bold mb-8 text-center">Áudio</h1>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
              <p>{error}</p>
            </div>
          )}
          
          {promoProducts.length === 0 && !error ? (
            <div className="text-center py-10">
              <p className="text-xl text-gray-600">Nenhum produto de áudio disponível no momento.</p>
            </div>
          ) : (
            <div className={productGridStyles.productsGrid}>
              {promoProducts.map(product => (
                <div key={product.id} className={productGridStyles.productCard}>
                  <Link href={`/produto/${product.slug}`}>
                    <a className={productGridStyles.productLink}>
                      <div className={productGridStyles.productImage}>
                        {product.image?.sourceUrl || product.images?.[0]?.src ? (
                          <Image
                            src={product.image?.sourceUrl || product.images?.[0]?.src}
                            alt={product.name}
                            width={240}
                            height={240}
                            className="object-contain"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-200">
                            <span className="text-gray-400">Sem imagem</span>
                          </div>
                        )}
                      </div>
                      <div className={productGridStyles.productInfo}>
                        <h2 className={productGridStyles.productName}>{product.name}</h2>
                        <div className={productGridStyles.productPricing}>
                          {(product.onSale || product.on_sale) && (
                            <span className={productGridStyles.regularPrice}>
                              {formatPrice(product.regularPrice || product.regular_price)}
                            </span>
                          )}
                          <span className={productGridStyles.price}>
                            {formatPrice(product.price)}
                          </span>
                          <span className={productGridStyles.installments}>em até <strong>12x</strong> sem juros</span>
                        </div>
                      </div>
                    </a>
                  </Link>
                  <div className={productGridStyles.productActions}>
                    <Link href={`/produto/${product.slug}`}>
                      <a className={productGridStyles.addToCartButton}>
                        Ver detalhes
                      </a>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Layout>
    );
  }

  // Se não encontrou o produto, exibir mensagem
  if (error || !product) {
    return (
      <Layout>
        <div className="container mx-auto py-20 text-center">
          <div className="mb-8">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold mb-4">Produto não encontrado</h1>
          <p className="mb-8">O produto que você está procurando não existe ou foi removido.</p>
          {error && <p className="text-sm text-red-500 mb-6">{error}</p>}
          <Link href="/">
            <a className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-md transition-colors">
              Voltar à página inicial
            </a>
          </Link>
        </div>
      </Layout>
    );
  }
  // A função formatPrice foi movida para o escopo global no início do arquivo

  // Função para extrair cores disponíveis com códigos de cores baseados em nomes comuns
  const extractColors = (product) => {
    if (!product) return [];
    
    // Lista para armazenar cores encontradas (sem duplicatas)
    const colorsList = [];
    const foundColors = new Set();
    
    // Primeiro procura atributos de cor nas variantes
    if (product.variations?.nodes) {
      product.variations.nodes.forEach(variant => {
        if (variant.attributes?.nodes) {
          const colorAttr = variant.attributes.nodes.find(attr => 
            attr.name.toLowerCase().includes('cor') || 
            attr.name.toLowerCase().includes('color')
          );
          
          if (colorAttr && !foundColors.has(colorAttr.value.toLowerCase())) {
            foundColors.add(colorAttr.value.toLowerCase());
            
            const colorName = colorAttr.value;
            const colorLower = colorName.toLowerCase();
            let colorCode = '#CCCCCC'; // Cor padrão cinza
            // Verificar se existe uma cor correspondente no mapa
            Object.keys(colorMap).forEach(key => {
              if (colorLower.includes(key)) {
                colorCode = colorMap[key];
              }
            });
            
            // Se é uma cor hexadecimal direta
            if (colorLower.match(/^#[0-9a-f]{6}$/i)) {
              colorCode = colorLower;
            }
            
            colorsList.push({
              name: colorName,
              code: colorCode
            });
          }
        }
      });
    }
    
    // Se não encontrou nas variantes, procura nos atributos do produto
    if (colorsList.length === 0 && product.attributes?.nodes) {
      const colorAttr = product.attributes.nodes.find(attr => 
        attr.name.toLowerCase().includes('cor') || 
        attr.name.toLowerCase().includes('color')
      );
      
      if (colorAttr && colorAttr.options) {
        colorAttr.options.forEach(option => {
          if (!foundColors.has(option.toLowerCase())) {
            foundColors.add(option.toLowerCase());
            
            const colorName = option;
            const colorLower = colorName.toLowerCase();
            let colorCode = '#CCCCCC'; // Cor padrão cinza
            // Verificar se existe uma cor correspondente no mapa
            Object.keys(colorMap).forEach(key => {
              if (colorLower.includes(key)) {
                colorCode = colorMap[key];
              }
            });
            
            // Se é uma cor hexadecimal direta
            if (colorLower.match(/^#[0-9a-f]{6}$/i)) {
              colorCode = colorLower;
            }
            
            colorsList.push({
              name: colorName,
              code: colorCode
            });
          }
        });
      }
    }
    
    // Se ainda não encontrou cores, verificar se o nome do produto contém alguma cor comum
    if (colorsList.length === 0 && product.name) {
      const productName = product.name.toLowerCase();
      
      Object.keys(colorMap).forEach(colorKey => {
        if (productName.includes(colorKey) && !foundColors.has(colorKey)) {
          foundColors.add(colorKey);
          colorsList.push({
            name: colorKey.charAt(0).toUpperCase() + colorKey.slice(1), // Capitalizar primeira letra
            code: colorMap[colorKey]
          });
        }
      });
    }
    
    return colorsList;
  };

  // Função para extrair memória disponível
  const extractMemories = (product) => {
    if (!product) return [];
    
    const memoryOptions = new Set();
    
    // Verificar atributos padrão do produto
    if (product.attributes?.nodes) {
      // Procurar por atributos de memória/armazenamento
      const memoryAttr = product.attributes.nodes.find(attr => 
        attr.name.toLowerCase().includes('memória') || 
        attr.name.toLowerCase().includes('memoria') || 
        attr.name.toLowerCase().includes('memory') || 
        attr.name.toLowerCase().includes('armazenamento') || 
        attr.name.toLowerCase().includes('storage') || 
        attr.name.toLowerCase().includes('capacidade') || 
        attr.name.toLowerCase().includes('capacity')
      );
      
      if (memoryAttr && memoryAttr.options) {
        memoryAttr.options.forEach(option => {
          memoryOptions.add(option);
        });
      }
    }
    
    // Se não encontrou nos atributos padrão, procurar nas variantes
    if (memoryOptions.size === 0 && product.variations?.nodes) {
      product.variations.nodes.forEach(variant => {
        if (variant.attributes?.nodes) {
          variant.attributes.nodes.forEach(attr => {
            if (
              attr.name.toLowerCase().includes('memória') || 
              attr.name.toLowerCase().includes('memoria') || 
              attr.name.toLowerCase().includes('memory') || 
              attr.name.toLowerCase().includes('armazenamento') || 
              attr.name.toLowerCase().includes('storage') || 
              attr.name.toLowerCase().includes('capacidade') || 
              attr.name.toLowerCase().includes('capacity')
            ) {
              memoryOptions.add(attr.value);
            }
          });
        }
      });
    }
    
    // Converter Set para Array
    const memories = Array.from(memoryOptions);
    
    // Ordenar por capacidade
    return memories.sort((a, b) => {
      // Extrair números
      const aMatch = String(a).match(/(\d+)/);
      const bMatch = String(b).match(/(\d+)/);
      
      if (!aMatch || !bMatch) return 0;
      
      const aNum = parseInt(aMatch[0]);
      const bNum = parseInt(bMatch[0]);
      
      // Se ambos são GB ou TB, comparar números diretamente
      if ((String(a).includes('GB') && String(b).includes('GB')) || 
          (String(a).includes('TB') && String(b).includes('TB'))) {
        return aNum - bNum;
      }
      
      // Se um é TB e outro é GB, TB sempre é maior
      if (String(a).includes('TB') && String(b).includes('GB')) return 1;
      if (String(a).includes('GB') && String(b).includes('TB')) return -1;
      
      // Caso padrão
      return aNum - bNum;
    });
  };

  // Extrair cores e memórias disponíveis
  const colors = extractColors(product) || [];
  const memories = extractMemories(product) || [];

  // Função para selecionar cor
  const selectColor = (color) => {
    setSelectedColor(color);
    console.log(`Cor selecionada: ${color.name}`);
  };
  
  // Função para selecionar memória
  const selectMemory = (memory) => {
    setSelectedMemory(memory);
    console.log(`Capacidade selecionada: ${memory}`);
  };

  // Função para selecionar variante do produto
  const handleVariantSelection = (variant) => {
    setSelectedVariant(variant);
  };

  // Função para organizar as variantes por atributo
  const getOrganizedVariants = () => {
    if (!product?.variations?.nodes) return {};
    
    const variantsByAttribute = {};
    
    product.variations?.nodes?.forEach(variant => {
      if (variant.attributes?.nodes) {
        variant.attributes.nodes.forEach(attr => {
          if (!variantsByAttribute[attr.name]) {
            variantsByAttribute[attr.name] = new Set();
          }
          variantsByAttribute[attr.name].add(attr.value);
        });
      }
    });
    
    // Converter Set para Array
    Object.keys(variantsByAttribute).forEach(key => {
      variantsByAttribute[key] = Array.from(variantsByAttribute[key]);
    });
    
    return variantsByAttribute;
  };

  const variants = getOrganizedVariants();

  return (
    <Layout>
      <Head>
        {/* Meta Tags Básicas */}
        <title>{product.name} | Loja Oficial</title>
        <meta name="description" content={product.shortDescription?.replace(/(<([^>]+)>)/gi, '') || `${product.name} - Compre online com entrega rápida e garantia`} />
        
        {/* Open Graph Meta Tags para WhatsApp, Facebook, Instagram */}
        <meta property="og:type" content="product" />
        <meta property="og:title" content={`${product.name} | Loja Oficial`} />
        <meta property="og:description" content={product.shortDescription?.replace(/(<([^>]+)>)/gi, '') || `${product.name} - Compre online com entrega rápida e garantia. ${formatPrice(product.price)} em até 12x no cartão.`} />
        <meta property="og:image" content={product.image?.sourceUrl || product.images?.[0]?.src || `${process.env.NEXT_PUBLIC_SITE_URL || 'https://seusite.com'}/images/placeholder.jpg`} />
        <meta property="og:image:alt" content={product.image?.altText || product.name} />
        <meta property="og:image:width" content="800" />
        <meta property="og:image:height" content="600" />
        <meta property="og:url" content={`${process.env.NEXT_PUBLIC_SITE_URL || 'https://seusite.com'}/produto/${product.slug}`} />
        <meta property="og:site_name" content="Loja Oficial" />
        <meta property="og:locale" content="pt_BR" />
        
        {/* Dados específicos do produto */}
        <meta property="product:price:amount" content={priceToNumber(product.price)} />
        <meta property="product:price:currency" content="BRL" />
        <meta property="product:availability" content={product.stockStatus === 'IN_STOCK' ? 'in stock' : 'out of stock'} />
        <meta property="product:condition" content="new" />
        <meta property="product:brand" content={product.productCategories?.nodes?.[0]?.name || 'Loja Oficial'} />
        
        {/* Twitter Card Meta Tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${product.name} | Loja Oficial`} />
        <meta name="twitter:description" content={product.shortDescription?.replace(/(<([^>]+)>)/gi, '') || `${product.name} - Compre online com entrega rápida e garantia`} />
        <meta name="twitter:image" content={product.image?.sourceUrl || product.images?.[0]?.src || `${process.env.NEXT_PUBLIC_SITE_URL || 'https://seusite.com'}/images/placeholder.jpg`} />
        
        {/* WhatsApp específico - Schema.org */}
        <meta property="product:retailer_item_id" content={product.databaseId || product.id} />
        <meta property="product:item_group_id" content={product.productCategories?.nodes?.[0]?.slug || 'produtos'} />
        
        {/* Dados estruturados para WhatsApp Business */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org/",
            "@type": "Product",
            "name": product.name,
            "description": product.shortDescription?.replace(/(<([^>]+)>)/gi, '') || `${product.name} - Compre online com entrega rápida e garantia`,
            "image": product.image?.sourceUrl || product.images?.[0]?.src || `${process.env.NEXT_PUBLIC_SITE_URL || 'https://seusite.com'}/images/placeholder.jpg`,
            "brand": {
              "@type": "Brand",
              "name": product.productCategories?.nodes?.[0]?.name || "Loja Oficial"
            },
            "offers": {
              "@type": "Offer",
              "price": priceToNumber(product.price),
              "priceCurrency": "BRL",
              "availability": product.stockStatus === 'IN_STOCK' ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
              "url": `${process.env.NEXT_PUBLIC_SITE_URL || 'https://seusite.com'}/produto/${product.slug}`,
              "seller": {
                "@type": "Organization",
                "name": "Loja Oficial"
              }
            },
            "aggregateRating": product.averageRating ? {
              "@type": "AggregateRating",
              "ratingValue": product.averageRating,
              "reviewCount": product.reviewCount || 1
            } : undefined
          })}
        </script>
        
        {/* Meta Tags adicionais para melhor compartilhamento */}
        <meta property="og:image:secure_url" content={product.image?.sourceUrl || product.images?.[0]?.src || `${process.env.NEXT_PUBLIC_SITE_URL || 'https://seusite.com'}/images/placeholder.jpg`} />
        <meta property="og:image:type" content="image/jpeg" />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={`${process.env.NEXT_PUBLIC_SITE_URL || 'https://seusite.com'}/produto/${product.slug}`} />
      </Head>

      <SEO 
        title={`${product.name} | Loja Oficial`}
        description={product.shortDescription?.replace(/(<([^>]+)>)/gi, '') || `${product.name} - Compre online com entrega rápida e garantia`}
        image={product.image?.sourceUrl || '/images/placeholder.jpg'}
        url={`${process.env.NEXT_PUBLIC_SITE_URL || 'https://seusite.com'}/produto/${product.slug}`}
      />
      
      <div className="product-detail-container">
        {/* Breadcrumbs - removido conforme solicitado */}
        
        <div className="product-grid">          {/* Imagem do Produto */}          <div className="product-image-container">
            {(() => {
              console.log('🔍 DEBUG PRODUTO COMPLETO:', {
                productKeys: Object.keys(product || {}),
                galleryImages: product?.galleryImages,
                images: product?.images,
                image: product?.image,
                hasGalleryNodes: !isEmpty(product?.galleryImages?.nodes),
                hasImages: !isEmpty(product.images),
                hasImage: !isEmpty(product?.image)
              });
              return null;
            })()}
            {(!isEmpty(product?.galleryImages?.nodes) || !isEmpty(product.images) || !isEmpty(product?.image)) ? (
              <>
                {(() => {
                  console.log('🎯 RENDERIZANDO: GalleryCarousel vai ser renderizado', {
                    gallery: (!isEmpty(product?.galleryImages?.nodes)) ? product.galleryImages.nodes :
                      (!isEmpty(product.images)) ? product.images :
                      (product?.image) ? [product.image] : []
                  });
                  return null;
                })}
                <GalleryCarousel 
                  gallery={
                    // Prioriza imagens da galeria, se existirem
                    (!isEmpty(product?.galleryImages?.nodes)) ? product.galleryImages.nodes :
                    // Depois tenta a propriedade images
                    (!isEmpty(product.images)) ? product.images :
                    // Se tiver apenas a imagem principal, usa ela como única na galeria
                    (product?.image) ? [product.image] : []
                  }
                />              </>
            ) : (
              <div className="bg-gray-200 h-80 flex items-center justify-content rounded-lg">
                <span className="text-gray-500">Imagem não disponível</span>
              </div>
            )}
          </div>

          {/* Informações do Produto */}
          <div className="product-info">
            <h1 className="product-title">{product.name}</h1>
            
            {/* Avaliações */}
            <div className="rating-container">
              <div className="flex mr-2">
                <StarRating value={product.averageRating || 0} readOnly={true} />
              </div>
              <span className="text-sm text-gray-600">
                ({product.averageRating || '0'} - {product.reviewCount || 0} avaliações)
              </span>
            </div>
              {/* Preço */}
            <div className="price-container">
              <div className="flex items-center mb-1">
                {product.onSale && product.regularPrice && (
                  <span className="original-price text-lg">{formatPrice(parseFloat(product.regularPrice.replace(/R\$\s*|&nbsp;|&#\d+;/g, '').replace(/\./g, '').replace(',', '.')) * quantity)}</span>
                )}
                <span className="price">{calculateTotalPrice()}</span>
              </div>              <div className="installment-info">
                ou em até <strong>12x</strong> de <strong>{getInstallmentPriceWithQuantity()}</strong> no cartão de crédito
              </div>
            </div>
              {/* Métodos de Pagamento */}
            <div className="payment-methods mb-6">
              <div className="payment-method">
                <div className="payment-icon">
                  <img 
                    src="/payment/pagamento-seguro.png" 
                    alt="Pagamento Seguro" 
                    width="24" 
                    height="24"
                    className="payment-icon-image"
                  />
                </div>
                <span>Cartão</span>
              </div>              <div className="payment-method">
                <div className="payment-icon">
                  <img 
                    src="/payment/pix.svg" 
                    alt="PIX" 
                    width="24" 
                    height="24"
                    className="payment-icon-image"
                  />
                </div>
                <span>PIX</span>
              </div>
              <div className="payment-method">
                <div className="payment-icon">
                  <img 
                    src="/payment/apple_pay_card.png" 
                    alt="Apple Pay" 
                    width="48" 
                    height="48"
                    className="payment-icon-image"
                  />
                </div>
                <span>Apple Pay</span>
              </div>
            </div>
            
            {/* Cores do produto (se houver) */}
            {colors.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold text-gray-700 mb-2">Cor</h3>
                <div className="flex flex-wrap gap-3">
                  {colors.map((color, index) => (
                    <button 
                      key={index}
                      className={`color-option ${selectedColor?.name === color.name ? 'selected' : ''}`}
                      style={{ 
                        backgroundColor: color.code,
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        border: selectedColor?.name === color.name ? '2px solid #FF6600' : '2px solid #e5e5e5',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'transform 0.2s, border-color 0.2s',
                        boxShadow: color.code.toLowerCase() === '#ffffff' ? 'inset 0 0 0 1px #ddd' : 'none'
                      }}
                      onClick={() => selectColor(color)}
                      aria-label={`Cor ${color.name}`}
                      title={color.name}
                    >
                      {selectedColor?.name === color.name && (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z" fill={color.code === '#FFFFFF' || color.code === '#FFFFFE' ? '#000000' : '#FFFFFF'} />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
                {selectedColor && (
                  <div className="mt-2 text-sm text-gray-600">
                    Cor selecionada: <span className="font-medium">{selectedColor.name}</span>
                  </div>
                )}
              </div>
            )}
            
            {/* Opções de armazenamento (GB) */}
            {memories.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold text-gray-700 mb-2">Armazenamento</h3>
                <div className="flex flex-wrap gap-2">
                  {memories.map((memory, index) => (
                    <button 
                      key={index}
                      className={`px-4 py-2 border rounded-md transition-all
                        ${selectedMemory === memory 
                          ? 'border-orange-500 bg-orange-50 text-orange-700 font-medium' 
                          : 'border-gray-300 hover:border-orange-500'}`}
                      onClick={() => selectMemory(memory)}
                    >
                      {memory}
                    </button>
                  ))}
                </div>
                {selectedMemory && (
                  <div className="mt-2 text-sm text-gray-600">
                    Armazenamento selecionado: <span className="font-medium">{selectedMemory}</span>
                  </div>
                )}
              </div>
            )}
            
            {/* Variantes gerais (para outros tipos de produtos) */}
            {Object.keys(variants).length > 0 && colors.length === 0 && memories.length === 0 && (
              <div className="mb-6">
                {Object.keys(variants).map(attrName => (
                  <div key={attrName} className="mb-4">
                    <h3 className="font-semibold text-gray-700 mb-2">{attrName}</h3>
                    <div className="flex flex-wrap gap-2">
                      {variants[attrName].map(value => (
                        <button 
                          key={value}
                          className={`px-4 py-2 border rounded-md hover:border-orange-500 
                            ${selectedVariant === value ? 'border-orange-500 bg-orange-50' : 'border-gray-300'}`}
                          onClick={() => handleVariantSelection(value)}
                        >
                          {value}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* Quantidade */}
            <div className="mb-6">
              <h3 className="font-semibold text-gray-700 mb-2">Quantidade</h3>
              <div className="quantity-selector">
                <button 
                  className="quantity-button"
                  onClick={() => setQuantity(prev => prev > 1 ? prev - 1 : 1)}
                >
                  -
                </button>
                <input 
                  type="number" 
                  min="1" 
                  value={quantity} 
                  onChange={e => setQuantity(parseInt(e.target.value) || 1)}
                  className="quantity-input"
                />
                <button 
                  className="quantity-button"
                  onClick={() => setQuantity(prev => prev + 1)}
                >
                  +
                </button>
              </div>
            </div>            {/* Botão Adicionar ao Carrinho */}
            <button
              className="jsx-2605175872 add-to-cart-button"
              onClick={handleAddToCart}
              style={{
                width: '100%',
                minHeight: '50px',
                border: 'none',
                borderRadius: '8px',
                color: 'white',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #ff6900 0%, #00a8e1 100%)',
                transition: 'all 0.3s ease',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              Adicionar ao carrinho
            </button>
            
            {/* Benefícios */}
            <div className="benefits-container">
              <div className="benefit-item">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 8H17V4H3C1.9 4 1 4.9 1 6V17H3C3 18.66 4.34 20 6 20C7.66 20 9 18.66 9 17H15C15 18.66 16.34 20 18 20C19.66 20 21 18.66 21 17H23V12L20 8ZM19.5 9.5L21.46 12H17V9.5H19.5ZM6 18C5.45 18 5 17.55 5 17C5 16.45 5.45 16 6 16C6.55 16 7 16.45 7 17C7 17.55 6.55 18 6 18Z" fill="currentColor"/>
                </svg>
                <span>Entrega rápida para todo Brasil</span>
              </div>
              <div className="benefit-item">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L4 5V11.09C4 16.14 7.41 20.85 12 22C16.59 20.85 20 16.14 20 11.09V5L12 2ZM18 11.09C18 15.09 15.45 18.79 12 19.92C8.55 18.79 6 15.1 6 11.09V6.39L12 4.14L18 6.39V11.09Z" fill="currentColor"/>
                </svg>
                <span>Garantia de 12 meses</span>
              </div>
              <div className="benefit-item">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 8H17V6C17 3.24 14.76 1 12 1C9.24 1 7 3.24 7 6V8H6C4.9 8 4 8.9 4 10V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V10C20 8.9 19.1 8 18 8ZM12 17C10.9 17 10 16.1 10 15C10 13.9 10.9 13 12 13C13.1 13 14 13.9 14 15C14 16.1 13.1 17 12 17ZM15.1 8H8.9V6C8.9 4.29 10.29 2.9 12 2.9C13.71 2.9 15.1 4.29 15.1 6V8Z" fill="currentColor"/>
                </svg>
                <span>Compra 100% segura</span>
              </div>
            </div>
          </div>
        </div>
          {/* Tabs de Descrição */}
        <div className="modern-tab-container">
          <div className="modern-tab-navigation">
            <button 
              className={`modern-tab-button ${activeTab === 'description' ? 'active' : ''}`}
              onClick={() => setActiveTab('description')}
            >
              <span className="tab-icon">📝</span>
              <span className="tab-text">Descrição</span>
            </button>
            <button 
              className={`modern-tab-button ${activeTab === 'specs' ? 'active' : ''}`}
              onClick={() => setActiveTab('specs')}
            >
              <span className="tab-icon">⚙️</span>
              <span className="tab-text">Especificações</span>
            </button>
            <button 
              className={`modern-tab-button ${activeTab === 'reviews' ? 'active' : ''}`}
              onClick={() => setActiveTab('reviews')}
            >
              <span className="tab-icon">⭐</span>
              <span className="tab-text">Avaliações</span>
            </button>
          </div>
          
          <div className="modern-tab-content">
            {activeTab === 'description' && (
              <div className="tab-panel description-panel">
                <div className="panel-header">
                  <h3>Descrição do Produto</h3>
                </div>
                <div className="panel-content" dangerouslySetInnerHTML={{ __html: product.description || '<p>Sem descrição disponível para este produto.</p>' }} />
              </div>
            )}
            
            {activeTab === 'specs' && (
              <div className="tab-panel specs-panel">
                <div className="panel-header">
                  <h3>Especificações Técnicas</h3>
                </div>
                <div className="panel-content">
                  {product.shortDescription ? (
                    <div dangerouslySetInnerHTML={{ __html: product.shortDescription }} />
                  ) : (
                    <p>Especificações técnicas não disponíveis para este produto.</p>
                  )}
                </div>
              </div>
            )}
            
            {activeTab === 'reviews' && (
              <div className="tab-panel reviews-panel">
                <div className="panel-header">
                  <h3>Avaliações dos Clientes</h3>
                </div>
                <div className="panel-content">
                  <div className="reviews-summary">
                    <p className="reviews-count">
                      {product.reviewCount > 0 
                        ? `Este produto possui ${product.reviewCount} avaliações de clientes.` 
                        : 'Este produto ainda não possui avaliações. Seja o primeiro a avaliar!'}
                    </p>
                    <div className="review-action">
                      <button className="review-button">
                        Avaliar Produto
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
          {/* Produtos Relacionados */}
        {(!isEmpty(product?.related?.nodes) || relatedProducts.length > 0) && (
          <div className="related-products">
            <h2 className="related-products-title">Você também pode gostar</h2>
            <div className="related-products-grid">
              {(product.related?.nodes || relatedProducts).map(relProduct => (
                <div key={relProduct.id} className="related-product-card">
                  {((relProduct.on_sale || relProduct.onSale) && (relProduct.regular_price || relProduct.regularPrice)) && (
                    <div className="related-product-discount-tag">
                      OFERTA
                    </div>
                  )}
                  <Link href={`/produto/${relProduct.slug}`}>
                    <a className="related-product-link">
                      <div className="related-product-image">
                        {relProduct.image?.sourceUrl || relProduct.images?.[0]?.src ? (
                          <Image
                            src={relProduct.image?.sourceUrl || relProduct.images?.[0]?.src}
                            alt={relProduct.image?.altText || relProduct.name}
                            width={200}
                            height={200}
                            objectFit="contain"
                            className="related-product-img"
                          />
                        ) : (
                          <div className="related-product-placeholder">
                            <span>Imagem não disponível</span>
                          </div>
                        )}
                      </div>
                      <div className="related-product-info">
                        <h3 className="related-product-name">{relProduct.name}</h3>
                        <div className="related-product-prices">
                          {(relProduct.on_sale || relProduct.onSale) && (relProduct.regular_price || relProduct.regularPrice) && (
                            <div className="related-price-wrapper">
                              <span className="related-price-label">De:</span>
                              <span className="related-regular-price">
                                {formatPrice(relProduct.regular_price || relProduct.regularPrice)}
                              </span>
                            </div>
                          )}
                          <div className="related-price-wrapper">
                            <span className="related-price-label">
                              {(relProduct.on_sale || relProduct.onSale) ? 'Por:' : 'Preço:'}
                            </span>
                            <span className="related-sale-price">
                              {formatPrice(relProduct.price)}
                            </span>
                          </div>
                          <div className="related-installments">
                            em até <strong>12x</strong> sem juros
                          </div>
                        </div>
                      </div>
                    </a>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Avaliações de Produtos */}
        <div className="reviews-section mt-10">
          <h2 className="text-2xl font-semibold mb-6">Avaliações de Clientes</h2>
          <ProductReviews 
            reviews={product.reviews?.nodes || []} 
            averageRating={product.averageRating || 0} 
            productId={product.databaseId || product.id} 
          />
        </div>
        
        {/* Compartilhamento Social */}
        <div className="sharing-section mt-8 pb-10">
          <ShareButtons 
            url={typeof window !== 'undefined' ? window.location.href : `${process.env.NEXT_PUBLIC_SITE_URL || 'https://seu-site.com'}/produto/${product.slug}`}
            title={product.name}
            image={product.image?.sourceUrl || product.images?.[0]?.src || '/images/placeholder.jpg'}
          />
        </div>
      </div>
      
      {/* Estilos internos usando styled-jsx, substituindo o arquivo CSS */}
      <style jsx>{`
        .product-detail-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
          font-family: 'Rubik', sans-serif;
        }
        
        .breadcrumb-nav {
          margin-bottom: 20px;
          font-size: 14px;
        }
        
        .breadcrumb-nav a {
          color: #666;
          text-decoration: none;
          transition: color 0.2s;
        }
        
        .breadcrumb-nav a:hover {
          color: #FF6600;
        }
          .product-grid {
          display: grid;
          grid-template-columns: 1.25fr 0.75fr;
          gap: 40px;
          min-height: 540px;
        }
          @media (max-width: 768px) {
          .product-grid {
            grid-template-columns: 1fr;
            min-height: auto;
            gap: 20px;
          }
          
          .product-image-container {
            min-height: 450px;
            height: auto;
            max-height: none;
            margin-bottom: 16px;
            border-radius: 10px;
            padding: 0;
          }
          
          .product-info {
            padding: 16px;
            border-radius: 10px;
            max-height: none;
            height: auto;
            overflow-y: visible;
          }
        }
          .product-image-container {
          position: relative;
          border-radius: 12px;
          overflow: hidden;
          background: linear-gradient(135deg, rgba(255, 105, 0, 0.02), rgba(0, 168, 225, 0.02)), #fff;
          box-shadow: 0 4px 16px rgba(255, 105, 0, 0.08);
          border: 1px solid #e9ecef;
          transition: box-shadow 0.3s cubic-bezier(0.4,0,0.2,1), transform 0.3s cubic-bezier(0.4,0,0.2,1);
          max-height: 580px;
        }
        
        .product-image-container:hover {
          box-shadow: 0 8px 32px rgba(255, 105, 0, 0.15);
          transform: translateY(-2px) scale(1.01);
        }        .product-info {
          display: flex;
          flex-direction: column;
          background: linear-gradient(135deg, rgba(255, 105, 0, 0.04), rgba(0, 168, 225, 0.04)), #fff;
          border-radius: 12px;
          box-shadow: 0 4px 16px rgba(255, 105, 0, 0.08);
          border: 1px solid #e9ecef;
          padding: 20px;
          transition: box-shadow 0.3s cubic-bezier(0.4,0,0.2,1), transform 0.3s cubic-bezier(0.4,0,0.2,1);
          max-height: 600px;
          height: 600px;
          overflow-y: auto;
        }
        .product-info:hover {
          box-shadow: 0 8px 32px rgba(255, 105, 0, 0.15);
          transform: translateY(-2px) scale(1.01);
        }
        @media (max-width: 768px) {
          .product-info {
            padding: 16px;
            border-radius: 10px;
          }
        }        .product-title {
          font-size: 26px;
          font-weight: 600;
          margin-bottom: 14px;
          color: #ff6900;
          line-height: 1.3;        }.rating-container {
          display: flex;
          align-items: center;
          margin-bottom: 16px;
        }
          .price-container {
          margin-bottom: 16px;
        }.price {
          font-size: 30px;
          font-weight: 700;
          color: #ff6900;
        }
        
        .original-price {
          text-decoration: line-through;
          color: #777;
          margin-right: 8px;
          font-size: 16px;
        }
        
        .installment-info {
          font-size: 12px;
          color: #666;
          margin-top: 3px;
        }
        
        .payment-methods {
          display: flex;
          gap: 10px;
          margin-bottom: 14px;
        }.payment-method {
          display: flex;
          flex-direction: column;
          align-items: center;
          font-size: 10px;
        }          .payment-icon {
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: #f5f5f5;
          border-radius: 50%;
          margin-bottom: 4px;
        }
          .payment-icon-image {
          width: 32px;
          height: 32px;
          object-fit: contain;
        }
          /* Estilos para o seletor de cores */
        .color-option {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: 2px solid #e5e5e5;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          transition: transform 0.2s, border-color 0.2s;
        }
        
        .color-option:hover {
          transform: scale(1.1);
        }
        
        .color-option.selected {
          border: 2px solid #FF6600;
          box-shadow: 0 0 0 2px rgba(255, 102, 0, 0.3);
        }
        
        /* Sombra para cores claras */
        .color-option[style*="background-color: #FFFFFF"],
        .color-option[style*="background-color: #FFFFFE"] {
          box-shadow: inset 0 0 0 1px #ddd;
        }        .quantity-selector {
          display: flex;
          align-items: center;
          max-width: 120px;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          overflow: hidden;
          background: white;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        
        .quantity-button {
          background: linear-gradient(135deg, #f8fafc, #e2e8f0);
          border: none;
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          color: #64748b;
          transition: all 0.2s ease;
          user-select: none;
        }
        
        .quantity-button:hover {
          background: linear-gradient(135deg, #ff6900, #e55e00);
          color: white;
          transform: scale(1.05);
        }
        
        .quantity-button:active {
          transform: scale(0.95);
        }
        
        .quantity-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }
        
        .quantity-input {
          width: 48px;
          height: 36px;
          text-align: center;
          border: none;
          font-size: 14px;
          font-weight: 600;
          color: #1e293b;
          background: white;
          outline: none;
        }
        
        .quantity-input::-webkit-outer-spin-button,
        .quantity-input::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        
        .quantity-input[type=number] {
          -moz-appearance: textfield;
        }        .add-to-cart-button {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 12px 24px;
          font-size: 16px;
          font-weight: bold;
          color: white;
          background-color: #ff6900;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          width: 100%;
          max-width: 240px;
          height: 200px !important;
          min-height: 40px !important;
          margin-left: 0;
          margin-right: auto;
          position: relative;
          overflow: hidden;
          box-shadow: 0 4px 12px rgba(255, 105, 0, 0.3);
        }
        
        .add-to-cart-button:hover:not(.loading) {
          background-color: #e65c00;
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(255, 105, 0, 0.4);
        }        .add-to-cart-button.loading {
          background-color: #ff6900;
          cursor: not-allowed;
          width: 80px;
          height: 80px !important;
          min-height: 80px !important;
          border-radius: 50%;
          padding: 0;
          margin-left: 0;
          transform: scale(0.9);
          box-shadow: 0 2px 8px rgba(255, 105, 0, 0.4);
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
        }
        
        .add-to-cart-button.loading * {
          opacity: 1;
        }
        
        .add-to-cart-button:disabled {
          opacity: 0.9;
          cursor: not-allowed;
        }
          .benefits-container {
          background-color: #f9f9f9;
          border-radius: 6px;
          padding: 10px;
          margin-top: 12px;
        }
        
        .benefit-item {
          display: flex;
          align-items: center;
          margin-bottom: 6px;
          font-size: 11px;
        }
        
        .benefit-item svg {
          margin-right: 6px;
          color: #FF6600;
          width: 14px;
          height: 14px;
        }
          .tab-container {
          margin-top: 40px;
        }
        
        .tab-buttons {
          display: flex;
          border-bottom: 1px solid #ddd;
        }
        
        .tab-button {
          padding: 10px 20px;
          background: none;
          border: none;
          font-weight: 600;
          color: #666;
          cursor: pointer;
          position: relative;
        }
        
        .tab-button.active {
          color: #FF6600;
        }
        
        .tab-button.active::after {
          content: '';
          position: absolute;
          bottom: -1px;
          left: 0;
          width: 100%;
          height: 3px;
          background-color: #FF6600;
        }
        
        .tab-content {
          padding: 20px 0;
        }
        
        /* Modern Tab Styles */
        .modern-tab-container {
          margin: 60px 0 40px 0;
          padding: 0 20px;
        }
        
        .modern-tab-navigation {
          display: flex;
          background: linear-gradient(135deg, rgba(255, 105, 0, 0.08), rgba(0, 168, 225, 0.08)), #fff;
          border-radius: 16px;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
          overflow: hidden;
          border: 1px solid #e9ecef;
          margin-bottom: 30px;
        }
        
        .modern-tab-button {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 20px 24px;
          background: none;
          border: none;
          cursor: pointer;
          font-weight: 600;
          font-size: 16px;
          color: #64748b;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
        }
        
        .modern-tab-button::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, #ff6900 0%, #00a8e1 100%);
          opacity: 0;
          transition: opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          z-index: 1;
        }
        
        .modern-tab-button:hover::before {
          opacity: 0.1;
        }
        
        .modern-tab-button.active::before {
          opacity: 1;
        }
        
        .modern-tab-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 16px rgba(255, 105, 0, 0.2);
          color: #1e293b;
        }
        
        .modern-tab-button.active {
          color: white;
          background: linear-gradient(135deg, #ff6900 0%, #00a8e1 100%);
          box-shadow: 0 4px 16px rgba(255, 105, 0, 0.3);
          transform: translateY(-1px);
        }
        
        .modern-tab-button.active:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 20px rgba(255, 105, 0, 0.4);
        }
        
        .tab-icon {
          font-size: 18px;
          z-index: 2;
          position: relative;
        }
        
        .tab-text {
          z-index: 2;
          position: relative;
          font-weight: 600;
        }
        
        .modern-tab-content {
          background: linear-gradient(135deg, rgba(255, 105, 0, 0.04), rgba(0, 168, 225, 0.04)), #fff;
          border-radius: 16px;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
          border: 1px solid #e9ecef;
          overflow: hidden;
          transition: box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .modern-tab-content:hover {
          box-shadow: 0 8px 32px rgba(255, 105, 0, 0.15);
        }
        
        .tab-panel {
          padding: 0;
          animation: fadeIn 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .panel-header {
          background: linear-gradient(135deg, #ff6900 0%, #00a8e1 100%);
          color: white;
          padding: 24px 32px;
          margin: 0;
        }
        
        .panel-header h3 {
          margin: 0;
          font-size: 20px;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .panel-header h3::before {
          content: '✨';
          font-size: 22px;
        }
        
        .panel-content {
          padding: 32px;
          line-height: 1.7;
          color: #374151;
        }
        
        .panel-content h1,
        .panel-content h2,
        .panel-content h3,
        .panel-content h4,
        .panel-content h5,
        .panel-content h6 {
          color: #1e293b;
          margin-top: 24px;
          margin-bottom: 16px;
          font-weight: 600;
        }
        
        .panel-content p {
          margin-bottom: 16px;
          color: #4b5563;
        }
        
        .panel-content ul,
        .panel-content ol {
          margin: 16px 0;
          padding-left: 24px;
        }
        
        .panel-content li {
          margin-bottom: 8px;
          color: #4b5563;
        }
        
        .panel-content strong {
          color: #1e293b;
          font-weight: 600;
        }
        
        .reviews-summary {
          text-align: center;
        }
        
        .reviews-count {
          font-size: 16px;
          color: #64748b;
          margin-bottom: 24px;
        }
        
        .review-action {
          margin-top: 24px;
        }
        
        .review-button {
          background: linear-gradient(135deg, #ff6900 0%, #00a8e1 100%);
          color: white;
          border: none;
          padding: 16px 32px;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 4px 16px rgba(255, 105, 0, 0.3);
        }
        
        .review-button:hover {
          transform: translateY(-2px) scale(1.02);
          box-shadow: 0 8px 20px rgba(255, 105, 0, 0.4);
        }
        
        .review-button:active {
          transform: translateY(0) scale(0.98);
        }
        
        @media (max-width: 768px) {
          .modern-tab-container {
            margin: 40px 0 30px 0;
            padding: 0 16px;
          }
          
          .modern-tab-navigation {
            flex-direction: column;
            border-radius: 12px;
            margin-bottom: 20px;
          }
          
          .modern-tab-button {
            padding: 16px 20px;
            font-size: 15px;
            border-radius: 0;
          }
          
          .modern-tab-button:first-child {
            border-radius: 12px 12px 0 0;
          }
          
          .modern-tab-button:last-child {
            border-radius: 0 0 12px 12px;
          }
          
          .modern-tab-content {
            border-radius: 12px;
          }
          
          .panel-header {
            padding: 20px 24px;
          }
          
          .panel-header h3 {
            font-size: 18px;
          }
          
          .panel-content {
            padding: 24px;
          }
          
          .review-button {
            padding: 14px 28px;
            font-size: 15px;
          }
        }
        
        @media (max-width: 480px) {
          .product-detail-container {
            padding: 12px;
          }
          
          .product-grid {
            gap: 16px;
          }
          
          .product-image-container {
            min-height: 400px;
            border-radius: 8px;
          }
          
          .product-info {
            padding: 12px;
            border-radius: 8px;
          }
          
          .product-title {
            font-size: 22px;
            margin-bottom: 12px;
          }
          
          .price {
            font-size: 26px;
          }
        }
        
        @media (max-width: 320px) {
          .product-detail-container {
            padding: 8px;
          }
          
          .product-image-container {
            min-height: 350px;
          }
          
          .product-title {
            font-size: 20px;
          }
          
          .price {
            font-size: 24px;
          }
        }
          .related-products {
          margin-top: 60px;
          padding: 0 20px;
        }
        
        .related-products-title {
          font-size: 28px;
          font-weight: 700;
          margin-bottom: 30px;
          text-align: center;
          color: #333;
          position: relative;
        }
        
        .related-products-title::after {
          content: '';
          position: absolute;
          bottom: -10px;
          left: 50%;
          transform: translateX(-50%);
          width: 60px;
          height: 4px;
          background: linear-gradient(135deg, #ff6900 0%, #00a8e1 100%);
          border-radius: 2px;
        }
        
        .related-products-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 30px;
          max-width: 1400px;
          margin: 0 auto;
        }
        
        .related-product-card {
          background: white;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
          transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          position: relative;
          border: 1px solid #f0f0f0;
        }
        
        .related-product-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.15);
          border-color: #ff6900;
        }
        
        .related-product-discount-tag {
          position: absolute;
          top: 12px;
          right: 12px;
          background: linear-gradient(135deg, #ff6900 0%, #e55e00 100%);
          color: white;
          padding: 6px 12px;
          border-radius: 6px;
          font-weight: 700;
          font-size: 12px;
          z-index: 2;
          box-shadow: 0 2px 8px rgba(255, 105, 0, 0.3);
        }
        
        .related-product-link {
          display: block;
          text-decoration: none;
          color: inherit;
        }
        
        .related-product-image {
          aspect-ratio: 1;
          overflow: hidden;
          background: #f8fafc;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          position: relative;
        }
        
        .related-product-img {
          transition: transform 0.3s ease;
          width: 100%;
          height: 100%;
          object-fit: contain;
        }
        
        .related-product-card:hover .related-product-img {
          transform: scale(1.05);
        }
        
        .related-product-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #e2e8f0;
          color: #64748b;
          font-size: 14px;
          font-weight: 500;
          border-radius: 8px;
        }
        
        .related-product-info {
          padding: 24px;
        }
        
        .related-product-name {
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 16px;
          color: #1e293b;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          line-height: 1.4;
          min-height: 44px;
        }
        
        .related-product-prices {
          margin-bottom: 12px;
        }
        
        .related-price-wrapper {
          display: flex;
          align-items: baseline;
          gap: 8px;
          margin-bottom: 6px;
        }
        
        .related-price-label {
          font-size: 13px;
          color: #64748b;
          font-weight: 500;
        }
        
        .related-regular-price {
          color: #94a3b8;
          text-decoration: line-through;
          font-size: 14px;
          font-weight: 500;
        }
        
        .related-sale-price {
          color: #ff6900;
          font-size: 18px;
          font-weight: 700;
        }
        
        .related-installments {
          font-size: 12px;
          color: #64748b;
          font-weight: 500;
          margin-top: 8px;
        }
        
        @media (max-width: 768px) {
          .related-products {
            margin-top: 40px;
            padding: 0 16px;
          }
          
          .related-products-title {
            font-size: 24px;
            margin-bottom: 24px;
          }
          
          .related-products-grid {
            grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
            gap: 20px;
          }
          
          .related-product-info {
            padding: 20px;
          }
          
          .related-product-name {
            font-size: 15px;
            margin-bottom: 12px;
          }
          
          .related-sale-price {
            font-size: 16px;
          }
        }
        
        @media (max-width: 480px) {
          .related-products-grid {
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
            gap: 16px;
          }
        }
      `}</style>
      
      {/* Dados estruturados Schema.org */}
      <ProductSchema product={product} />
      
      <BreadcrumbSchema 
        items={[

          { name: 'Home', url: '/' },
          { name: product?.productCategories?.nodes?.[0]?.name || 'Produtos', url: `/categoria/${product?.productCategories?.nodes?.[0]?.slug || 'produtos'}` },
          { name: product.name, url: `/produto/${product.slug}` }
        ]}
      />
    </Layout>
  );
}

// Função getServerSideProps para fallback caso a página não tenha sido gerada estaticamente
export async function getServerSideProps(context) {
  return {
    props: {
      // Esta é uma página que será renderizada no lado do servidor
      // A implementação principal usa client-side data fetching
    }
  };
}