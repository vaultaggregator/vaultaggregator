import express, { type Request, Response, NextFunction } from "express";
import compression from "compression";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();

// Add compression middleware for all responses (improves Vite client loading)
app.use(compression({
  filter: (req, res) => {
    // Compress everything except already compressed formats
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
  level: 6, // Balanced compression level for speed
}));

// Add caching headers for static assets
app.use((req, res, next) => {
  // Cache Vite client and HMR files for better performance
  if (req.path.startsWith('/@vite/') || req.path.startsWith('/node_modules/')) {
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  } else if (req.path.startsWith('/src/')) {
    res.setHeader('Cache-Control', 'no-cache');
  }
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Initialize AI scheduler service
  const { aiScheduler } = await import("./services/aiSchedulerService");
  
  // Initialize simple holder count service (only updates counts, no individual holder storage)
  const { simpleHolderCountService } = await import("./services/simpleHolderCountService");
  // Run holder count updates every 30 minutes
  setInterval(() => {
    simpleHolderCountService.updateAllPoolHolderCounts().catch(err => 
      console.error('❌ Scheduled holder count update failed:', err)
    );
  }, 30 * 60 * 1000);
  console.log("✅ Simple Holder Count Service initialized - updating counts every 30 minutes");
  
  // Initialize API services from configuration (auto-registration system)
  const { ApiRegistrationService } = await import("./services/apiRegistrationService");
  await ApiRegistrationService.initializeApiServices();
  
  // Initialize service configurations from database
  const { initializeServiceConfigs } = await import("./services/systemMonitorService");
  await initializeServiceConfigs();
  
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
