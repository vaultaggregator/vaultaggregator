/**
 * Performance Optimization Middleware
 * Implements compression, caching headers, and response optimization
 */

import compression from 'compression';
import { Request, Response, NextFunction } from 'express';

// Response time tracking middleware
export const responseTimeMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const method = req.method;
    const url = req.originalUrl;
    const status = res.statusCode;
    
    // Log slow requests (>1000ms)
    if (duration > 1000) {
      console.warn(`⚠️  Slow request: ${method} ${url} - ${duration}ms (Status: ${status})`);
    }
  });
  
  next();
};

// Cache control middleware for static assets
export const cacheControlMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // API responses - short cache for real-time data
  if (req.path.startsWith('/api/pools') || req.path.startsWith('/api/morpho')) {
    res.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=120');
  }
  // Static data - longer cache
  else if (req.path.startsWith('/api/chains') || req.path.startsWith('/api/platforms')) {
    res.set('Cache-Control', 'public, max-age=3600, stale-while-revalidate=7200');
  }
  // Public stats - moderate cache
  else if (req.path.startsWith('/api/stats')) {
    res.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
  }
  
  next();
};

// Request sanitization middleware
export const sanitizeRequestMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Sanitize query parameters
  if (req.query) {
    Object.keys(req.query).forEach(key => {
      if (typeof req.query[key] === 'string') {
        // Remove any potential XSS attempts
        req.query[key] = (req.query[key] as string)
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/javascript:/gi, '')
          .trim();
      }
    });
  }
  
  next();
};

// CORS optimization for better performance
export const corsOptimizationMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const origin = req.headers.origin;
  
  // Allow specific origins for better security and caching
  if (origin && (origin.includes('replit.dev') || origin.includes('replit.app') || origin === 'http://localhost:5000')) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
  }
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  
  next();
};

// Rate limiting configuration
export const createRateLimiter = (windowMs: number = 60000, max: number = 100) => {
  const requests = new Map<string, { count: number; resetTime: number }>();
  
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const now = Date.now();
    
    const record = requests.get(ip);
    
    if (!record || now > record.resetTime) {
      requests.set(ip, { count: 1, resetTime: now + windowMs });
      return next();
    }
    
    if (record.count >= max) {
      res.status(429).json({
        error: 'Too many requests',
        retryAfter: Math.ceil((record.resetTime - now) / 1000)
      });
      return;
    }
    
    record.count++;
    next();
  };
};

// Export compression middleware from the compression package
export { compression };

// Export all middleware as a single setup function
export const setupPerformanceMiddleware = (app: any) => {
  // Enable compression for all responses
  app.use(compression({
    level: 6,
    threshold: 1024,
    filter: (req: Request, res: Response) => {
      // Don't compress responses with this request header
      if (req.headers['x-no-compression']) {
        return false;
      }
      // Use compression for text-based responses
      return compression.filter(req, res);
    }
  }));
  
  // Apply other middleware
  app.use(responseTimeMiddleware);
  app.use(cacheControlMiddleware);
  app.use(sanitizeRequestMiddleware);
  app.use(corsOptimizationMiddleware);
  
  // Apply rate limiting to API endpoints
  app.use('/api/', createRateLimiter(60000, 100)); // 100 requests per minute
  
  console.log('✅ Performance optimization middleware configured');
};