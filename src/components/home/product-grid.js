import React from 'react';
import Link from 'next/link';
import Price from '../single-product/price';

const ProductGrid = ({ products }) => {
    if (!products || products.length === 0) {
        return <p>Nenhum produto encontrado.</p>;
    }

    return (
        <div className="product-grid">
            {products.map(product => {
                const img = product.image?.sourceUrl || '/placeholder-image.jpg';
                const productUrl = `/product/${product.slug}`;

                return (
                    <div className="product-card" key={product.id}>
                        <Link href={productUrl}>
                            <a className="product-image-link">
                                <img 
                                    src={img}
                                    alt={product.name}
                                    className="product-thumbnail"
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
                        <div className="product-info">
                            <Link href={productUrl}>
                                <a className="product-name">{product.name}</a>
                            </Link>
                            <div className="product-price">
                                <Price 
                                    regularPrice={product.regularPrice} 
                                    salePrice={product.salePrice} 
                                />
                            </div>
                            <button className="add-to-cart-button">
                                <i className="fas fa-shopping-cart"></i>
                                Adicionar
                            </button>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default ProductGrid;
