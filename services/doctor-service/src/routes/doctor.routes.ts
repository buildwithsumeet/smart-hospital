import { Router } from 'express';
import { z } from 'zod';
import { DoctorController } from '../controllers/doctor.controller';
import {
  authenticateToken,
  requireRoles,
  validateRequest,
  UserRole
} from '@hospital/common';

const router = Router();

const createDeptSchema = z.object({
  name: z.string().min(1, 'Department name is required'),
  description: z.string().optional()
});

const createDoctorSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  departmentId: z.string().optional(),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phoneNumber: z.string().min(5, 'Valid phone number is required'),
  specialization: z.string().min(1, 'Specialization is required'),
  qualification: z.string().min(1, 'Qualification is required'),
  experienceYears: z.number().nonnegative().default(0),
  consultationFee: z.number().nonnegative().default(50.0),
  bio: z.string().optional(),
  isAvailable: z.boolean().default(true)
});

const updateDoctorSchema = createDoctorSchema.partial();

const scheduleItemSchema = z.object({
  dayOfWeek: z.number().min(0).max(6),
  startTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Time format HH:mm or HH:mm:ss'),
  endTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Time format HH:mm or HH:mm:ss'),
  slotDurationMinutes: z.number().positive().default(30),
  isActive: z.boolean().default(true)
});

const setSchedulesSchema = z.object({
  schedules: z.array(scheduleItemSchema)
});

// Public / Authenticated read routes
router.get('/departments', DoctorController.listDepartments);
router.get('/', DoctorController.listDoctors);
router.get('/:id', DoctorController.getDoctorById);
router.get('/:id/slots', DoctorController.getAvailableSlots);
router.get('/:id/schedules', DoctorController.getSchedules);

// Admin-managed routes
router.post(
  '/departments',
  authenticateToken,
  requireRoles(UserRole.SUPER_ADMIN, UserRole.HOSPITAL_ADMIN),
  validateRequest({ body: createDeptSchema }),
  DoctorController.createDepartment
);

router.post(
  '/',
  authenticateToken,
  requireRoles(UserRole.SUPER_ADMIN, UserRole.HOSPITAL_ADMIN),
  validateRequest({ body: createDoctorSchema }),
  DoctorController.createDoctor
);

router.put(
  '/:id',
  authenticateToken,
  requireRoles(UserRole.SUPER_ADMIN, UserRole.HOSPITAL_ADMIN, UserRole.DOCTOR),
  validateRequest({ body: updateDoctorSchema }),
  DoctorController.updateDoctor
);

router.post(
  '/:id/schedules',
  authenticateToken,
  requireRoles(UserRole.SUPER_ADMIN, UserRole.HOSPITAL_ADMIN, UserRole.DOCTOR),
  validateRequest({ body: setSchedulesSchema }),
  DoctorController.setSchedules
);

export default router;
