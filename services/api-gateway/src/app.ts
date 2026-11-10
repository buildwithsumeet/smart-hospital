import express from 'express';
import cors from 'cors';
import proxyRoutes from './routes/proxy.routes';
import aiRoutes from './routes/ai.routes';
import swaggerUi from 'swagger-ui-express';
import { swaggerDocument } from './docs/swagger';
import { gatewayAuthMiddleware } from './middlewares/auth-gateway.middleware';
import { gatewayRateLimiter } from './middlewares/rate-limiter.middleware';
import { errorHandler, requestLogger } from '@hospital/common';

const app = express();

app.use(cors());
app.use(requestLogger);
app.use(gatewayRateLimiter);

// Interactive OpenAPI / Swagger Documentation
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Health check endpoints for Kubernetes and Docker
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', service: 'api-gateway', timestamp: new Date().toISOString() });
});

app.get('/ready', (req, res) => {
  res.status(200).json({ status: 'READY', service: 'api-gateway' });
});

// Authentication Guard & Header Enrichment
app.use(gatewayAuthMiddleware);

// AI Service Routes (Ollama alpine/ollama:latest backend)
app.use('/api/v1/ai', express.json(), aiRoutes);

// Proxy Routes (/api/v1/...)
app.use('/api/v1', proxyRoutes);

// Centralized error handling
app.use(errorHandler);

export default app;
