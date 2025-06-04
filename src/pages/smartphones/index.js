import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import ProductGrid from '../../components/ProductGrid';
import BrandNavigation from '../../components/BrandNavigation';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function SmartphonesPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProducts() {
      try {
        // Replace with your actual API function
        const response = await fetch('/api/products?category=smartphones');
        const data = await response.json();
        setProducts(data);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchProducts();
  }, []);

  return (
    <Layout>
      <div className="container mx-auto py-6 px-4">
        <h1 className="text-3xl font-bold mb-6 text-center">Smartphones</h1>
        
        <BrandNavigation 
          currentPath="smartphones"
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
