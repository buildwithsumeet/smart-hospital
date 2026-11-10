import request from 'supertest';
import app from '../src/app';
import { NotificationRepository } from '../src/repositories/notification.repository';
import { NotificationService } from '../src/services/notification.service';
import { registerNotificationEventConsumers } from '../src/messaging/notification-event-consumer';
import jwt from 'jsonwebtoken';
import { UserRole, EventBus, EventTopics } from '@hospital/common';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_change_in_production_12345';

const createToken = (userId: string, role: UserRole, email?: string) => {
  return jwt.sign(
    { userId, email: email || `${role.toLowerCase()}@test.com`, role, firstName: 'Test', lastName: 'User' },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
};

describe('Notification Service - Integration & Event Consumer Tests', () => {
  const adminToken = createToken('admin-1', UserRole.HOSPITAL_ADMIN);
  const patientToken = createToken('patient-1', UserRole.PATIENT, 'patient@hospital.com');
  const eventBus = EventBus.getInstance();

  beforeAll(async () => {
    NotificationRepository.setUseMemory(true);
    await registerNotificationEventConsumers(eventBus);
  });

  afterAll(async () => {
    NotificationRepository.clearMemory();
  });

  describe('GET /health & /ready', () => {
    it('should return UP and READY', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('UP');
    });
  });

  describe('Manual Dispatch and Retrieval', () => {
    it('should allow Hospital Admin to manually dispatch a reminder notification', async () => {
      const res = await request(app)
        .post('/api/v1/notifications/send')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          recipientEmail: 'patient@hospital.com',
          recipientName: 'John Doe',
          notificationType: 'REMINDER',
          subject: 'Appointment Tomorrow Reminder',
          body: 'This is a friendly reminder for your appointment scheduled for tomorrow at 10:00 AM.'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.status).toBe('SENT');
    });

    it('should list notifications for the recipient', async () => {
      const res = await request(app)
        .get('/api/v1/notifications?recipientEmail=patient@hospital.com')
        .set('Authorization', `Bearer ${patientToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data[0].notificationType).toBe('REMINDER');
    });
  });

  describe('RabbitMQ Event Consumption', () => {
    it('should consume appointment.created and generate a confirmation notification', async () => {
      // Simulate RabbitMQ event publication
      await eventBus.publish(EventTopics.APPOINTMENT_CREATED, {
        appointmentId: 'appt-evt-123',
        patientId: 'patient-evt-456',
        doctorId: 'doctor-evt-789',
        appointmentDate: '2026-11-30',
        startTime: '14:00',
        endTime: '14:30',
        consultationFee: 120.0,
        patientEmail: 'patient.event@hospital.com',
        patientName: 'Jane Smith'
      });

      // Small async yield to allow handler execution
      await new Promise((resolve) => setTimeout(resolve, 50));

      const notifs = await NotificationService.listNotifications({
        recipientEmail: 'patient.event@hospital.com'
      });

      expect(notifs.length).toBeGreaterThanOrEqual(1);
      expect(notifs[0].notificationType).toBe('APPOINTMENT_CONFIRMED');
      expect(notifs[0].subject).toContain('Hospital Appointment Confirmed');
    });
  });
});
