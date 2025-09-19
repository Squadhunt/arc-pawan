import React from 'react';
import { motion } from 'framer-motion';

interface AnimatedCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
  variant?: 'default' | 'elevated' | 'outlined';
  delay?: number;
}

const AnimatedCard: React.FC<AnimatedCardProps> = ({
  children,
  className = '',
  onClick,
  hoverable = true,
  variant = 'default',
  delay = 0
}) => {
  const getVariantClasses = () => {
    const baseClasses = 'rounded-xl transition-all duration-300 backdrop-blur-sm';
    
    const variants = {
      default: 'bg-gray-900/80 border border-gray-700/50 shadow-lg shadow-black/20',
      elevated: 'bg-gray-900/90 border border-gray-600/30 shadow-2xl shadow-black/30',
      outlined: 'bg-gray-900/40 border border-gray-600/60 shadow-md shadow-black/10'
    };
    
    return `${baseClasses} ${variants[variant]}`;
  };

  const cardVariants = {
    hidden: { 
      opacity: 0, 
      y: 10,
      scale: 0.98
    },
    visible: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      transition: {
        duration: 0.2,
        delay: delay * 0.1,
        ease: "easeOut"
      }
    },
    hover: hoverable ? {
      y: -4,
      scale: 1.02,
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.05)',
      transition: {
        duration: 0.2,
        ease: "easeOut"
      }
    } : {},
    tap: {
      scale: 0.99,
      transition: {
        duration: 0.05
      }
    }
  };

  return (
    <motion.div
      className={`
        ${getVariantClasses()} 
        ${onClick ? 'cursor-pointer' : ''} 
        ${className}
      `}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover={hoverable ? "hover" : undefined}
      whileTap={onClick ? "tap" : undefined}
      onClick={onClick}
      layout
    >
      {children}
    </motion.div>
  );
};

export default AnimatedCard;
