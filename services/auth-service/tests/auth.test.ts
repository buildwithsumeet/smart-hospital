import request from 'supertest';
import app from '../src/app';
import { UserRepository } from '../src/repositories/user.repository';
import { seedDefaultUsers } from '../src/database/seeds/seed-users';

describe('Auth Service - Integration & API Tests', () => {
  beforeAll(async () => {
    UserRepository.setUseMemory(true);
    await seedDefaultUsers();
  });

  afterAll(async () => {
    UserRepository.clearMemory();
  });

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
  });

  describe('POST /api/v1/auth/register', () => {
    it('should successfully register a new patient', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'newpatient@hospital.com',
          password: 'Password@1234',
          firstName: 'Alice',
          lastName: 'Smith'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe('newpatient@hospital.com');
      expect(res.body.data.user.role).toBe('PATIENT');
      expect(res.body.data.tokens.accessToken).toBeDefined();
      expect(res.body.data.tokens.refreshToken).toBeDefined();
    });

    it('should return 409 Conflict if email is already registered', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'newpatient@hospital.com',
          password: 'Password@1234',
          firstName: 'Alice',
          lastName: 'Smith'
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
    });

    it('should return 422 if password is too short', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'shortpass@hospital.com',
          password: '123',
          firstName: 'Bob',
          lastName: 'Jones'
        });

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('should log in seeded admin with correct credentials', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'admin@hospital.com',
          password: 'Admin@12345'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.role).toBe('HOSPITAL_ADMIN');
      expect(res.body.data.tokens.accessToken).toBeDefined();
    });

    it('should return 401 Unauthorized for incorrect password', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'admin@hospital.com',
          password: 'WrongPassword'
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/auth/refresh', () => {
    it('should successfully refresh access token using valid refresh token', async () => {
      // First login
      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'patient@hospital.com',
          password: 'Patient@12345'
        });

      const refreshToken = loginRes.body.data.tokens.refreshToken;

      // Refresh
      const refreshRes = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken });

      expect(refreshRes.status).toBe(200);
      expect(refreshRes.body.success).toBe(true);
      expect(refreshRes.body.data.accessToken).toBeDefined();
      expect(refreshRes.body.data.refreshToken).toBeDefined();
    });
  });

  describe('RBAC Authorization', () => {
    it('should allow Super Admin or Hospital Admin to list users', async () => {
      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'admin@hospital.com',
          password: 'Admin@12345'
        });

      const token = loginRes.body.data.tokens.accessToken;

      const usersRes = await request(app)
        .get('/api/v1/auth/users')
        .set('Authorization', `Bearer ${token}`);

      expect(usersRes.status).toBe(200);
      expect(Array.isArray(usersRes.body.data)).toBe(true);
      expect(usersRes.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it('should forbid Patient from listing users', async () => {
      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'patient@hospital.com',
          password: 'Patient@12345'
        });

      const token = loginRes.body.data.tokens.accessToken;

      const usersRes = await request(app)
        .get('/api/v1/auth/users')
        .set('Authorization', `Bearer ${token}`);

      expect(usersRes.status).toBe(403);
      expect(usersRes.body.success).toBe(false);
    });
  });
});
