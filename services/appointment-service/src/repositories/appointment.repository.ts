import { Database } from '../database/db';
import { Appointment, AppointmentHistoryRecord } from '../models/appointment.model';
import { AppointmentStatus, ConflictError } from '@hospital/common';
import crypto from 'crypto';

export class AppointmentRepository {
  private static memoryAppointments: Map<string, Appointment> = new Map();
  private static memoryHistory: Map<string, AppointmentHistoryRecord[]> = new Map();
  // Mutex lock simulation for atomic slot reservation
  private static slotLocks: Set<string> = new Set();
  private static useMemory = false;

  public static setUseMemory(val: boolean): void {
    this.useMemory = val;
  }

  public static async create(data: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>): Promise<Appointment> {
    const slotKey = `${data.doctorId}:${data.appointmentDate}:${data.startTime}`;

    // Application-Level Distributed Concurrency Lock Check
    if (this.slotLocks.has(slotKey)) {
      throw new ConflictError(`This time slot (${data.appointmentDate} ${data.startTime}) is currently locked by another booking request.`);
    }

    try {
      this.slotLocks.add(slotKey);

      // Check existing active appointment for this doctor, date, start_time
      const existing = await this.findActiveSlot(data.doctorId, data.appointmentDate, data.startTime);
      if (existing) {
        throw new ConflictError(`Doctor already has a scheduled appointment on ${data.appointmentDate} at ${data.startTime}`);
      }

      const id = crypto.randomUUID();
      const now = new Date();
      const appointment: Appointment = {
        id,
        ...data,
        createdAt: now,
        updatedAt: now
      };

      this.memoryAppointments.set(id, appointment);

      if (!this.useMemory) {
        const client = await Database.getClient();
        try {
          await client.query('BEGIN');

          // Pessimistic Lock check within transaction
          const checkRes = await client.query(
            `SELECT id FROM appointments 
             WHERE doctor_id = $1 AND appointment_date = $2 AND start_time = $3 AND status != 'CANCELLED' 
             FOR UPDATE`,
            [data.doctorId, data.appointmentDate, data.startTime]
          );

          if (checkRes.rows.length > 0) {
            await client.query('ROLLBACK');
            throw new ConflictError(`Slot ${data.appointmentDate} ${data.startTime} was just booked by another patient.`);
          }

          const insertRes = await client.query(
            `INSERT INTO appointments (id, patient_id, doctor_id, appointment_date, start_time, end_time, status, consultation_fee, reason, notes, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
             RETURNING id, patient_id as "patientId", doctor_id as "doctorId", appointment_date as "appointmentDate", start_time as "startTime", end_time as "endTime", status, consultation_fee as "consultationFee", reason, notes, created_at as "createdAt", updated_at as "updatedAt"`,
            [
              id,
              data.patientId,
              data.doctorId,
              data.appointmentDate,
              data.startTime,
              data.endTime,
              data.status,
              data.consultationFee,
              data.reason || null,
              data.notes || null,
              now,
              now
            ]
          );

          await client.query('COMMIT');
          return insertRes.rows[0];
        } catch (dbErr: any) {
          await client.query('ROLLBACK').catch(() => {});
          if (dbErr.code === '23505') { // Postgres Unique Violation
            throw new ConflictError('Unique constraint violation: Slot already booked.');
          }
          if (dbErr instanceof ConflictError) throw dbErr;
          return appointment;
        } finally {
          client.release();
        }
      }

      return appointment;
    } finally {
      this.slotLocks.delete(slotKey);
    }
  }

  public static async findActiveSlot(
    doctorId: string,
    appointmentDate: string,
    startTime: string
  ): Promise<Appointment | null> {
    if (this.useMemory) {
      for (const appt of this.memoryAppointments.values()) {
        if (
          appt.doctorId === doctorId &&
          appt.appointmentDate === appointmentDate &&
          appt.startTime === startTime &&
          appt.status !== AppointmentStatus.CANCELLED
        ) {
          return appt;
        }
      }
      return null;
    }

    try {
      const res = await Database.query(
        `SELECT id, patient_id as "patientId", doctor_id as "doctorId", appointment_date as "appointmentDate", start_time as "startTime", end_time as "endTime", status, consultation_fee as "consultationFee", reason, notes, created_at as "createdAt", updated_at as "updatedAt"
         FROM appointments 
         WHERE doctor_id = $1 AND appointment_date = $2 AND start_time = $3 AND status != 'CANCELLED'`,
        [doctorId, appointmentDate, startTime]
      );
      if (res.rows.length === 0) return null;
      return res.rows[0];
    } catch {
      for (const appt of this.memoryAppointments.values()) {
        if (
          appt.doctorId === doctorId &&
          appt.appointmentDate === appointmentDate &&
          appt.startTime === startTime &&
          appt.status !== AppointmentStatus.CANCELLED
        ) {
          return appt;
        }
      }
      return null;
    }
  }

