import React, { useState } from 'react';
import { getMediaUrl } from '../utils/api';

// Placeholder images for different types
const PLACEHOLDERS = {
  property: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80',
  avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&q=80',
  ad: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&q=80',
  default: 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&q=80'
};

/**
 * SafeImage - An image component with automatic fallback for broken images
 * 
 * @param {string} src - Image source URL
 * @param {string} alt - Alt text for the image
 * @param {string} type - Type of image for fallback (property, avatar, ad, default)
 * @param {string} className - CSS classes
 * @param {object} style - Inline styles
 * @param {object} props - Additional props to pass to img element
 */
const SafeImage = ({ 
  src, 
  alt = 'Image', 
  type = 'default', 
  className = '', 
  style = {},
  ...props 
}) => {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const imageSrc = hasError 
    ? PLACEHOLDERS[type] || PLACEHOLDERS.default 
    : getMediaUrl(src, type);

  const handleError = () => {
    if (!hasError) {
      setHasError(true);
      setIsLoading(false);
    }
  };

  const handleLoad = () => {
    setIsLoading(false);
  };

  return (
    <div className={`relative ${className}`} style={style}>
      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse rounded" />
      )}
      <img
        src={imageSrc}
        alt={alt}
        onError={handleError}
        onLoad={handleLoad}
        className={`${className} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        style={style}
        {...props}
      />
    </div>
  );
};

export default SafeImage;
