import { AppointmentStatus } from '@hospital/common';

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  appointmentDate: string; // YYYY-MM-DD
  startTime: string;       // HH:mm
  endTime: string;         // HH:mm
  status: AppointmentStatus;
  consultationFee: number;
  reason?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AppointmentHistoryRecord {
  id: string;
  appointmentId: string;
  previousStatus?: AppointmentStatus;
  newStatus: AppointmentStatus;
  changedBy: string;
  notes?: string;
  createdAt: Date;
}
