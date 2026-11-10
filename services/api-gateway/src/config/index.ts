import dotenv from 'dotenv';
dotenv.config();

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT_GATEWAY || '8000', 10),
  jwtSecret: process.env.JWT_SECRET || 'super_secret_jwt_key_change_in_production_12345',
  services: {
    auth: process.env.AUTH_SERVICE_URL || 'http://localhost:8001',
    patient: process.env.PATIENT_SERVICE_URL || 'http://localhost:8002',
    doctor: process.env.DOCTOR_SERVICE_URL || 'http://localhost:8003',
    appointment: process.env.APPOINTMENT_SERVICE_URL || 'http://localhost:8004',
    billing: process.env.BILLING_SERVICE_URL || 'http://localhost:8005',
    notification: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:8006'
  },
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000 // Limit each IP to 1000 requests per windowMs
  }
};
