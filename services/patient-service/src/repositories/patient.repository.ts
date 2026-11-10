import { Database } from '../database/db';
import { Patient, MedicalRecord } from '../models/patient.model';
import crypto from 'crypto';

export class PatientRepository {
  private static memoryPatients: Map<string, Patient> = new Map();
  private static memoryMedicalHistory: Map<string, MedicalRecord[]> = new Map();
  private static useMemory = false;

  public static setUseMemory(val: boolean): void {
    this.useMemory = val;
  }

  public static async create(data: Omit<Patient, 'id' | 'createdAt' | 'updatedAt'>): Promise<Patient> {
    const id = crypto.randomUUID();
    const now = new Date();

    const patient: Patient = {
      id,
      ...data,
      createdAt: now,
      updatedAt: now
    };

    this.memoryPatients.set(id, patient);

    if (!this.useMemory) {
      try {
        const res = await Database.query(
          `INSERT INTO patients (id, user_id, first_name, last_name, email, phone_number, date_of_birth, gender, blood_group, allergies, address, emergency_contact_name, emergency_contact_phone, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
           RETURNING id, user_id as "userId", first_name as "firstName", last_name as "lastName", email, phone_number as "phoneNumber", date_of_birth as "dateOfBirth", gender, blood_group as "bloodGroup", allergies, address, emergency_contact_name as "emergencyContactName", emergency_contact_phone as "emergencyContactPhone", created_at as "createdAt", updated_at as "updatedAt"`,
          [
            id,
            patient.userId,
            patient.firstName,
            patient.lastName,
            patient.email,
            patient.phoneNumber,
            patient.dateOfBirth,
            patient.gender,
            patient.bloodGroup || null,
            patient.allergies || null,
            patient.address || null,
            patient.emergencyContactName || null,
            patient.emergencyContactPhone || null,
            now,
            now
          ]
        );
        return res.rows[0];
      } catch {
        return patient;
      }
    }

    return patient;
  }

  public static async findById(id: string): Promise<Patient | null> {
    if (this.useMemory) {
      return this.memoryPatients.get(id) || null;
    }

    try {
      const res = await Database.query(
        `SELECT id, user_id as "userId", first_name as "firstName", last_name as "lastName", email, phone_number as "phoneNumber", date_of_birth as "dateOfBirth", gender, blood_group as "bloodGroup", allergies, address, emergency_contact_name as "emergencyContactName", emergency_contact_phone as "emergencyContactPhone", created_at as "createdAt", updated_at as "updatedAt"
         FROM patients WHERE id = $1`,
        [id]
      );
      if (res.rows.length === 0) return null;
      return res.rows[0];
    } catch {
      return this.memoryPatients.get(id) || null;
    }
  }

  public static async findByUserId(userId: string): Promise<Patient | null> {
    if (this.useMemory) {
      for (const p of this.memoryPatients.values()) {
        if (p.userId === userId) return p;
      }
      return null;
    }

    try {
      const res = await Database.query(
        `SELECT id, user_id as "userId", first_name as "firstName", last_name as "lastName", email, phone_number as "phoneNumber", date_of_birth as "dateOfBirth", gender, blood_group as "bloodGroup", allergies, address, emergency_contact_name as "emergencyContactName", emergency_contact_phone as "emergencyContactPhone", created_at as "createdAt", updated_at as "updatedAt"
         FROM patients WHERE user_id = $1`,
        [userId]
      );
      if (res.rows.length === 0) return null;
      return res.rows[0];
    } catch {
      for (const p of this.memoryPatients.values()) {
        if (p.userId === userId) return p;
      }
      return null;
    }
  }

  public static async update(id: string, data: Partial<Patient>): Promise<Patient | null> {
    const existing = await this.findById(id);
    if (!existing) return null;

    const updated: Patient = {
      ...existing,
      ...data,
      updatedAt: new Date()
    };

    this.memoryPatients.set(id, updated);

    if (!this.useMemory) {
      try {
        const res = await Database.query(
          `UPDATE patients
           SET first_name = $1, last_name = $2, phone_number = $3, date_of_birth = $4, gender = $5, blood_group = $6, allergies = $7, address = $8, emergency_contact_name = $9, emergency_contact_phone = $10, updated_at = $11
           WHERE id = $12
           RETURNING id, user_id as "userId", first_name as "firstName", last_name as "lastName", email, phone_number as "phoneNumber", date_of_birth as "dateOfBirth", gender, blood_group as "bloodGroup", allergies, address, emergency_contact_name as "emergencyContactName", emergency_contact_phone as "emergencyContactPhone", created_at as "createdAt", updated_at as "updatedAt"`,
          [
            updated.firstName,
            updated.lastName,
            updated.phoneNumber,
            updated.dateOfBirth,
            updated.gender,
            updated.bloodGroup,
            updated.allergies,
            updated.address,
            updated.emergencyContactName,
            updated.emergencyContactPhone,
            updated.updatedAt,
            id
          ]
        );
        return res.rows[0];
      } catch {
        return updated;
      }
    }

    return updated;
  }

