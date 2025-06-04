import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import ProductDetail from '../../components/Product/ProductDetail';
import RelatedProducts from '../../components/Product/RelatedProducts';
import { getProductBySlug, getRelatedProducts } from '../../lib/api';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function ProductPage() {
  const router = useRouter();
  const { slug } = router.query;
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;

    const fetchProductData = async () => {
      try {
        const productData = await getProductBySlug(slug);
        setProduct(productData);
        
        // Fetch related products based on category
        if (productData?.categories?.length) {
          const categoryId = productData.categories[0].id;
          const related = await getRelatedProducts(categoryId, productData.id);
          setRelatedProducts(related);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching product:', error);
        setLoading(false);
      }
    };

    fetchProductData();
  }, [slug]);

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto py-10 flex justify-center">
          <LoadingSpinner />
        </div>
      </Layout>
    );
  }

  if (!product) {
    return (
      <Layout>
        <div className="container mx-auto py-10">
          <h1 className="text-2xl font-bold text-center">Produto não encontrado</h1>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto py-6 px-4">
        <ProductDetail product={product} />
        
        {relatedProducts.length > 0 && (
          <section className="mt-12">
            <h2 className="text-2xl font-bold mb-6 text-center">Produtos Relacionados</h2>
            <RelatedProducts products={relatedProducts} />
          </section>
        )}
      </div>
    </Layout>
  );
}
