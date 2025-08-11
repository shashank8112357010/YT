import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";

export function createServer() {
  const app = express();

  // Security: Disable X-Powered-By header
  app.disable('x-powered-by');

  // Security: Set security headers
  app.use((req, res, next) => {
    // Content Security Policy
    res.setHeader('Content-Security-Policy',
      "default-src 'self'; " +
      "script-src 'self' 'unsafe-inline'; " +
      "style-src 'self' 'unsafe-inline'; " +
      "img-src 'self' data: https:; " +
      "connect-src 'self' https://www.youtube.com https://youtu.be; " +
      "frame-src 'none'; " +
      "object-src 'none'; " +
      "base-uri 'self'; " +
      "form-action 'self'; " +
      "upgrade-insecure-requests"
    );

    // Security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy',
      'geolocation=(), microphone=(), camera=(), fullscreen=(self)'
    );

    // HTTPS enforcement in production
    if (process.env.NODE_ENV === 'production') {
      res.setHeader('Strict-Transport-Security',
        'max-age=31536000; includeSubDomains; preload'
      );
    }

    next();
  });

  // Security: Configure CORS properly
  const corsOptions = {
    origin: process.env.NODE_ENV === 'production'
      ? process.env.ALLOWED_ORIGINS?.split(',') || false
      : true, // Allow all origins in development
    credentials: false, // Don't send cookies
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 86400 // 24 hours
  };

  app.use(cors(corsOptions));

  // Security: Body parsing with limits
  app.use(express.json({ limit: '10mb', strict: true }));
  app.use(express.urlencoded({
    extended: true,
    limit: '10mb',
    parameterLimit: 100
  }));

  // Security: Rate limiting middleware (basic implementation)
  const rateLimitMap = new Map();
  app.use('/api/', (req, res, next) => {
    const clientIp = req.ip || req.connection.remoteAddress || 'unknown';
    const now = Date.now();
    const windowMs = 60000; // 1 minute
    const maxRequests = 30; // 30 requests per minute

    if (!rateLimitMap.has(clientIp)) {
      rateLimitMap.set(clientIp, { count: 1, resetTime: now + windowMs });
      next();
      return;
    }

    const clientData = rateLimitMap.get(clientIp);
    if (now > clientData.resetTime) {
      rateLimitMap.set(clientIp, { count: 1, resetTime: now + windowMs });
      next();
      return;
    }

    if (clientData.count >= maxRequests) {
      res.status(429).json({
        error: 'Too many requests',
        retryAfter: Math.ceil((clientData.resetTime - now) / 1000)
      });
      return;
    }

    clientData.count++;
    next();
  });

  // Security: Input validation middleware
  app.use('/api/', (req, res, next) => {
    // Validate Content-Type for POST requests
    if (req.method === 'POST' && !req.is('application/json')) {
      return res.status(400).json({ error: 'Content-Type must be application/json' });
    }
    next();
  });

  // API routes
  app.get("/api/ping", (_req, res) => {
    // Security: Don't expose internal information
    res.json({ message: "pong", timestamp: new Date().toISOString() });
  });

  app.get("/api/demo", handleDemo);

  // Security: Error handling middleware
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Server error:', err);

    // Security: Don't leak error details in production
    if (process.env.NODE_ENV === 'production') {
      res.status(500).json({ error: 'Internal server error' });
    } else {
      res.status(500).json({ error: err.message, stack: err.stack });
    }
  });

  // Security: 404 handler - only for API routes in development
  // In production, this will be handled by the catch-all in node-build.ts
  if (process.env.NODE_ENV !== 'production') {
    // In development, only handle API 404s - let Vite handle frontend routes
    app.use('/api/*', (req, res) => {
      res.status(404).json({ error: 'API endpoint not found' });
    });
  }
  // Note: In production, we don't add any catch-all here since node-build.ts handles routing

  return app;
}
