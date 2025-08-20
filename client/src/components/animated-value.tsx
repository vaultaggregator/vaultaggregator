import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface AnimatedValueProps {
  value: string | number;
  className?: string;
  prefix?: string;
  suffix?: string;
  duration?: number;
  children?: React.ReactNode;
}

export function AnimatedValue({ 
  value, 
  className = '', 
  prefix = '', 
  suffix = '', 
  duration = 0.5,
  children 
}: AnimatedValueProps) {
  // Immediately update display value without animation
  const displayValue = value;

  return (
    <div className={className}>
      {children ? children : (
        <span>
          {prefix}{displayValue}{suffix}
        </span>
      )}
    </div>
  );
}

interface PulsingDotProps {
  isActive?: boolean;
  size?: 'sm' | 'md' | 'lg';
  color?: 'green' | 'blue' | 'purple' | 'orange';
}

export function PulsingDot({ 
  isActive = false, 
  size = 'sm',
  color = 'green' 
}: PulsingDotProps) {
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3', 
    lg: 'w-4 h-4'
  };
  
  const colorClasses = {
    green: 'bg-green-500',
    blue: 'bg-blue-500',
    purple: 'bg-purple-500',
    orange: 'bg-orange-500'
  };

  return (
    <div className="relative flex items-center justify-center">
      <motion.div
        className={`rounded-full ${sizeClasses[size]} ${colorClasses[color]}`}
        animate={isActive ? {
          scale: [1, 1.2, 1],
          opacity: [1, 0.7, 1]
        } : {}}
        transition={{
          duration: 1.5,
          repeat: isActive ? Infinity : 0,
          ease: "easeInOut"
        }}
      />
      
      {/* Ripple effect */}
      {isActive && (
        <motion.div
          className={`absolute rounded-full border-2 ${colorClasses[color].replace('bg-', 'border-')}`}
          initial={{ scale: 0, opacity: 0.7 }}
          animate={{ 
            scale: [0, 2, 3],
            opacity: [0.7, 0.3, 0]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeOut"
          }}
        />
      )}
    </div>
  );
}

interface ShimmerEffectProps {
  isActive?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function ShimmerEffect({ 
  isActive = false, 
  children, 
  className = '' 
}: ShimmerEffectProps) {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      {children}
      
      {/* Shimmer overlay */}
      {isActive && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
          initial={{ x: '-100%' }}
          animate={{ x: '200%' }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      )}
    </div>
  );
}