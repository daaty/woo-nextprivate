import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';

/**
 * Componente de categorias com estilo corrigido para evitar sobreposições
 */
const ParentCategoriesBlock = ({ productCategories }) => {
    // Estado para armazenar imagens com erro de carregamento
    const [imageErrors, setImageErrors] = useState({});

    const handleImageError = (categoryId) => {
        setImageErrors(prev => ({
            ...prev,
            [categoryId]: true
        }));
    };

    return (
        <div className="product-categories-wrapper">
            <div className="product-categories-container flex flex-wrap">
                {productCategories.length ? (
                    productCategories.map(category => {
                        const imageUrl = imageErrors[category.id] 
                            ? '/placeholder-image.jpg' // Imagem local de fallback
                            : category?.image?.sourceUrl || '/placeholder-image.jpg';
                        
                        return (
                            <div key={category.id} className="product-category-wrapper w-full sm:w-1/2 md:w-1/3 lg:w-1/4 p-3">
                                <Link href={`/category/${category.slug}`}>
                                    <a className="product-category-block relative overflow-hidden rounded-lg shadow-md hover:shadow-lg transition-shadow">
                                        <div className="product-image-container relative h-40 md:h-64">
                                            {/* Imagem com tamanho controlado */}
                                            <img 
                                                src={imageUrl}
                                                alt={category.name}
                                                className="w-full h-full object-cover"
                                                style={{ 
                                                    position: 'relative', 
                                                    maxHeight: '250px',
                                                    width: '100%'
                                                }}
                                                onError={() => handleImageError(category.id)}
                                            />
                                        </div>
                                        <div className="category-title-container bg-white p-4 text-center">
                                            <h3 className="text-lg font-medium">{category.name}</h3>
                                        </div>
                                    </a>
                                </Link>
                            </div>
                        )
                    })
                ) : (
                    <p>Nenhuma categoria encontrada.</p>
                )}
            </div>
        </div>
    )
};

export default ParentCategoriesBlock;
