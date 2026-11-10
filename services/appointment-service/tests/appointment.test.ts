import request from 'supertest';
import app from '../src/app';
import { AppointmentRepository } from '../src/repositories/appointment.repository';
import jwt from 'jsonwebtoken';
import { UserRole, AppointmentStatus } from '@hospital/common';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_change_in_production_12345';

const createToken = (userId: string, role: UserRole) => {
  return jwt.sign(
    { userId, email: `${role.toLowerCase()}@test.com`, role, firstName: 'Test', lastName: 'User' },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
};

describe('Appointment Service - Integration & Concurrency Tests', () => {
  const patientToken = createToken('patient-1', UserRole.PATIENT);
  const patient2Token = createToken('patient-2', UserRole.PATIENT);
  const doctorToken = createToken('doctor-1', UserRole.DOCTOR);
  const receptionistToken = createToken('receptionist-1', UserRole.RECEPTIONIST);

  const testDoctorId = 'doc-uuid-001';
  let bookedAppointmentId: string;

  beforeAll(async () => {
    AppointmentRepository.setUseMemory(true);
  });

  afterAll(async () => {
    AppointmentRepository.clearMemory();
  });

  describe('GET /health & /ready', () => {
    it('should return UP and READY', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('UP');
    });
  });

  describe('POST /api/v1/appointments (Single Booking)', () => {
    it('should book an appointment for an available slot', async () => {
      const res = await request(app)
        .post('/api/v1/appointments')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          patientId: 'patient-1',
          doctorId: testDoctorId,
          appointmentDate: '2026-11-20',
          startTime: '10:00',
          endTime: '10:30',
          consultationFee: 100.0,
          reason: 'General cardiology checkup'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.status).toBe(AppointmentStatus.PENDING);
      bookedAppointmentId = res.body.data.id;
    });

    it('should reject a duplicate booking for the same slot with 409 Conflict', async () => {
      const res = await request(app)
        .post('/api/v1/appointments')
        .set('Authorization', `Bearer ${patient2Token}`)
        .send({
          patientId: 'patient-2',
          doctorId: testDoctorId,
          appointmentDate: '2026-11-20',
          startTime: '10:00',
          endTime: '10:30',
          consultationFee: 100.0,
          reason: 'Another patient trying same slot'
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
    });
  });

  describe('CONCURRENCY TEST: Simultaneous Double-Booking Prevention', () => {
    it('should permit only 1 winner when multiple patients race for the exact same slot', async () => {
      const raceSlot = '11:00';
      const raceDate = '2026-11-21';

      // Launch 5 concurrent booking attempts simultaneously
      const attempts = [1, 2, 3, 4, 5].map((i) =>
        request(app)
          .post('/api/v1/appointments')
          .set('Authorization', `Bearer ${createToken(`race-patient-${i}`, UserRole.PATIENT)}`)
          .send({
            patientId: `race-patient-${i}`,
            doctorId: testDoctorId,
            appointmentDate: raceDate,
            startTime: raceSlot,
            endTime: '11:30',
            consultationFee: 100.0,
            reason: `Race condition test #${i}`
          })
      );

      const results = await Promise.all(attempts);

      const successCount = results.filter((r) => r.status === 201).length;
      const conflictCount = results.filter((r) => r.status === 409).length;

      // Exactly ONE must succeed, and all others must be 409 Conflict
      expect(successCount).toBe(1);
      expect(conflictCount).toBe(4);
    });
  });

  describe('PATCH /api/v1/appointments/:id/status (Lifecycle Transitions)', () => {
    it('should allow Receptionist to check in patient', async () => {
      const res = await request(app)
        .patch(`/api/v1/appointments/${bookedAppointmentId}/status`)
        .set('Authorization', `Bearer ${receptionistToken}`)
        .send({
          status: AppointmentStatus.CHECKED_IN,
          notes: 'Patient arrived at desk'
        });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe(AppointmentStatus.CHECKED_IN);
    });

    it('should allow Doctor to start consultation and complete appointment', async () => {
      // In Consultation
      const res1 = await request(app)
        .patch(`/api/v1/appointments/${bookedAppointmentId}/status`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({ status: AppointmentStatus.IN_CONSULTATION });
      expect(res1.status).toBe(200);
      expect(res1.body.data.status).toBe(AppointmentStatus.IN_CONSULTATION);

      // Completed
      const res2 = await request(app)
        .patch(`/api/v1/appointments/${bookedAppointmentId}/status`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({ status: AppointmentStatus.COMPLETED, notes: 'Prescribed medication' });
      expect(res2.status).toBe(200);
      expect(res2.body.data.status).toBe(AppointmentStatus.COMPLETED);
    });
  });

  describe('Appointment Rescheduling and Cancellation', () => {
    let secondApptId: string;

    beforeAll(async () => {
      const res = await request(app)
        .post('/api/v1/appointments')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          patientId: 'patient-1',
          doctorId: testDoctorId,
          appointmentDate: '2026-11-25',
          startTime: '14:00',
          endTime: '14:30',
          consultationFee: 100.0
        });
      secondApptId = res.body.data.id;
    });

    it('should successfully reschedule to an open slot', async () => {
      const res = await request(app)
        .patch(`/api/v1/appointments/${secondApptId}/reschedule`)
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          newDate: '2026-11-26',
          newStartTime: '15:00',
          newEndTime: '15:30'
        });

      expect(res.status).toBe(200);
      expect(res.body.data.appointmentDate).toBe('2026-11-26');
      expect(res.body.data.startTime).toBe('15:00');
    });

    it('should cancel appointment and release slot', async () => {
      const res = await request(app)
        .post(`/api/v1/appointments/${secondApptId}/cancel`)
        .set('Authorization', `Bearer ${patientToken}`)
        .send({ reason: 'Personal emergency' });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe(AppointmentStatus.CANCELLED);

      // Now booking that slot again should succeed because it was freed up!
      const rebookRes = await request(app)
        .post('/api/v1/appointments')
        .set('Authorization', `Bearer ${patient2Token}`)
        .send({
          patientId: 'patient-2',
          doctorId: testDoctorId,
          appointmentDate: '2026-11-26',
          startTime: '15:00',
          endTime: '15:30',
          consultationFee: 100.0
        });

      expect(rebookRes.status).toBe(201);
    });
  });
});
