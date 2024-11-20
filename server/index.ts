import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic } from "./vite";
import { createServer } from "http";
import { seedToolExecutions } from "./tools";

const app = express();

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// CORS setup for development
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
    } else {
      next();
    }
  });
}

// Security headers
app.use((req, res, next) => {
  res.header('X-Content-Type-Options', 'nosniff');
  res.header('X-Frame-Options', 'DENY');
  res.header('X-XSS-Protection', '1; mode=block');
  next();
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  // Don't exit the process, just log the error
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  // Don't exit the process, just log the error
});

(async () => {
  try {
    const server = createServer(app);
    
    // Setup routes before Vite middleware
    registerRoutes(app, server);

    // Global error handler
    app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
      if (res.headersSent) {
        return next(err);
      }
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      console.error('Server error:', err);
      res.status(status).json({ message });
    });

    // Setup Vite or static serving
    if (app.get("env") === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    // Server startup
    const findAvailablePort = async (startPort: number): Promise<number> => {
      const net = await import('net');
      return new Promise((resolve) => {
        const server = net.createServer();
        server.listen(startPort, '0.0.0.0', () => {
          const { port } = server.address() as net.AddressInfo;
          server.close(() => resolve(port));
        });
        server.on('error', () => {
          resolve(findAvailablePort(startPort + 1));
        });
      });
    };

    const PORT = await findAvailablePort(Number(process.env.PORT) || 5000);
    const HOST = '0.0.0.0';

    await new Promise<void>((resolve, reject) => {
      try {
        const listener = server.listen(PORT, HOST, () => {
          const formattedTime = new Date().toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: true,
          });
          console.log(`${formattedTime} [express] serving on http://${HOST}:${PORT}`);
          
          // In development mode, we need to keep the process alive
          if (process.env.NODE_ENV === 'development') {
            console.log('Development mode: Keeping process alive');
            // Use a more robust keep-alive mechanism
            const keepAlive = () => setTimeout(keepAlive, 1000);
            keepAlive();
          }
          
          resolve();
        });

        listener.on('error', (error: Error) => {
          console.error('Server startup error:', error);
          reject(error);
        });

        // Handle server shutdown gracefully
        process.on('SIGTERM', () => {
          console.log('Received SIGTERM. Performing graceful shutdown...');
          listener.close(() => {
            console.log('Server closed');
            process.exit(0);
          });
        });

        // Enable keep-alive
        server.keepAliveTimeout = 65000;
        server.headersTimeout = 66000;

        // Add error handler for server
        server.on('error', (error: Error) => {
          console.error('Server error:', error);
        });
      } catch (error) {
        console.error('Failed to start server:', error);
        reject(error);
      }
    });
  } catch (err) {
    console.error('Server startup failed:', err);
    process.exit(1);
  }
})();
