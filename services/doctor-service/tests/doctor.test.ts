import request from 'supertest';
import app from '../src/app';
import { DoctorRepository } from '../src/repositories/doctor.repository';
import { seedDefaultDoctorsAndDepartments } from '../src/database/seeds/seed-doctors';
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

describe('Doctor Service - Integration & API Tests', () => {
  const adminToken = createToken('admin-user-id', UserRole.HOSPITAL_ADMIN);
  let seededDoctorId: string;

  beforeAll(async () => {
    DoctorRepository.setUseMemory(true);
    await seedDefaultDoctorsAndDepartments();
    const doctors = await DoctorRepository.listDoctors({});
    seededDoctorId = doctors[0].id;
  });

  afterAll(async () => {
    DoctorRepository.clearMemory();
  });

  describe('GET /health & /ready', () => {
    it('should return UP and READY', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('UP');
    });
  });

  describe('Departments Management', () => {
    it('should list all departments', async () => {
      const res = await request(app).get('/api/v1/doctors/departments');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(5);
    });

    it('should allow Admin to create a new department', async () => {
      const res = await request(app)
        .post('/api/v1/doctors/departments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Dermatology',
          description: 'Skin care and dermatological conditions'
        });

      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe('Dermatology');
    });
  });

  describe('Doctor Directory & Profiles', () => {
    it('should list doctors with department info', async () => {
      const res = await request(app).get('/api/v1/doctors');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data[0].specialization).toBe('Cardiologist');
    });

    it('should retrieve a single doctor by ID', async () => {
      const res = await request(app).get(`/api/v1/doctors/${seededDoctorId}`);
      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(seededDoctorId);
      expect(res.body.data.firstName).toBe('Sarah');
    });
  });

  describe('Doctor Schedules & Available Slots Calculation', () => {
    it('should retrieve doctor weekly schedules', async () => {
      const res = await request(app).get(`/api/v1/doctors/${seededDoctorId}/schedules`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(5); // Mon-Fri
    });

    it('should compute 30-minute time slots for a scheduled weekday', async () => {
      // 2026-11-10 is a Tuesday (dayOfWeek: 2)
      const res = await request(app).get(`/api/v1/doctors/${seededDoctorId}/slots?date=2026-11-10`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(16); // 9:00 to 17:00 = 8 hours * 2 slots/hour = 16 slots
      expect(res.body.data[0].startTime).toBe('09:00');
      expect(res.body.data[0].endTime).toBe('09:30');
      expect(res.body.data[15].startTime).toBe('16:30');
      expect(res.body.data[15].endTime).toBe('17:00');
    });

    it('should return empty slots for an unscheduled weekend date', async () => {
      // 2026-11-15 is a Sunday (dayOfWeek: 0)
      const res = await request(app).get(`/api/v1/doctors/${seededDoctorId}/slots?date=2026-11-15`);
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(0);
    });
  });
});