  public static async listPatients(query: {
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ patients: Patient[]; total: number }> {
    const limit = query.limit || 20;
    const offset = query.offset || 0;
    const search = query.search?.toLowerCase().trim();

    if (this.useMemory) {
      let all = Array.from(this.memoryPatients.values());
      if (search) {
        all = all.filter(
          (p) =>
            p.firstName.toLowerCase().includes(search) ||
            p.lastName.toLowerCase().includes(search) ||
            p.email.toLowerCase().includes(search) ||
            p.phoneNumber.includes(search)
        );
      }
      const total = all.length;
      const paginated = all.slice(offset, offset + limit);
      return { patients: paginated, total };
    }

    try {
      let whereClause = '';
      const params: any[] = [];

      if (search) {
        whereClause = `WHERE LOWER(first_name) LIKE $1 OR LOWER(last_name) LIKE $1 OR LOWER(email) LIKE $1 OR phone_number LIKE $1`;
        params.push(`%${search}%`);
      }

      const countRes = await Database.query(
        `SELECT COUNT(*) FROM patients ${whereClause}`,
        params
      );
      const total = parseInt(countRes.rows[0].count, 10);

      params.push(limit);
      params.push(offset);
      const limitIdx = params.length - 1;
      const offsetIdx = params.length;

      const listRes = await Database.query(
        `SELECT id, user_id as "userId", first_name as "firstName", last_name as "lastName", email, phone_number as "phoneNumber", date_of_birth as "dateOfBirth", gender, blood_group as "bloodGroup", allergies, address, emergency_contact_name as "emergencyContactName", emergency_contact_phone as "emergencyContactPhone", created_at as "createdAt", updated_at as "updatedAt"
         FROM patients ${whereClause}
         ORDER BY created_at DESC
         LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
        params
      );

      return { patients: listRes.rows, total };
    } catch {
      let all = Array.from(this.memoryPatients.values());
      if (search) {
        all = all.filter(
          (p) =>
            p.firstName.toLowerCase().includes(search) ||
            p.lastName.toLowerCase().includes(search) ||
            p.email.toLowerCase().includes(search)
        );
      }
      return { patients: all.slice(offset, offset + limit), total: all.length };
    }
  }

  public static async addMedicalRecord(data: Omit<MedicalRecord, 'id' | 'createdAt'>): Promise<MedicalRecord> {
    const id = crypto.randomUUID();
    const now = new Date();
    const record: MedicalRecord = {
      id,
      ...data,
      createdAt: now
    };

    const records = this.memoryMedicalHistory.get(data.patientId) || [];
    records.push(record);
    this.memoryMedicalHistory.set(data.patientId, records);

    if (!this.useMemory) {
      try {
        const res = await Database.query(
          `INSERT INTO medical_history (id, patient_id, diagnosis, treatment, notes, diagnosed_date, doctor_id, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           RETURNING id, patient_id as "patientId", diagnosis, treatment, notes, diagnosed_date as "diagnosedDate", doctor_id as "doctorId", created_at as "createdAt"`,
          [
            id,
            record.patientId,
            record.diagnosis,
            record.treatment || null,
            record.notes || null,
            record.diagnosedDate,
            record.doctorId || null,
            now
          ]
        );
        return res.rows[0];
      } catch {
        return record;
      }
    }

    return record;
  }

  public static async getMedicalHistory(patientId: string): Promise<MedicalRecord[]> {
    if (this.useMemory) {
      return this.memoryMedicalHistory.get(patientId) || [];
    }

    try {
      const res = await Database.query(
        `SELECT id, patient_id as "patientId", diagnosis, treatment, notes, diagnosed_date as "diagnosedDate", doctor_id as "doctorId", created_at as "createdAt"
         FROM medical_history WHERE patient_id = $1 ORDER BY diagnosed_date DESC, created_at DESC`,
        [patientId]
      );
      return res.rows;
    } catch {
      return this.memoryMedicalHistory.get(patientId) || [];
    }
  }

  public static clearMemory(): void {
    this.memoryPatients.clear();
    this.memoryMedicalHistory.clear();
  }
}
