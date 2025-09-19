import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { generateWebPUrl, generateBlurDataURL } from '../utils/imageOptimization';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  priority?: boolean;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  sizes?: string;
  quality?: number;
  style?: React.CSSProperties;
  onClick?: () => void;
  onLoad?: () => void;
  onError?: () => void;
  fastLoad?: boolean; // New prop for fast loading
}

const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  className = '',
  width,
  height,
  priority = false,
  placeholder = 'blur',
  blurDataURL,
  sizes,
  quality = 75,
  style,
  onClick,
  onLoad,
  onError,
  fastLoad = false
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(priority || fastLoad);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (priority || fastLoad || isInView) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '200px 0px', // Increased from 50px to 200px for faster loading
        threshold: 0.01 // Reduced threshold for earlier loading
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [priority, isInView]);

  // Generate optimized URL with WebP support
  const getOptimizedSrc = (originalSrc: string) => {
    return generateWebPUrl(originalSrc, {
      width,
      height,
      quality,
      format: 'auto'
    });
  };

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  // Generate blur placeholder
  const getBlurPlaceholder = () => {
    if (blurDataURL) return blurDataURL;
    return generateBlurDataURL(width || 40, height || 40);
  };

  const optimizedSrc = getOptimizedSrc(src);
  const blurPlaceholder = getBlurPlaceholder();

  if (hasError) {
    return (
      <div
        ref={imgRef}
        className={`bg-gray-200 dark:bg-gray-700 flex items-center justify-center ${className}`}
        style={{ width, height, ...style }}
        onClick={onClick}
      >
        <div className="text-gray-400 text-sm">Failed to load</div>
      </div>
    );
  }

  return (
    <div
      ref={imgRef}
      className={`relative overflow-hidden flex justify-center items-center ${className}`}
      style={{ width, height, ...style }}
      onClick={onClick}
    >
      {/* Blur placeholder */}
      {!isLoaded && placeholder === 'blur' && (
        <motion.div
          className="absolute inset-0 bg-gray-200 dark:bg-gray-700"
          initial={{ opacity: 1 }}
          animate={{ opacity: isLoaded ? 0 : 1 }}
          transition={{ duration: 0.3 }}
        >
          <img
            src={blurPlaceholder}
            alt=""
            className="w-full h-full object-cover filter blur-sm scale-110"
            style={{ imageRendering: 'pixelated' }}
          />
        </motion.div>
      )}

      {/* Loading skeleton */}
      {!isLoaded && placeholder === 'empty' && (
        <motion.div
          className="absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse"
          initial={{ opacity: 1 }}
          animate={{ opacity: isLoaded ? 0 : 1 }}
          transition={{ duration: 0.3 }}
        />
      )}

      {/* Actual image */}
      {isInView && (
        <motion.img
          src={optimizedSrc}
          alt={alt}
          className="w-full h-full object-cover mx-auto"
          width={width}
          height={height}
          sizes={sizes}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          onLoad={handleLoad}
          onError={handleError}
          initial={{ opacity: 0 }}
          animate={{ opacity: isLoaded ? 1 : 0 }}
          transition={{ duration: 0.3 }}
          style={{
            imageRendering: 'auto',
            display: 'block'
          }}
        />
      )}
    </div>
  );
};

export default OptimizedImage;
