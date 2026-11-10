import { UserRepository } from '../../repositories/user.repository';
import { PasswordService } from '../../services/password.service';
import { UserRole, createLogger } from '@hospital/common';

const logger = createLogger('AuthService:Seed');

export const seedDefaultUsers = async (): Promise<void> => {
  const defaultUsers = [
    {
      email: 'superadmin@hospital.com',
      password: 'Admin@12345',
      firstName: 'Super',
      lastName: 'Admin',
      role: UserRole.SUPER_ADMIN
    },
    {
      email: 'admin@hospital.com',
      password: 'Admin@12345',
      firstName: 'Hospital',
      lastName: 'Admin',
      role: UserRole.HOSPITAL_ADMIN
    },
    {
      email: 'doctor@hospital.com',
      password: 'Doctor@12345',
      firstName: 'Sarah',
      lastName: 'Jenkins',
      role: UserRole.DOCTOR
    },
    {
      email: 'receptionist@hospital.com',
      password: 'Staff@12345',
      firstName: 'Emily',
      lastName: 'Watson',
      role: UserRole.RECEPTIONIST
    },
    {
      email: 'patient@hospital.com',
      password: 'Patient@12345',
      firstName: 'John',
      lastName: 'Doe',
      role: UserRole.PATIENT
    },
    {
      email: 'accountant@hospital.com',
      password: 'Account@12345',
      firstName: 'Michael',
      lastName: 'Chang',
      role: UserRole.ACCOUNTANT
    }
  ];

  for (const user of defaultUsers) {
    const existing = await UserRepository.findByEmail(user.email);
    if (!existing) {
      const passwordHash = await PasswordService.hash(user.password);
      await UserRepository.create({
        email: user.email,
        passwordHash,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      });
      logger.info(`Seeded user: [${user.role}] ${user.email}`);
    }
  }
};
