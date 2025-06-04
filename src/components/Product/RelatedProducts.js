import ProductCard from '../ProductCard';

export default function RelatedProducts({ products }) {
  if (!products || products.length === 0) return null;
  
  return (
    <div className="related-products">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {products.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
