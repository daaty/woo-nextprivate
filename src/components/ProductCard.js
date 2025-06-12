import Link from 'next/link';
import Image from 'next/image';

export default function ProductCard({ product }) {
  const { name, slug, price, compare_at_price, image } = product;
  
  // Calcular desconto se houver
  const discount = compare_at_price && compare_at_price > price 
    ? Math.round((1 - (price / compare_at_price)) * 100) 
    : 0;
  
  // Formatar preço em BRL
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };
  
  return (
    <div className="product-card group">
      <Link 
        href={`/produto/${slug}`} 
        className="block overflow-hidden rounded-lg transition-transform hover:scale-105"
      >
        <div className="relative aspect-square bg-gray-100">
          {image ? (
            <Image
              src={image.src}
              alt={image.alt || name}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-contain"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gray-200">
              <span className="text-gray-400">Sem imagem</span>
            </div>
          )}
          
          {discount > 0 && (
            <span className="absolute top-2 right-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">
              -{discount}%
            </span>
          )}
        </div>
        
        <div className="p-3">
          <h3 className="text-sm font-medium line-clamp-2 group-hover:text-primary transition-colors">{name}</h3>
          
          <div className="mt-2 flex items-baseline">
            <span className="text-primary font-bold">{formatCurrency(price)}</span>
            
            {compare_at_price && compare_at_price > price && (
              <span className="ml-2 text-gray-400 text-sm line-through">
                {formatCurrency(compare_at_price)}
              </span>
            )}
          </div>
          
          <div className="mt-2">
            <span className="text-xs text-gray-500">
              ou 12x de {formatCurrency(price / 12)}
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
}
