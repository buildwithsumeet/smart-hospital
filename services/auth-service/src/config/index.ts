import dotenv from 'dotenv';
dotenv.config();

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT_AUTH || '8001', 10),
  jwt: {
    secret: process.env.JWT_SECRET || 'super_secret_jwt_key_change_in_production_12345',
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'super_secret_refresh_key_change_in_production_67890',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
  },
  db: {
    connectionString: process.env.AUTH_DB_URL || 'postgresql://postgres:postgres@localhost:5432/hospital_auth_db'
  },
  rabbitmq: {
    url: process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672'
  }
};
