import app from './app';
import { config } from './config';
import { createLogger } from '@hospital/common';

const logger = createLogger('Gateway:Server');

const server = app.listen(config.port, () => {
  logger.info(`API Gateway is running on port ${config.port} [${config.env}]`);
  logger.info('Proxying microservice targets:');
  logger.info(` - Auth: ${config.services.auth}`);
  logger.info(` - Patient: ${config.services.patient}`);
  logger.info(` - Doctor: ${config.services.doctor}`);
  logger.info(` - Appointment: ${config.services.appointment}`);
  logger.info(` - Billing: ${config.services.billing}`);
  logger.info(` - Notification: ${config.services.notification}`);
});

const shutdown = (signal: string) => {
  logger.info(`Received ${signal}. Shutting down API Gateway...`);
  server.close(() => {
    logger.info('Gateway HTTP server terminated.');
    process.exit(0);
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

export default app;
