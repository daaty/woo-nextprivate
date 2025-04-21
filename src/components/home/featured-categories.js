import React from 'react';
import Link from 'next/link';

const FeaturedCategories = ({ categories }) => {
  return (
    <div className="featured-categories">
      <h2>Categorias em Destaque</h2>
      <div className="categories-grid">
        {categories.map(category => (
          <Link href={`/category/${category.slug}`} key={category.id}>
            <a className="category-card">
              {category.image && (
                <img src={category.image.sourceUrl} alt={category.name} />
              )}
              <h3>{category.name}</h3>
            </a>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default FeaturedCategories;
