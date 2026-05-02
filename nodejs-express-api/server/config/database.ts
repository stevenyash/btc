import { sequelize } from '../../models/basemodel.js';
import logger from '../../helpers/logger.js';

export const initializeDatabase = async (): Promise<void> => {
   	try {
   	  console.log("in database init")
   	  await sequelize.authenticate();
   	  logger.info('Database connection established successfully');

   	  // Database sync is completely disabled.
   	  // Use explicit migrations (see /migrations folder) for schema changes.
   	  logger.info('Database sync disabled (use migrations for schema changes)');
   	} catch (error) {
   	  logger.error('Unable to connect to the database:', error);
   	  process.exit(1);
   	}
};

export const closeDatabase = async (): Promise<void> => {
  try {
    await sequelize.close();
    logger.info('Database connections closed');
  } catch (error) {
    logger.error('Error closing database:', error);
  }
};
