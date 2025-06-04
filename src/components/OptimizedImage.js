// src/components/OptimizedImage.js
import Image from 'next/image';

export default function OptimizedImage({ src, alt, className, priority = false }) {
  return (
    <div className="relative w-full h-full">
      <Image 
        src={src || "https://via.placeholder.com/600x600/f0f0f0/CCCCCC?text=Sem+Imagem"}
        alt={alt || "Produto"}
        fill
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        priority={priority}
        className={`object-contain ${className || ''}`}
      />
    </div>
  );
}