import React, { useState, useEffect, useRef, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { formatNumber } from '@/lib/format';

interface AnimatedValueProps {
  value: string | number;
  className?: string;
  children?: React.ReactNode;
  compareValue?: string | number; // For custom comparison logic
  animationType?: 'fade' | 'slide' | 'scale' | 'flash';
  duration?: number; // Animation duration in milliseconds
  flashColors?: {
    increase: string;
    decrease: string;
  };
  useRandomDelay?: boolean; // Whether to use random delays for staggered animations (default: true)
  maxDelayMs?: number; // Maximum delay in milliseconds (default: 5000)
}

export function AnimatedValue({
  value,
  className = '',
  children,
  compareValue,
  animationType = 'flash',
  duration = 1200,
  flashColors = {
    increase: 'animate-flash-increase',
    decrease: 'animate-flash-decrease'
  },
  useRandomDelay = true,
  maxDelayMs = 5000
}: AnimatedValueProps) {
  // Always use the formatted value for display, never the compareValue
  const [displayValue, setDisplayValue] = useState(value);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationClass, setAnimationClass] = useState('');
  const [changeDirection, setChangeDirection] = useState<'increase' | 'decrease' | 'none'>('none');
  const previousCompareRef = useRef(compareValue || value);
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    // Always update the display with the formatted value
    setDisplayValue(value);
    
    // Use compareValue for comparison if provided, otherwise use value
    const currentCompare = compareValue !== undefined ? compareValue : value;
    const previousCompare = previousCompareRef.current;
    
    // Convert values to numbers for comparison if they're numeric strings
    const currentNum = typeof currentCompare === 'string' ? parseFloat(currentCompare) : currentCompare;
    const previousNum = typeof previousCompare === 'string' ? parseFloat(previousCompare) : previousCompare;
    
    // Check if both values are valid numbers
    const isNumericComparison = !isNaN(currentNum as number) && !isNaN(previousNum as number);
    
    // For numeric values, check if there's a meaningful change (not just rounding differences)
    let hasNumericChange = false;
    if (isNumericComparison) {
      // Use a small epsilon for floating point comparison
      const epsilon = 0.001;
      hasNumericChange = Math.abs(currentNum - previousNum) > epsilon;
    }
    
    // For non-numeric values, check for exact change
    const hasTextChange = !isNumericComparison && currentCompare !== previousCompare;
    
    // Only animate if there's an actual change
    if (hasNumericChange) {
      // Numeric value changed - animate based on direction
      const direction = currentNum > previousNum ? 'increase' : 'decrease';
      setChangeDirection(direction);
      
      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      // Generate random delay for staggered animations
      // This creates a nice visual effect where updates don't all flash at once
      const randomDelay = useRandomDelay ? Math.random() * maxDelayMs : 0;
      
      // Apply animation with random delay
      timeoutRef.current = setTimeout(() => {
        setIsAnimating(true);
        
        switch (animationType) {
          case 'fade':
            setAnimationClass('animate-pulse opacity-50');
            break;
          case 'slide':
            setAnimationClass('transform translate-y-1 opacity-50 transition-all duration-300');
            break;
          case 'scale':
            setAnimationClass('transform scale-105 transition-transform duration-200');
            break;
          case 'flash':
          default:
            setAnimationClass(direction === 'increase' ? flashColors.increase : flashColors.decrease);
            break;
        }
        
        // Remove animation after duration
        setTimeout(() => {
          setIsAnimating(false);
          setAnimationClass('');
          setChangeDirection('none');
        }, duration);
      }, randomDelay);
    } else if (hasTextChange) {
      // Non-numeric text changed - simple pulse animation with optional random delay
      const randomDelay = useRandomDelay ? Math.random() * maxDelayMs : 0;
      
      timeoutRef.current = setTimeout(() => {
        setIsAnimating(true);
        setAnimationClass('animate-pulse');
        
        setTimeout(() => {
          setIsAnimating(false);
          setAnimationClass('');
        }, duration);
      }, randomDelay);
    }
    // If no change, don't animate
    
    // Update previous compare value ref for next comparison
    previousCompareRef.current = currentCompare;
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [value, compareValue, animationType, duration, flashColors.increase, flashColors.decrease]);

  const baseTransitionClass = 'transition-all duration-300 ease-in-out';
  
  if (children) {
    // Render children with animation wrapper
    return (
      <span 
        className={cn(
          baseTransitionClass,
          className,
          isAnimating && animationClass
        )}
        data-testid="animated-value-wrapper"
      >
        {children}
      </span>
    );
  }
  
  // Render the value directly
  return (
    <span 
      className={cn(
        baseTransitionClass,
        className,
        isAnimating && animationClass
      )}
      data-testid="animated-value"
    >
      {displayValue}
    </span>
  );
}

// Hook for managing animated values in components
export function useAnimatedValue(initialValue: string | number) {
  const [value, setValue] = useState(initialValue);
  const [isAnimating, setIsAnimating] = useState(false);
  
  const updateValue = (newValue: string | number) => {
    if (newValue !== value) {
      setIsAnimating(true);
      setValue(newValue);
      
      // Reset animation state after a short delay
      setTimeout(() => {
        setIsAnimating(false);
      }, 600);
    }
  };
  
  return {
    value,
    setValue: updateValue,
    isAnimating
  };
}

// Utility component for animated numbers with formatting
interface AnimatedNumberProps {
  value: number;
  formatter?: (value: number) => string;
  className?: string;
  animationType?: 'fade' | 'slide' | 'scale' | 'flash';
  precision?: number;
}

export function AnimatedNumber({
  value,
  formatter,
  className,
  animationType = 'flash',
  precision = 2
}: AnimatedNumberProps) {
  const formatValue = (val: number) => {
    if (formatter) return formatter(val);
    return val.toFixed(precision);
  };
  
  return (
    <AnimatedValue
      value={formatValue(value)}
      compareValue={value}
      className={className}
      animationType={animationType}
    />
  );
}

// Utility component for animated percentages
interface AnimatedPercentageProps {
  value: number;
  className?: string;
  showSign?: boolean;
  precision?: number;
}

export function AnimatedPercentage({
  value,
  className,
  showSign = false,
  precision = 2
}: AnimatedPercentageProps) {
  const formatValue = (val: number) => {
    const formatted = val.toFixed(precision);
    return showSign && val > 0 ? `+${formatted}%` : `${formatted}%`;
  };
  
  return (
    <AnimatedValue
      value={formatValue(value)}
      compareValue={value}
      className={className}
      animationType="flash"
    />
  );
}

// Utility component for animated currency values
interface AnimatedCurrencyProps {
  value: number;
  currency?: string;
  className?: string;
  compact?: boolean;
}

export function AnimatedCurrency({
  value,
  currency = '$',
  className,
  compact = true
}: AnimatedCurrencyProps) {
  const formattedValue = useMemo(() => {
    if (compact) {
      return formatNumber(value, { currency, maxDecimals: 2 });
    }
    return `${currency}${value.toLocaleString()}`;
  }, [value, currency, compact]);
  
  return (
    <AnimatedValue
      value={formattedValue}
      compareValue={value}
      className={className}
      animationType="flash"
    />
  );
}