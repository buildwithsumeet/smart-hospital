import dotenv from 'dotenv';
dotenv.config();

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT_PATIENT || '8002', 10),
  db: {
    connectionString: process.env.PATIENT_DB_URL || 'postgresql://postgres:postgres@localhost:5432/hospital_patient_db'
  },
  rabbitmq: {
    url: process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672'
  }
};
