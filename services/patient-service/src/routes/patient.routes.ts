import { Router } from 'express';
import { z } from 'zod';
import { PatientController } from '../controllers/patient.controller';
import {
  authenticateToken,
  requireRoles,
  validateRequest,
  UserRole
} from '@hospital/common';

const router = Router();

const createPatientSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phoneNumber: z.string().min(5, 'Valid phone number is required'),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date of birth must be YYYY-MM-DD'),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
  bloodGroup: z.string().optional(),
  allergies: z.string().optional(),
  address: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional()
});

const updatePatientSchema = createPatientSchema.partial();

const medicalRecordSchema = z.object({
  diagnosis: z.string().min(1, 'Diagnosis is required'),
  treatment: z.string().optional(),
  notes: z.string().optional(),
  diagnosedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD').optional()
});

// Authenticated Routes
router.use(authenticateToken);

// Patient Self Profile Routes
router.get('/me', PatientController.getMyProfile);
router.put('/me', validateRequest({ body: updatePatientSchema }), PatientController.updateMyProfile);

// Patient Directory (Admin, Receptionist, Doctor)
router.get(
  '/',
  requireRoles(
    UserRole.SUPER_ADMIN,
    UserRole.HOSPITAL_ADMIN,
    UserRole.RECEPTIONIST,
    UserRole.DOCTOR
  ),
  PatientController.listPatients
);

// Patient Creation by Staff
router.post(
  '/',
  requireRoles(
    UserRole.SUPER_ADMIN,
    UserRole.HOSPITAL_ADMIN,
    UserRole.RECEPTIONIST
  ),
  validateRequest({ body: createPatientSchema }),
  PatientController.createPatient
);

// Single Patient Details
router.get(
  '/:id',
  requireRoles(
    UserRole.SUPER_ADMIN,
    UserRole.HOSPITAL_ADMIN,
    UserRole.RECEPTIONIST,
    UserRole.DOCTOR,
    UserRole.PATIENT
  ),
  PatientController.getPatientById
);

// Medical Records
router.get(
  '/:id/medical-history',
  requireRoles(
    UserRole.SUPER_ADMIN,
    UserRole.HOSPITAL_ADMIN,
    UserRole.DOCTOR,
    UserRole.PATIENT
  ),
  PatientController.getMedicalHistory
);

router.post(
  '/:id/medical-history',
  requireRoles(
    UserRole.SUPER_ADMIN,
    UserRole.HOSPITAL_ADMIN,
    UserRole.DOCTOR
  ),
  validateRequest({ body: medicalRecordSchema }),
  PatientController.addMedicalRecord
);

export default router;
