import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UnauthorizedError, ForbiddenError } from '../errors/app-error';
import { AuthUserPayload } from '../types/user';
import { UserRole } from '../types/roles';

export const authenticateToken = (req: Request, res: Response, next: NextFunction): void => {
  // 1. Check for Gateway-Enriched Headers
  const gwUserId = req.headers['x-user-id'] as string;
  const gwUserRole = req.headers['x-user-role'] as UserRole;
  const gwUserEmail = req.headers['x-user-email'] as string;
  const gwPatientId = req.headers['x-patient-id'] as string | undefined;
  const gwDoctorId = req.headers['x-doctor-id'] as string | undefined;

  if (gwUserId && gwUserRole) {
    req.user = {
      userId: gwUserId,
      role: gwUserRole,
      email: gwUserEmail || '',
      patientId: gwPatientId,
      doctorId: gwDoctorId
    };
    return next();
  }

  // 2. Direct Bearer Token Verification
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new UnauthorizedError('Missing or malformed Authorization header'));
  }

  const token = authHeader.split(' ')[1];
  const jwtSecret = process.env.JWT_SECRET || 'super_secret_jwt_key_change_in_production_12345';

  try {
    const decoded = jwt.verify(token, jwtSecret) as AuthUserPayload;
    req.user = decoded;
    next();
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      return next(new UnauthorizedError('Authentication token has expired'));
    }
    return next(new UnauthorizedError('Invalid authentication token'));
  }
};

export const requireRoles = (...roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new UnauthorizedError('User authentication required'));
    }

    // SUPER_ADMIN has global bypass permissions
    if (req.user.role === UserRole.SUPER_ADMIN) {
      return next();
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new ForbiddenError(
          `Access forbidden: required one of [${roles.join(', ')}], but current role is ${req.user.role}`
        )
      );
    }

    next();
  };
};
