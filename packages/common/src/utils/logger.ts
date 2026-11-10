import winston from 'winston';

const { combine, timestamp, printf, json, colorize } = winston.format;

export const createLogger = (serviceName: string) => {
  const isDev = process.env.NODE_ENV !== 'production';

  return winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    defaultMeta: { service: serviceName },
    format: combine(
      timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
      isDev
        ? printf(({ level, message, timestamp, service, ...meta }) => {
            const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
            return `[${timestamp}] [${service}] [${level.toUpperCase()}]: ${message}${metaStr}`;
          })
        : json()
    ),
    transports: [new winston.transports.Console()]
  });
};
