import { Router } from 'express';
import { z } from 'zod';
import { NotificationController } from '../controllers/notification.controller';
import {
  authenticateToken,
  requireRoles,
  validateRequest,
  UserRole
} from '@hospital/common';

const router = Router();

const sendNotificationSchema = z.object({
  recipientEmail: z.string().email(),
  recipientName: z.string().min(1),
  notificationType: z.enum([
    'APPOINTMENT_CONFIRMED',
    'APPOINTMENT_CANCELLED',
    'INVOICE_READY',
    'PAYMENT_RECEIPT',
    'REMINDER'
  ]),
  subject: z.string().min(1),
  body: z.string().min(1),
  channel: z.enum(['EMAIL', 'IN_APP', 'SMS']).optional(),
  metadata: z.record(z.any()).optional()
});

router.use(authenticateToken);

// List notifications
router.get('/', NotificationController.listNotifications);

// Get single notification
router.get('/:id', NotificationController.getNotificationById);

// Staff dispatch
router.post(
  '/send',
  requireRoles(
    UserRole.SUPER_ADMIN,
    UserRole.HOSPITAL_ADMIN,
    UserRole.RECEPTIONIST,
    UserRole.DOCTOR
  ),
  validateRequest({ body: sendNotificationSchema }),
  NotificationController.sendNotification
);

export default router;
