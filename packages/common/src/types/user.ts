import { UserRole } from './roles';

export interface AuthUserPayload {
  userId: string;
  email: string;
  role: UserRole;
  firstName?: string;
  lastName?: string;
  patientId?: string;
  doctorId?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUserPayload;
      correlationId?: string;
    }
  }
}
