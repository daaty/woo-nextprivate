import React from 'react';
import Link from 'next/link';

const CategoryGrid = ({ categories }) => {
    return (
        <div className="category-grid">
            {categories.map(category => (
                <Link href={`/category/${category.slug}`} key={category.id}>
                    <a className="category-card">
                        <div className="category-image-container">
                            {category.image && (
                                <img 
                                    src={category.image.sourceUrl || '/placeholder-image.jpg'} 
                                    alt={category.name}
                                    className="category-image"
                                    onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src = '/placeholder-image.jpg';
                                    }}
                                />
                            )}
                        </div>
                        <h3 className="category-name">{category.name}</h3>
                    </a>
                </Link>
            ))}
        </div>
    );
};

export default CategoryGrid;
