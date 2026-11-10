import { DoctorRepository } from '../repositories/doctor.repository';
import { Doctor, Department, DoctorSchedule } from '../models/doctor.model';
import { NotFoundError, AppointmentSlot } from '@hospital/common';

export class DoctorService {
  public static async createDepartment(data: { name: string; description?: string }): Promise<Department> {
    return DoctorRepository.createDepartment(data);
  }

  public static async listDepartments(): Promise<Department[]> {
    return DoctorRepository.listDepartments();
  }

  public static async createDoctor(data: Omit<Doctor, 'id' | 'createdAt' | 'updatedAt'>): Promise<Doctor> {
    return DoctorRepository.createDoctor(data);
  }

  public static async getDoctorById(id: string): Promise<Doctor> {
    const doctor = await DoctorRepository.findById(id);
    if (!doctor) {
      throw new NotFoundError(`Doctor with ID ${id} not found`);
    }
    return doctor;
  }

  public static async getDoctorByUserId(userId: string): Promise<Doctor> {
    const doctor = await DoctorRepository.findByUserId(userId);
    if (!doctor) {
      throw new NotFoundError(`Doctor profile for user ${userId} not found`);
    }
    return doctor;
  }

  public static async updateDoctor(id: string, data: Partial<Doctor>): Promise<Doctor> {
    const updated = await DoctorRepository.update(id, data);
    if (!updated) {
      throw new NotFoundError(`Doctor with ID ${id} not found`);
    }
    return updated;
  }

  public static async listDoctors(query: {
    departmentId?: string;
    specialization?: string;
    search?: string;
  }): Promise<Doctor[]> {
    return DoctorRepository.listDoctors(query);
  }

  public static async setSchedules(
    doctorId: string,
    schedules: Omit<DoctorSchedule, 'id' | 'createdAt'>[]
  ): Promise<DoctorSchedule[]> {
    await this.getDoctorById(doctorId);
    return DoctorRepository.setSchedules(doctorId, schedules);
  }

  public static async getSchedules(doctorId: string): Promise<DoctorSchedule[]> {
    await this.getDoctorById(doctorId);
    return DoctorRepository.getSchedules(doctorId);
  }

  /**
   * Generates discrete consultation time slots for a doctor on a specific date.
   */
  public static async getAvailableSlots(doctorId: string, dateStr: string): Promise<AppointmentSlot[]> {
    const doctor = await this.getDoctorById(doctorId);
    if (!doctor.isAvailable) {
      return [];
    }

    const date = new Date(dateStr);
    const dayOfWeek = date.getDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday

    const schedules = await DoctorRepository.getSchedules(doctorId);
    const daySchedule = schedules.find((s) => s.dayOfWeek === dayOfWeek && s.isActive);

    if (!daySchedule) {
      return [];
    }

    const slots: AppointmentSlot[] = [];
    const [startH, startM] = daySchedule.startTime.split(':').map(Number);
    const [endH, endM] = daySchedule.endTime.split(':').map(Number);
    const duration = daySchedule.slotDurationMinutes || 30;

    let currentMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    while (currentMinutes + duration <= endMinutes) {
      const slotStartH = Math.floor(currentMinutes / 60).toString().padStart(2, '0');
      const slotStartM = (currentMinutes % 60).toString().padStart(2, '0');

      const nextMinutes = currentMinutes + duration;
      const slotEndH = Math.floor(nextMinutes / 60).toString().padStart(2, '0');
      const slotEndM = (nextMinutes % 60).toString().padStart(2, '0');

      slots.push({
        startTime: `${slotStartH}:${slotStartM}`,
        endTime: `${slotEndH}:${slotEndM}`,
        isAvailable: true
      });

      currentMinutes = nextMinutes;
    }

    return slots;
  }
}
