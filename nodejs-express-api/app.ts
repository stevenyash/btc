import './env.js';
import app from './server/app.js';
import { initializeDatabase, closeDatabase } from './server/config/database.js';
import logger from './helpers/logger.js';
import { b2hService } from './services/b2hIntegrationService.js';
import http from 'http';

const PORT = process.env.PORT || 8060;

const server = http.createServer(app);

(async () => {
  try {
    await initializeDatabase();
    console.log('[B2H] Service ready:', b2hService.isConfigured());

    server.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
})();

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Server closed');
  });
  await closeDatabase();
  process.exit(0);
});