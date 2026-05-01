import './env.js';
import app from './server/app.js';
import { initializeDatabase, closeDatabase } from './server/config/database.js';
import logger from './helpers/logger.js';

const port = process.env.PORT || 8060;

(async () => {
  try {
    console.log("Starting app...");
    await initializeDatabase();

    const server = app.listen(port, () => {
      logger.info(`Server is up and running on port: ${port}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info('Learning Hierarchy API available at: /api/learning-hierarchy');
    });

    // Graceful shutdown handler
    const shutdown = async (signal: string) => {
      try {
        logger.info(`${signal} received: closing HTTP server`);
        server.close(async () => {
          logger.info('HTTP server closed');
          await closeDatabase();
          logger.info('Database connections closed');
          process.exit(0);
        });
      } catch (err) {
        logger.error('Error during shutdown:', err);
        process.exit(1);
      }
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    // Catch unhandled promise rejections
    process.on('unhandledRejection', (reason) => {
      logger.error('Unhandled Rejection:', reason);
    });

    // Catch uncaught exceptions
    process.on('uncaughtException', (err) => {
      logger.error('Uncaught Exception:', err);
      shutdown('UncaughtException');
    });

  } catch (error) {
    logger.error('Failed to start application:', error);
    process.exit(1);
  }
})();

export default app;