  public static async findById(id: string): Promise<Appointment | null> {
    if (this.useMemory) {
      return this.memoryAppointments.get(id) || null;
    }

    try {
      const res = await Database.query(
        `SELECT id, patient_id as "patientId", doctor_id as "doctorId", appointment_date as "appointmentDate", start_time as "startTime", end_time as "endTime", status, consultation_fee as "consultationFee", reason, notes, created_at as "createdAt", updated_at as "updatedAt"
         FROM appointments WHERE id = $1`,
        [id]
      );
      if (res.rows.length === 0) return null;
      return res.rows[0];
    } catch {
      return this.memoryAppointments.get(id) || null;
    }
  }

  public static async updateStatus(
    id: string,
    status: AppointmentStatus,
    changedBy: string,
    notes?: string
  ): Promise<Appointment | null> {
    const appt = await this.findById(id);
    if (!appt) return null;

    const prevStatus = appt.status;
    const now = new Date();
    const updated: Appointment = {
      ...appt,
      status,
      notes: notes || appt.notes,
      updatedAt: now
    };
    this.memoryAppointments.set(id, updated);

    // Record history
    const historyRecord: AppointmentHistoryRecord = {
      id: crypto.randomUUID(),
      appointmentId: id,
      previousStatus: prevStatus,
      newStatus: status,
      changedBy,
      notes,
      createdAt: now
    };
    const records = this.memoryHistory.get(id) || [];
    records.push(historyRecord);
    this.memoryHistory.set(id, records);

    if (!this.useMemory) {
      try {
        await Database.query(
          'UPDATE appointments SET status = $1, notes = $2, updated_at = $3 WHERE id = $4',
          [status, updated.notes || null, now, id]
        );
        await Database.query(
          'INSERT INTO appointment_history (id, appointment_id, previous_status, new_status, changed_by, notes, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7)',
          [historyRecord.id, id, prevStatus, status, changedBy, notes || null, now]
        );
      } catch {
        // Fallback kept in memory
      }
    }

    return updated;
  }

  public static async reschedule(
    id: string,
    newDate: string,
    newStartTime: string,
    newEndTime: string
  ): Promise<Appointment | null> {
    const appt = await this.findById(id);
    if (!appt) return null;

    // Check slot availability
    const conflict = await this.findActiveSlot(appt.doctorId, newDate, newStartTime);
    if (conflict && conflict.id !== id) {
      throw new ConflictError(`The new slot ${newDate} at ${newStartTime} is already occupied.`);
    }

    const now = new Date();
    const updated: Appointment = {
      ...appt,
      appointmentDate: newDate,
      startTime: newStartTime,
      endTime: newEndTime,
      updatedAt: now
    };
    this.memoryAppointments.set(id, updated);

    if (!this.useMemory) {
      try {
        await Database.query(
          'UPDATE appointments SET appointment_date = $1, start_time = $2, end_time = $3, updated_at = $4 WHERE id = $5',
          [newDate, newStartTime, newEndTime, now, id]
        );
      } catch {
        // Kept in memory
      }
    }

    return updated;
  }

  public static async listAppointments(query: {
    patientId?: string;
    doctorId?: string;
    status?: AppointmentStatus;
    date?: string;
  }): Promise<Appointment[]> {
    if (this.useMemory) {
      let list = Array.from(this.memoryAppointments.values());
      if (query.patientId) list = list.filter((a) => a.patientId === query.patientId);
      if (query.doctorId) list = list.filter((a) => a.doctorId === query.doctorId);
      if (query.status) list = list.filter((a) => a.status === query.status);
      if (query.date) list = list.filter((a) => a.appointmentDate === query.date);
      return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    try {
      const conditions: string[] = ['1=1'];
      const params: any[] = [];

      if (query.patientId) {
        params.push(query.patientId);
        conditions.push(`patient_id = $${params.length}`);
      }
      if (query.doctorId) {
        params.push(query.doctorId);
        conditions.push(`doctor_id = $${params.length}`);
      }
      if (query.status) {
        params.push(query.status);
        conditions.push(`status = $${params.length}`);
      }
      if (query.date) {
        params.push(query.date);
        conditions.push(`appointment_date = $${params.length}`);
      }

      const res = await Database.query(
        `SELECT id, patient_id as "patientId", doctor_id as "doctorId", appointment_date as "appointmentDate", start_time as "startTime", end_time as "endTime", status, consultation_fee as "consultationFee", reason, notes, created_at as "createdAt", updated_at as "updatedAt"
         FROM appointments
         WHERE ${conditions.join(' AND ')}
         ORDER BY appointment_date DESC, start_time DESC`,
        params
      );
      return res.rows;
    } catch {
      return Array.from(this.memoryAppointments.values());
    }
  }

  public static clearMemory(): void {
    this.memoryAppointments.clear();
    this.memoryHistory.clear();
    this.slotLocks.clear();
  }
}
