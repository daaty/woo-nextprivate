import React from 'react';
import Link from 'next/link';
import AddToCartButton from '../cart/AddToCartButton';
import Price from '../single-product/price';

const FeaturedProducts = ({ products }) => {
    if (!products || products.length === 0) {
        return <p>Nenhum produto em destaque.</p>;
    }

    return (
        <div className="featured-products-grid">
            {products.map(product => {
                const img = product.image?.sourceUrl || '/placeholder-image.jpg';
                const productUrl = `/product/${product.slug}`;

                return (
                    <div className="featured-product-card" key={product.id}>
                        <Link href={productUrl}>
                            <a className="product-image-container">
                                <img 
                                    src={img}
                                    alt={product.name}
                                    className="product-image"
                                    onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src = '/placeholder-image.jpg';
                                    }}
                                />
                                {product.onSale && (
                                    <span className="sale-badge">Oferta</span>
                                )}
                            </a>
                        </Link>
                        <div className="product-details">
                            <Link href={productUrl}>
                                <a className="product-name">{product.name}</a>
                            </Link>
                            <div className="product-price">
                                <Price 
                                    regularPrice={product.regularPrice} 
                                    salePrice={product.salePrice} 
                                />
                            </div>
                            {product.shortDescription && (
                                <div 
                                    className="product-description"
                                    dangerouslySetInnerHTML={{
                                        __html: product.shortDescription
                                    }}
                                />
                            )}
                            <div className="product-actions">
                                <AddToCartButton product={product} />
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default FeaturedProducts;
