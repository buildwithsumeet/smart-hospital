import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes';
import { errorHandler, requestLogger } from '@hospital/common';

const app = express();

app.use(cors());
app.use(express.json());
app.use(requestLogger);

// Health check endpoints for Kubernetes and Docker
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', service: 'auth-service', timestamp: new Date().toISOString() });
});

app.get('/ready', (req, res) => {
  res.status(200).json({ status: 'READY', service: 'auth-service' });
});

// Service API Routes
app.use('/api/v1/auth', authRoutes);

// Centralized error handling
app.use(errorHandler);

export default app;
