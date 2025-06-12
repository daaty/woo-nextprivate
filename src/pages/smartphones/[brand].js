import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import ProductGrid from '../../components/ProductGrid';
import BrandNavigation from '../../components/BrandNavigation';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function BrandPage() {
  const router = useRouter();
  const { brand } = router.query;
  const [products, setProducts] = useState([]);
  const [brandInfo, setBrandInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!brand) return;
    
    async function fetchBrandProducts() {
      try {
        // Replace with your actual API function
        const response = await fetch(`/api/products?category=smartphones&brand=${brand}`);
        const data = await response.json();
        setProducts(data.products || []);
        setBrandInfo(data.brandInfo || null);
      } catch (error) {
        console.error(`Error fetching ${brand} products:`, error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchBrandProducts();
  }, [brand]);

  // Map brand slugs to display names
  const brandNames = {
    'apple': 'Apple',
    'xiaomi': 'Xiaomi',
    'samsung': 'Samsung',
    'motorola': 'Motorola'
  };
  
  const displayName = brandNames[brand] || 'Marca Desconhecida';

  return (
    <Layout>
      <div className="container mx-auto py-6 px-4">
        <h1 className="text-3xl font-bold mb-6 text-center">
          Smartphones {displayName}
        </h1>
        
        <BrandNavigation 
          currentPath="smartphones"
          currentBrand={brand}
          brands={[
            { name: 'Apple', slug: 'apple' },
            { name: 'Xiaomi', slug: 'xiaomi' },
            { name: 'Samsung', slug: 'samsung' },
            { name: 'Motorola', slug: 'motorola' },
            { name: 'Ver todos', slug: '' },
          ]} 
        />
        
        {loading ? (
          <LoadingSpinner />
        ) : (
          <>
            {brandInfo && (
              <div className="mb-8 bg-gray-50 p-6 rounded-lg">
                <h2 className="text-xl font-bold mb-2">Sobre os Smartphones {displayName}</h2>
                <div className="text-gray-700">{brandInfo.description}</div>
              </div>
            )}
            
            <div className="mb-6">
              <p className="text-gray-600">
                {products.length} produtos encontrados
              </p>
            </div>
            
            <ProductGrid products={products} />
          </>
        )}
      </div>
    </Layout>
  );
}
