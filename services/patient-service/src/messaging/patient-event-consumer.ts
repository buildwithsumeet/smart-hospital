import { EventBus, EventTopics, UserRegisteredEventPayload, createLogger, UserRole } from '@hospital/common';
import { PatientRepository } from '../repositories/patient.repository';

const logger = createLogger('PatientService:Consumer');

export const registerPatientEventConsumers = async (eventBus: EventBus): Promise<void> => {
  await eventBus.subscribe<UserRegisteredEventPayload>(
    'patient-service.user-registered',
    EventTopics.USER_REGISTERED,
    async (event) => {
      const { data } = event;
      if (data.role === UserRole.PATIENT) {
        logger.info(`Received ${EventTopics.USER_REGISTERED} for patient: ${data.email}`);
        const existing = await PatientRepository.findByUserId(data.userId);
        if (!existing) {
          await PatientRepository.create({
            userId: data.userId,
            email: data.email,
            firstName: data.firstName,
            lastName: data.lastName,
            phoneNumber: '000-000-0000',
            dateOfBirth: '1990-01-01',
            gender: 'OTHER'
          });
          logger.info(`Automatically initialized patient profile stub for user: ${data.userId}`);
        }
      }
    }
  );
};
