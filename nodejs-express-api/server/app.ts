import express, { Express } from 'express';
import ejs from 'ejs';
import { authMiddleware } from '../helpers/auth_middleware.js';
import { createMiddleware } from './config/middleware.js';
import { setupRoutes } from './routes/index.js';
import { initializeDatabase } from './config/database.js';
import logger from '../helpers/logger.js';

const app: Express = express();

// View engine setup
app.set('views', 'views');
app.engine('html', ejs.renderFile);
app.set('view engine', 'ejs');

// Setup middleware
createMiddleware(app);

// Auth middleware for all /api routes
app.use("/api/", authMiddleware);

// Setup routes
setupRoutes(app);

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const { sequelize } = await import('../models/basemodel.ts');
    await sequelize.authenticate();
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      database: 'connected',
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: process.env.NODE_ENV === 'production' ? 'Service unavailable' : (error as Error).message,
    });
  }
});

// 404 handler
app.get('*', (req, res) => {
  res.status(404).json('Page not found');
});

// Global error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error:', { error: err.message, stack: err.stack, path: req.path, method: req.method });
  const status = (err as any).status || 500;
  const message =
    process.env.NODE_ENV === 'production'
      ? status === 500
        ? 'Internal server error'
        : err.message
      : err.message;
  res.status(status).json({
    error: message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
});

export default app;
