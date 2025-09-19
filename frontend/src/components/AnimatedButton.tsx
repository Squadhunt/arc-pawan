import React from 'react';
import { motion } from 'framer-motion';

interface AnimatedButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  className = '',
  icon,
  iconPosition = 'left'
}) => {
  const getVariantClasses = () => {
    const baseClasses = 'relative overflow-hidden font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black';
    
    const variants = {
      primary: 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500 shadow-lg hover:shadow-xl',
      secondary: 'bg-gray-600 hover:bg-gray-700 text-white focus:ring-gray-500 shadow-lg hover:shadow-xl',
      danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500 shadow-lg hover:shadow-xl',
      success: 'bg-green-600 hover:bg-green-700 text-white focus:ring-green-500 shadow-lg hover:shadow-xl',
      ghost: 'bg-transparent hover:bg-gray-800 text-gray-300 hover:text-white border border-gray-700 hover:border-gray-600 focus:ring-gray-500'
    };
    
    return `${baseClasses} ${variants[variant]}`;
  };

  const getSizeClasses = () => {
    const sizes = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-3 text-base'
    };
    
    return sizes[size];
  };

  const buttonVariants = {
    rest: { scale: 1 },
    hover: { 
      scale: 1.01,
      transition: {
        duration: 0.1
      }
    },
    tap: { 
      scale: 0.99,
      transition: {
        duration: 0.05
      }
    }
  };

  const rippleVariants = {
    initial: { scale: 0, opacity: 0.3 },
    animate: { 
      scale: 2, 
      opacity: 0,
      transition: {
        duration: 0.3,
        ease: "easeOut"
      }
    }
  };

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        ${getVariantClasses()} 
        ${getSizeClasses()} 
        ${disabled || loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} 
        ${className}
      `}
      variants={buttonVariants}
      initial="rest"
      whileHover={disabled || loading ? "rest" : "hover"}
      whileTap={disabled || loading ? "rest" : "tap"}
    >
      {/* Ripple effect overlay */}
      <motion.div
        className="absolute inset-0 bg-white rounded-lg"
        variants={rippleVariants}
        initial="initial"
        whileTap="animate"
      />
      
      {/* Button content */}
      <div className="relative flex items-center justify-center space-x-2">
        {loading ? (
          <motion.div
            className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
        ) : (
          <>
            {icon && iconPosition === 'left' && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2 }}
              >
                {icon}
              </motion.div>
            )}
            <span>{children}</span>
            {icon && iconPosition === 'right' && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2 }}
              >
                {icon}
              </motion.div>
            )}
          </>
        )}
      </div>
    </motion.button>
  );
};

export default AnimatedButton;
