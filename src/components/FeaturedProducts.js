import { useCart } from '../v2/cart/hooks/useCart'; // Using Cart v2

const FeaturedProducts = () => {
  const { addToCart } = useCart(); // Sempre REST
  
  // ...existing code...
};

export default FeaturedProducts;