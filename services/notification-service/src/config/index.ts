import dotenv from 'dotenv';
dotenv.config();

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT_NOTIFICATION || '8006', 10),
  mongo: {
    uri: process.env.NOTIFICATION_MONGO_URI || 'mongodb://localhost:27017/hospital_notification_db'
  },
  rabbitmq: {
    url: process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672'
  }
};
