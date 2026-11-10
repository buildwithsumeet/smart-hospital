import request from 'supertest';
import app from '../src/app';
import { BillingRepository } from '../src/repositories/billing.repository';
import { BillingService } from '../src/services/billing.service';
import jwt from 'jsonwebtoken';
import { UserRole, InvoiceStatus, PaymentMethod } from '@hospital/common';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_change_in_production_12345';

const createToken = (userId: string, role: UserRole) => {
  return jwt.sign(
    { userId, email: `${role.toLowerCase()}@test.com`, role, firstName: 'Test', lastName: 'User' },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
};

describe('Billing Service - Integration & Payment Workflow Tests', () => {
  const patientToken = createToken('patient-1', UserRole.PATIENT);
  const accountantToken = createToken('accountant-1', UserRole.ACCOUNTANT);

  let createdInvoiceId: string;
  let successfulPaymentId: string;

  beforeAll(async () => {
    BillingRepository.setUseMemory(true);
  });

  afterAll(async () => {
    BillingRepository.clearMemory();
  });

  describe('GET /health & /ready', () => {
    it('should return UP and READY', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('UP');
    });
  });

  describe('Invoice Lifecycle & Payment Processing', () => {
    it('should create an invoice for a booked appointment', async () => {
      const invoice = await BillingService.createInvoice({
        appointmentId: 'appt-uuid-999',
        patientId: 'patient-1',
        totalAmount: 150.0
      });

      expect(invoice.id).toBeDefined();
      expect(invoice.status).toBe(InvoiceStatus.PENDING);
      expect(invoice.totalAmount).toBe(150.0);
      createdInvoiceId = invoice.id;
    });

    it('should retrieve the invoice by ID', async () => {
      const res = await request(app)
        .get(`/api/v1/billing/invoices/${createdInvoiceId}`)
        .set('Authorization', `Bearer ${patientToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(createdInvoiceId);
      expect(res.body.data.totalAmount).toBe(150.0);
    });

    it('should successfully process mock payment with gateway reference', async () => {
      const res = await request(app)
        .post(`/api/v1/billing/invoices/${createdInvoiceId}/pay`)
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          amount: 150.0,
          paymentMethod: PaymentMethod.CREDIT_CARD
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.invoice.status).toBe(InvoiceStatus.PAID);
      expect(res.body.data.payment.transactionRef).toMatch(/^TXN-/);
      expect(res.body.data.payment.status).toBe('SUCCESS');
      successfulPaymentId = res.body.data.payment.id;
    });

    it('should reject paying an already paid invoice', async () => {
      const res = await request(app)
        .post(`/api/v1/billing/invoices/${createdInvoiceId}/pay`)
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          amount: 150.0,
          paymentMethod: PaymentMethod.CREDIT_CARD
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
    });
  });

  describe('Refund Simulation & Analytics', () => {
    it('should allow Accountant to process a refund', async () => {
      const res = await request(app)
        .post(`/api/v1/billing/payments/${successfulPaymentId}/refund`)
        .set('Authorization', `Bearer ${accountantToken}`)
        .send({ reason: 'Doctor had to reschedule emergency surgery' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.refundRef).toMatch(/^REF-/);
      expect(res.body.data.amount).toBe(150.0);
    });

    it('should generate revenue analytics for Accountant', async () => {
      const res = await request(app)
        .get('/api/v1/billing/analytics/revenue')
        .set('Authorization', `Bearer ${accountantToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.totalInvoicesCount).toBeGreaterThanOrEqual(1);
    });
  });
});
