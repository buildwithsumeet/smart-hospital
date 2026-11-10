import request from 'supertest';
import app from '../src/app';
import { PatientRepository } from '../src/repositories/patient.repository';
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

describe('Patient Service - Integration & API Tests', () => {
  const patientUserId = 'patient-uuid-1234';
  const doctorUserId = 'doctor-uuid-5678';
  const receptionistUserId = 'rec-uuid-9999';

  const patientToken = createToken(patientUserId, UserRole.PATIENT);
  const doctorToken = createToken(doctorUserId, UserRole.DOCTOR);
  const receptionistToken = createToken(receptionistUserId, UserRole.RECEPTIONIST);

  let createdPatientId: string;

  beforeAll(async () => {
    PatientRepository.setUseMemory(true);
  });

  afterAll(async () => {
    PatientRepository.clearMemory();
  });

  describe('GET /health & /ready', () => {
    it('should return UP and READY', async () => {
      const resHealth = await request(app).get('/health');
      expect(resHealth.status).toBe(200);
      expect(resHealth.body.status).toBe('UP');

      const resReady = await request(app).get('/ready');
      expect(resReady.status).toBe(200);
      expect(resReady.body.status).toBe('READY');
    });
  });

  describe('POST /api/v1/patients (Create Profile)', () => {
    it('should create patient profile via Receptionist', async () => {
      const res = await request(app)
        .post('/api/v1/patients')
        .set('Authorization', `Bearer ${receptionistToken}`)
        .send({
          firstName: 'Robert',
          lastName: 'Smith',
          email: 'robert.smith@example.com',
          phoneNumber: '+1-555-0199',
          dateOfBirth: '1985-05-15',
          gender: 'MALE',
          bloodGroup: 'O+',
          allergies: 'Penicillin',
          address: '123 Pine St, Metropolis',
          emergencyContactName: 'Jane Smith',
          emergencyContactPhone: '+1-555-0198'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.firstName).toBe('Robert');
      createdPatientId = res.body.data.id;
    });

    it('should reject invalid input data (invalid date format)', async () => {
      const res = await request(app)
        .post('/api/v1/patients')
        .set('Authorization', `Bearer ${receptionistToken}`)
        .send({
          firstName: 'Bad',
          lastName: 'Data',
          email: 'bad@example.com',
          phoneNumber: '+1-555-0000',
          dateOfBirth: 'invalid-date',
          gender: 'MALE'
        });

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/patients (Directory & Search)', () => {
    it('should allow Receptionist to list patients', async () => {
      const res = await request(app)
        .get('/api/v1/patients?limit=10')
        .set('Authorization', `Bearer ${receptionistToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.pagination.total).toBeGreaterThanOrEqual(1);
    });

    it('should filter patients by search term', async () => {
      const res = await request(app)
        .get('/api/v1/patients?search=Robert')
        .set('Authorization', `Bearer ${receptionistToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].firstName).toBe('Robert');
    });
  });

  describe('Medical History', () => {
    it('should allow Doctor to add medical record to patient', async () => {
      const res = await request(app)
        .post(`/api/v1/patients/${createdPatientId}/medical-history`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({
          diagnosis: 'Type 2 Diabetes',
          treatment: 'Metformin 500mg daily, dietary controls',
          notes: 'Routine blood glucose follow up required in 3 months',
          diagnosedDate: '2026-11-01'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.diagnosis).toBe('Type 2 Diabetes');
    });

    it('should allow Patient to view their own medical history', async () => {
      const res = await request(app)
        .get(`/api/v1/patients/${createdPatientId}/medical-history`)
        .set('Authorization', `Bearer ${patientToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].diagnosis).toBe('Type 2 Diabetes');
    });
  });
});
