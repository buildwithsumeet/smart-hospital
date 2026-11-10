import { Router } from 'express';
import { z } from 'zod';
import { AppointmentController } from '../controllers/appointment.controller';
import {
  authenticateToken,
  requireRoles,
  validateRequest,
  UserRole,
  AppointmentStatus
} from '@hospital/common';

const router = Router();

const bookAppointmentSchema = z.object({
  patientId: z.string().min(1, 'Patient ID is required'),
  doctorId: z.string().min(1, 'Doctor ID is required'),
  appointmentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Start time must be HH:mm'),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'End time must be HH:mm'),
  consultationFee: z.number().nonnegative(),
  reason: z.string().optional(),
  notes: z.string().optional()
});

const updateStatusSchema = z.object({
  status: z.nativeEnum(AppointmentStatus),
  notes: z.string().optional()
});

const rescheduleSchema = z.object({
  newDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  newStartTime: z.string().regex(/^\d{2}:\d{2}$/, 'Start time must be HH:mm'),
  newEndTime: z.string().regex(/^\d{2}:\d{2}$/, 'End time must be HH:mm')
});

const cancelSchema = z.object({
  reason: z.string().min(1, 'Cancellation reason is required')
});

router.use(authenticateToken);

// List appointments with query filters
router.get('/', AppointmentController.listAppointments);

// Get single appointment
router.get('/:id', AppointmentController.getAppointmentById);

// Book appointment
router.post(
  '/',
  validateRequest({ body: bookAppointmentSchema }),
  AppointmentController.bookAppointment
);

// Update status (Doctor, Receptionist, Admin)
router.patch(
  '/:id/status',
  requireRoles(
    UserRole.SUPER_ADMIN,
    UserRole.HOSPITAL_ADMIN,
    UserRole.DOCTOR,
    UserRole.RECEPTIONIST
  ),
  validateRequest({ body: updateStatusSchema }),
  AppointmentController.updateStatus
);

// Reschedule appointment
router.patch(
  '/:id/reschedule',
  validateRequest({ body: rescheduleSchema }),
  AppointmentController.reschedule
);

// Cancel appointment
router.post(
  '/:id/cancel',
  validateRequest({ body: cancelSchema }),
  AppointmentController.cancelAppointment
);

export default router;
