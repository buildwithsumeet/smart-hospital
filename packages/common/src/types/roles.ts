export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  HOSPITAL_ADMIN = 'HOSPITAL_ADMIN',
  DOCTOR = 'DOCTOR',
  RECEPTIONIST = 'RECEPTIONIST',
  PATIENT = 'PATIENT',
  ACCOUNTANT = 'ACCOUNTANT'
}

export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  [UserRole.SUPER_ADMIN]: ['*'],
  [UserRole.HOSPITAL_ADMIN]: [
    'users:read', 'users:write',
    'doctors:read', 'doctors:write',
    'patients:read', 'patients:write',
    'appointments:read', 'appointments:write',
    'billing:read',
    'analytics:read'
  ],
  [UserRole.DOCTOR]: [
    'doctor:self',
    'appointments:read', 'appointments:update_status',
    'patients:read_assigned',
    'analytics:personal'
  ],
  [UserRole.RECEPTIONIST]: [
    'patients:read', 'patients:create', 'patients:update',
    'appointments:read', 'appointments:create', 'appointments:checkin',
    'doctors:read_schedules'
  ],
  [UserRole.PATIENT]: [
    'patient:self',
    'doctors:read',
    'appointments:read_own', 'appointments:create_own', 'appointments:cancel_own',
    'billing:read_own', 'billing:pay_own'
  ],
  [UserRole.ACCOUNTANT]: [
    'billing:read', 'billing:write', 'billing:refund',
    'analytics:financial'
  ]
};
