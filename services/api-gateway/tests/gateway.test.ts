import request from 'supertest';
import app from '../src/app';
import jwt from 'jsonwebtoken';
import { UserRole } from '@hospital/common';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_change_in_production_12345';

const createToken = (userId: string, role: UserRole) => {
  return jwt.sign(
    { userId, email: `${role.toLowerCase()}@test.com`, role, firstName: 'Test', lastName: 'User' },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
};

describe('API Gateway - Integration & Routing Tests', () => {
  const patientToken = createToken('patient-123', UserRole.PATIENT);

  describe('GET /health & /ready', () => {
    it('should return 200 UP for health check', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('UP');
    });

    it('should return 200 READY for readiness check', async () => {
      const res = await request(app).get('/ready');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('READY');
    });

    it('should serve Swagger UI documentation at /docs', async () => {
      const res = await request(app).get('/docs/');
      expect(res.status).toBe(200);
      expect(res.text).toContain('Swagger UI');
    });
  });

  describe('Authentication Guard & Route Whitelisting', () => {
    it('should reject access to protected route without token', async () => {
      const res = await request(app).get('/api/v1/patients/me');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Missing or invalid Authorization header');
    });

    it('should reject access with invalid token signature', async () => {
      const res = await request(app)
        .get('/api/v1/patients/me')
        .set('Authorization', 'Bearer invalid-token-string');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should return correlation ID on every request header', async () => {
      const res = await request(app).get('/health');
      expect(res.headers['x-correlation-id']).toBeDefined();
    });
  });

  describe('AI Microservice Routes (Ollama Integration)', () => {
    it('should return health status of AI engine', async () => {
      const res = await request(app).get('/api/v1/ai/health');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.engine).toContain('alpine/ollama:latest');
    });

    it('should perform intelligent patient symptom triage without requiring prior auth', async () => {
      const res = await request(app)
        .post('/api/v1/ai/triage')
        .send({ symptoms: 'Chest pain radiating to my shoulder with palpitations' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.recommendedDepartment).toBe('Cardiology');
      expect(res.body.data.urgency).toBeDefined();
    });

    it('should allow authenticated Doctor to request clinical copilot assessment', async () => {
      const doctorToken = createToken('doc-1', UserRole.DOCTOR);
      const res = await request(app)
        .post('/api/v1/ai/copilot')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({
          symptoms: 'Persistent elevated blood pressure 160/95 and headache',
          patientAge: 52,
          gender: 'MALE',
          history: 'Hyperlipidemia'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.assessment).toBeDefined();
    });
  });
});
