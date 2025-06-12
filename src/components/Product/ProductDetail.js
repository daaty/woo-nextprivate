import { useState } from 'react';
import Image from 'next/image';
import parse from 'html-react-parser';
import { formatCurrency } from '../../utils/format';

export default function ProductDetail({ product }) {
  const [selectedVariation, setSelectedVariation] = useState(
    product.variations?.length > 0 ? product.variations[0] : null
  );
  const [mainImage, setMainImage] = useState(product.images?.[0]?.src || '/placeholder.png');
  const [quantity, setQuantity] = useState(1);
  
  const handleVariationChange = (variation) => {
    setSelectedVariation(variation);
    // If variation has its own image, update main image
    if (variation.image) {
      setMainImage(variation.image.src);
    }
  };

  const increaseQuantity = () => setQuantity(q => q + 1);
  const decreaseQuantity = () => setQuantity(q => q > 1 ? q - 1 : 1);
  
  const handleAddToCart = () => {
    // TODO: Implement add to cart functionality
    console.log('Adding to cart:', {
      product,
      variation: selectedVariation,
      quantity
    });
    
    // Show notification
    alert('Produto adicionado ao carrinho!');
  };

  const price = selectedVariation ? selectedVariation.price : product.price;
  const compareAtPrice = selectedVariation ? selectedVariation.compare_at_price : product.compare_at_price;
  const discount = compareAtPrice ? Math.round((1 - (price / compareAtPrice)) * 100) : 0;

  return (
    <div className="product-detail">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Product Gallery */}
        <div className="product-gallery">
          <div className="main-image bg-gray-100 rounded-lg overflow-hidden mb-4">
            <Image
              src={mainImage}
              alt={product.name}
              width={600}
              height={600}
              className="w-full h-auto object-contain"
              priority
            />
          </div>
          
          {product.images?.length > 1 && (
            <div className="thumbnails grid grid-cols-5 gap-2">
              {product.images.map((image, index) => (
                <div 
                  key={index} 
                  className={`cursor-pointer rounded-md overflow-hidden border-2 ${
                    mainImage === image.src ? 'border-primary' : 'border-transparent'
                  }`}
                  onClick={() => setMainImage(image.src)}
                >
                  <Image
                    src={image.src}
                    alt={`${product.name} - imagem ${index + 1}`}
                    width={100}
                    height={100}
                    className="w-full h-auto object-cover"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Product Info */}
        <div className="product-info">
          <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
          
          {product.brands && product.brands.length > 0 && (
            <p className="text-gray-600 mb-4">
              Marca: <span className="font-medium">{product.brands[0].name}</span>
            </p>
          )}
          
          <div className="pricing mb-6">
            {compareAtPrice && compareAtPrice > price ? (
              <div className="flex items-center">
                <p className="text-3xl font-bold text-primary">{formatCurrency(price)}</p>
                <p className="ml-2 text-lg line-through text-gray-500">{formatCurrency(compareAtPrice)}</p>
                <span className="ml-3 px-2 py-1 bg-red-600 text-white text-sm font-bold rounded">
                  -{discount}%
                </span>
              </div>
            ) : (
              <p className="text-3xl font-bold text-primary">{formatCurrency(price)}</p>
            )}
            
            <p className="text-sm text-gray-600 mt-2">
              ou 12x de {formatCurrency(price / 12)} sem juros
            </p>
          </div>
          
          {/* Variations */}
          {product.variations && product.variations.length > 0 && (
            <div className="variations mb-6">
              <h3 className="text-lg font-semibold mb-2">Opções disponíveis:</h3>
              <div className="grid grid-cols-2 gap-2">
                {product.variations.map((variation) => (
                  <button
                    key={variation.id}
                    className={`p-3 rounded-md border text-sm ${
                      selectedVariation?.id === variation.id 
                        ? 'border-primary bg-primary bg-opacity-10 text-primary' 
                        : 'border-gray-300'
                    }`}
                    onClick={() => handleVariationChange(variation)}
                  >
                    {variation.attributes.map(attr => attr.value).join(' - ')}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {/* Quantity */}
          <div className="quantity mb-6">
            <h3 className="text-lg font-semibold mb-2">Quantidade:</h3>
            <div className="flex items-center">
              <button 
                onClick={decreaseQuantity}
                className="w-10 h-10 bg-gray-200 rounded-l-md flex items-center justify-center"
              >
                -
              </button>
              <input 
                type="number" 
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                className="w-14 h-10 text-center border-y border-gray-200"
                min="1"
              />
              <button 
                onClick={increaseQuantity}
                className="w-10 h-10 bg-gray-200 rounded-r-md flex items-center justify-center"
              >
                +
              </button>
            </div>
          </div>
          
          {/* Add to cart */}
          <button 
            onClick={handleAddToCart}
            className="w-full py-3 px-6 bg-primary hover:bg-primary-dark text-white rounded-md font-medium transition duration-200"
          >
            Adicionar ao Carrinho
          </button>
          
          {/* Product Short Description */}
          {product.short_description && (
            <div className="mt-8 text-gray-700">
              {parse(product.short_description)}
            </div>
          )}
          
          {/* Shipping Info */}
          <div className="mt-8 p-4 bg-gray-50 rounded-md">
            <h3 className="font-medium mb-2">Formas de entrega:</h3>
            <div className="flex items-center text-sm text-gray-600 mb-2">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Frete grátis para todo o Brasil</span>
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Envio imediato</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Full Description */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-4 pb-2 border-b">Descrição do Produto</h2>
        <div className="prose max-w-none">
          {parse(product.description || '')}
        </div>
      </div>
    </div>
  );
}
