import Link from 'next/link';

export default function BrandNavigation({ brands, currentBrand }) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2 md:gap-4 mb-8">
      {brands.map((brand) => {
        const isActive = brand.slug === currentBrand;
        const href = `/categoria/${brand.slug}`;
          
        return (
          <Link 
            href={href} 
            key={brand.slug}
            className={`px-4 py-2 rounded-full text-sm md:text-base transition-colors ${
              isActive 
                ? 'bg-primary text-white' 
                : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            {brand.name}
          </Link>
        );
      })}
    </div>
  );
}
