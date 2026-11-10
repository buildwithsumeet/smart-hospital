import { AppointmentRepository } from '../repositories/appointment.repository';
import { Appointment } from '../models/appointment.model';
import {
  AppointmentStatus,
  NotFoundError,
  BadRequestError,
  EventBus,
  EventTopics,
  AppointmentCreatedEventPayload,
  AppointmentCancelledEventPayload,
  AppointmentStatusUpdatedEventPayload
} from '@hospital/common';

export class AppointmentService {
  public static async bookAppointment(data: {
    patientId: string;
    doctorId: string;
    appointmentDate: string;
    startTime: string;
    endTime: string;
    consultationFee: number;
    reason?: string;
    notes?: string;
  }): Promise<Appointment> {
    const appointment = await AppointmentRepository.create({
      patientId: data.patientId,
      doctorId: data.doctorId,
      appointmentDate: data.appointmentDate,
      startTime: data.startTime,
      endTime: data.endTime,
      status: AppointmentStatus.PENDING,
      consultationFee: data.consultationFee,
      reason: data.reason,
      notes: data.notes
    });

    // Publish event: appointment.created
    const eventBus = EventBus.getInstance();
    const eventPayload: AppointmentCreatedEventPayload = {
      appointmentId: appointment.id,
      patientId: appointment.patientId,
      doctorId: appointment.doctorId,
      appointmentDate: appointment.appointmentDate,
      startTime: appointment.startTime,
      endTime: appointment.endTime,
      consultationFee: appointment.consultationFee,
      reason: appointment.reason
    };
    await eventBus.publish(EventTopics.APPOINTMENT_CREATED, eventPayload);

    return appointment;
  }

  public static async getAppointmentById(id: string): Promise<Appointment> {
    const appt = await AppointmentRepository.findById(id);
    if (!appt) {
      throw new NotFoundError(`Appointment with ID ${id} not found`);
    }
    return appt;
  }

  public static async updateStatus(
    id: string,
    newStatus: AppointmentStatus,
    changedBy: string,
    notes?: string
  ): Promise<Appointment> {
    const appt = await this.getAppointmentById(id);
    const prevStatus = appt.status;

    if (prevStatus === AppointmentStatus.CANCELLED) {
      throw new BadRequestError('Cannot update status of a cancelled appointment');
    }

    const updated = await AppointmentRepository.updateStatus(id, newStatus, changedBy, notes);
    if (!updated) {
      throw new NotFoundError(`Appointment with ID ${id} not found`);
    }

    // Publish event
    const eventBus = EventBus.getInstance();
    const eventPayload: AppointmentStatusUpdatedEventPayload = {
      appointmentId: updated.id,
      patientId: updated.patientId,
      doctorId: updated.doctorId,
      previousStatus: prevStatus,
      newStatus,
      updatedBy: changedBy,
      notes
    };
    await eventBus.publish(EventTopics.APPOINTMENT_STATUS_UPDATED, eventPayload);

    return updated;
  }

  public static async cancelAppointment(
    id: string,
    cancelledBy: string,
    reason: string
  ): Promise<Appointment> {
    const appt = await this.getAppointmentById(id);
    if (appt.status === AppointmentStatus.CANCELLED) {
      throw new BadRequestError('Appointment is already cancelled');
    }

    const updated = await AppointmentRepository.updateStatus(
      id,
      AppointmentStatus.CANCELLED,
      cancelledBy,
      `Cancelled: ${reason}`
    );

    if (!updated) {
      throw new NotFoundError(`Appointment with ID ${id} not found`);
    }

    // Publish event
    const eventBus = EventBus.getInstance();
    const eventPayload: AppointmentCancelledEventPayload = {
      appointmentId: updated.id,
      patientId: updated.patientId,
      doctorId: updated.doctorId,
      cancellationReason: reason,
      cancelledBy
    };
    await eventBus.publish(EventTopics.APPOINTMENT_CANCELLED, eventPayload);

    return updated;
  }

  public static async reschedule(
    id: string,
    newDate: string,
    newStartTime: string,
    newEndTime: string
  ): Promise<Appointment> {
    const appt = await this.getAppointmentById(id);
    if (appt.status === AppointmentStatus.CANCELLED) {
      throw new BadRequestError('Cannot reschedule a cancelled appointment');
    }

    const updated = await AppointmentRepository.reschedule(id, newDate, newStartTime, newEndTime);
    if (!updated) {
      throw new NotFoundError(`Appointment with ID ${id} not found`);
    }

    const eventBus = EventBus.getInstance();
    await eventBus.publish(EventTopics.APPOINTMENT_RESCHEDULED, {
      appointmentId: updated.id,
      newDate,
      newStartTime,
      newEndTime
    });

    return updated;
  }

  public static async listAppointments(query: {
    patientId?: string;
    doctorId?: string;
    status?: AppointmentStatus;
    date?: string;
  }): Promise<Appointment[]> {
    return AppointmentRepository.listAppointments(query);
  }
}
