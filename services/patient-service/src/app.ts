import express from 'express';
import cors from 'cors';
import patientRoutes from './routes/patient.routes';
import { errorHandler, requestLogger } from '@hospital/common';

const app = express();

app.use(cors());
app.use(express.json());
app.use(requestLogger);

// Health check endpoints for Kubernetes and Docker
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', service: 'patient-service', timestamp: new Date().toISOString() });
});

app.get('/ready', (req, res) => {
  res.status(200).json({ status: 'READY', service: 'patient-service' });
});

// Service API Routes
app.use('/api/v1/patients', patientRoutes);

// Centralized error handling
app.use(errorHandler);

export default app;
