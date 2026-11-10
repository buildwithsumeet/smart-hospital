import { DoctorRepository } from '../../repositories/doctor.repository';
import { createLogger } from '@hospital/common';

const logger = createLogger('DoctorService:Seed');

export const seedDefaultDoctorsAndDepartments = async (): Promise<void> => {
  const depts = await DoctorRepository.listDepartments();
  let cardioDeptId: string | undefined;

  if (depts.length === 0) {
    const cardio = await DoctorRepository.createDepartment({
      name: 'Cardiology',
      description: 'Cardiac care, heart surgery and hypertension management'
    });
    cardioDeptId = cardio.id;

    await DoctorRepository.createDepartment({
      name: 'Neurology',
      description: 'Brain, nervous system, and neurodegenerative disorder specialists'
    });

    await DoctorRepository.createDepartment({
      name: 'Pediatrics',
      description: 'Comprehensive medical care for infants, children, and adolescents'
    });

    await DoctorRepository.createDepartment({
      name: 'Orthopedics',
      description: 'Bones, joints, ligaments, tendons, and spine surgery'
    });

    await DoctorRepository.createDepartment({
      name: 'General Medicine',
      description: 'Primary care, diagnostic assessments, and preventive health'
    });

    logger.info('Seeded default medical departments.');
  } else {
    cardioDeptId = depts[0].id;
  }

  const existingDoctors = await DoctorRepository.listDoctors({});
  if (existingDoctors.length === 0) {
    const doctor = await DoctorRepository.createDoctor({
      userId: 'doctor-user-seeded-id',
      departmentId: cardioDeptId,
      firstName: 'Sarah',
      lastName: 'Jenkins',
      email: 'doctor@hospital.com',
      phoneNumber: '+1-555-0144',
      specialization: 'Cardiologist',
      qualification: 'MD, FACC, Harvard Medical School',
      experienceYears: 12,
      consultationFee: 120.00,
      bio: 'Board-certified cardiologist specializing in preventive cardiac interventions.',
      isAvailable: true
    });

    // Seed Mon-Fri schedules
    const schedules = [1, 2, 3, 4, 5].map((dayOfWeek) => ({
      doctorId: doctor.id,
      dayOfWeek,
      startTime: '09:00:00',
      endTime: '17:00:00',
      slotDurationMinutes: 30,
      isActive: true
    }));

    await DoctorRepository.setSchedules(doctor.id, schedules);
    logger.info(`Seeded doctor [${doctor.firstName} ${doctor.lastName}] with weekly schedules.`);
  }
};
