import app from './app';
import { config } from './config';
import { Database } from './database/db';
import { seedDefaultUsers } from './database/seeds/seed-users';
import { createLogger, EventBus } from '@hospital/common';

const logger = createLogger('AuthService:Server');

const startServer = async () => {
  try {
    // 1. Initialize DB & seed default data
    const dbConnected = await Database.testConnection();
    if (dbConnected) {
      logger.info('Database connected successfully.');
    } else {
      logger.warn('Running with fallback in-memory user repository.');
    }
    await seedDefaultUsers();

    // 2. Initialize RabbitMQ EventBus
    const eventBus = EventBus.getInstance(config.rabbitmq.url);
    await eventBus.connect();

    // 3. Start Express server
    const server = app.listen(config.port, () => {
      logger.info(`Auth Service is running on port ${config.port} [${config.env}]`);
    });

    // Graceful Shutdown
    const shutdown = async (signal: string) => {
      logger.info(`Received ${signal}. Gracefully shutting down Auth Service...`);
      server.close(async () => {
        logger.info('HTTP server closed.');
        await Database.close();
        await eventBus.close();
        process.exit(0);
      });

      // Force exit after 10s if hanging
      setTimeout(() => {
        logger.error('Could not close connections in time, forcefully shutting down.');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (err) {
    logger.error('Failed to start Auth Service:', err);
    process.exit(1);
  }
};

if (process.env.NODE_ENV !== 'test') {
  startServer();
}

export default app;
