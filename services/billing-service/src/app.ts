import express from 'express';
import cors from 'cors';
import billingRoutes from './routes/billing.routes';
import { errorHandler, requestLogger } from '@hospital/common';

const app = express();

app.use(cors());
app.use(express.json());
app.use(requestLogger);

// Health check endpoints for Kubernetes and Docker
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', service: 'billing-service', timestamp: new Date().toISOString() });
});

app.get('/ready', (req, res) => {
  res.status(200).json({ status: 'READY', service: 'billing-service' });
});

// Service API Routes
app.use('/api/v1/billing', billingRoutes);

// Centralized error handling
app.use(errorHandler);

export default app;
