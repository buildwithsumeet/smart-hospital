import { Router } from 'express';
import { z } from 'zod';
import { BillingController } from '../controllers/billing.controller';
import {
  authenticateToken,
  requireRoles,
  validateRequest,
  UserRole,
  PaymentMethod
} from '@hospital/common';

const router = Router();

const payInvoiceSchema = z.object({
  amount: z.number().positive(),
  paymentMethod: z.nativeEnum(PaymentMethod)
});

const refundSchema = z.object({
  reason: z.string().min(1, 'Refund reason is required')
});

router.use(authenticateToken);

// List invoices
router.get('/invoices', BillingController.listInvoices);

// Get single invoice
router.get('/invoices/:id', BillingController.getInvoiceById);

// Pay invoice (Mock payment gateway)
router.post(
  '/invoices/:id/pay',
  validateRequest({ body: payInvoiceSchema }),
  BillingController.processPayment
);

// Refund payment (Accountant / Admin only)
router.post(
  '/payments/:paymentId/refund',
  requireRoles(UserRole.SUPER_ADMIN, UserRole.HOSPITAL_ADMIN, UserRole.ACCOUNTANT),
  validateRequest({ body: refundSchema }),
  BillingController.processRefund
);

// Revenue analytics (Accountant / Admin only)
router.get(
  '/analytics/revenue',
  requireRoles(UserRole.SUPER_ADMIN, UserRole.HOSPITAL_ADMIN, UserRole.ACCOUNTANT),
  BillingController.getRevenueAnalytics
);

export default router;
