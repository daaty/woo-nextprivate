import { useCart } from '../hooks/useCart'; // Hook unificado

const FeaturedProducts = () => {
  const { addToCart } = useCart(); // Sempre REST
  
  // ...existing code...
};

export default FeaturedProducts;