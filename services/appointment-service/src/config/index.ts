import dotenv from 'dotenv';
dotenv.config();

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT_APPOINTMENT || '8004', 10),
  db: {
    connectionString: process.env.APPOINTMENT_DB_URL || 'postgresql://postgres:postgres@localhost:5432/hospital_appointment_db'
  },
  rabbitmq: {
    url: process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672'
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379'
  }
};
