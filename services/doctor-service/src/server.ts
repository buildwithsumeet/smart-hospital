import app from './app';
import { config } from './config';
import { Database } from './database/db';
import { seedDefaultDoctorsAndDepartments } from './database/seeds/seed-doctors';
import { createLogger, EventBus } from '@hospital/common';

const logger = createLogger('DoctorService:Server');

const startServer = async () => {
  try {
    // 1. Initialize DB & seed data
    await Database.testConnection();
    await seedDefaultDoctorsAndDepartments();

    // 2. Initialize RabbitMQ EventBus
    const eventBus = EventBus.getInstance(config.rabbitmq.url);
    await eventBus.connect();

    // 3. Start Express server
    const server = app.listen(config.port, () => {
      logger.info(`Doctor Service is running on port ${config.port} [${config.env}]`);
    });

    // Graceful Shutdown
    const shutdown = async (signal: string) => {
      logger.info(`Received ${signal}. Gracefully shutting down Doctor Service...`);
      server.close(async () => {
        logger.info('HTTP server closed.');
        await Database.close();
        await eventBus.close();
        process.exit(0);
      });

      setTimeout(() => {
        logger.error('Forcefully shutting down.');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (err) {
    logger.error('Failed to start Doctor Service:', err);
    process.exit(1);
  }
};

if (process.env.NODE_ENV !== 'test') {
  startServer();
}

export default app;
