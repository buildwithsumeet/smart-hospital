import express from 'express';
import cors from 'cors';
import appointmentRoutes from './routes/appointment.routes';
import { errorHandler, requestLogger } from '@hospital/common';

const app = express();

app.use(cors());
app.use(express.json());
app.use(requestLogger);

// Health check endpoints for Kubernetes and Docker
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', service: 'appointment-service', timestamp: new Date().toISOString() });
});

app.get('/ready', (req, res) => {
  res.status(200).json({ status: 'READY', service: 'appointment-service' });
});

// Service API Routes
app.use('/api/v1/appointments', appointmentRoutes);

// Centralized error handling
app.use(errorHandler);

export default app;
