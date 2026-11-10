import { Router } from 'express';
import { z } from 'zod';
import { AuthController } from '../controllers/auth.controller';
import {
  validateRequest,
  authenticateToken,
  requireRoles,
  UserRole
} from '@hospital/common';

const router = Router();

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  role: z.nativeEnum(UserRole).optional()
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required')
});

router.post(
  '/register',
  validateRequest({ body: registerSchema }),
  AuthController.register
);

router.post(
  '/login',
  validateRequest({ body: loginSchema }),
  AuthController.login
);

router.post(
  '/refresh',
  validateRequest({ body: refreshSchema }),
  AuthController.refresh
);

router.post('/logout', AuthController.logout);

router.get('/me', authenticateToken, AuthController.me);

router.get(
  '/users',
  authenticateToken,
  requireRoles(UserRole.SUPER_ADMIN, UserRole.HOSPITAL_ADMIN),
  AuthController.users
);

export default router;
