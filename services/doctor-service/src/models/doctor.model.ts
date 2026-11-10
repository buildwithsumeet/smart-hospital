export interface Department {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
}

export interface Doctor {
  id: string;
  userId: string;
  departmentId?: string;
  departmentName?: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  specialization: string;
  qualification: string;
  experienceYears: number;
  consultationFee: number;
  bio?: string;
  isAvailable: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface DoctorSchedule {
  id: string;
  doctorId: string;
  dayOfWeek: number; // 0=Sunday, 1=Monday, ..., 6=Saturday
  startTime: string; // HH:mm:ss
  endTime: string;   // HH:mm:ss
  slotDurationMinutes: number;
  isActive: boolean;
  createdAt: Date;
}
