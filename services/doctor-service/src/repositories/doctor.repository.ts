import { Database } from '../database/db';
import { Doctor, Department, DoctorSchedule } from '../models/doctor.model';
import crypto from 'crypto';

export class DoctorRepository {
  private static memoryDepartments: Map<string, Department> = new Map();
  private static memoryDoctors: Map<string, Doctor> = new Map();
  private static memorySchedules: Map<string, DoctorSchedule[]> = new Map();
  private static useMemory = false;

  public static setUseMemory(val: boolean): void {
    this.useMemory = val;
  }

  // Departments
  public static async createDepartment(data: { name: string; description?: string }): Promise<Department> {
    const id = crypto.randomUUID();
    const dept: Department = {
      id,
      name: data.name,
      description: data.description,
      isActive: true,
      createdAt: new Date()
    };
    this.memoryDepartments.set(id, dept);

    if (!this.useMemory) {
      try {
        const res = await Database.query(
          'INSERT INTO departments (id, name, description, is_active) VALUES ($1, $2, $3, $4) RETURNING id, name, description, is_active as "isActive", created_at as "createdAt"',
          [id, dept.name, dept.description || null, true]
        );
        return res.rows[0];
      } catch {
        return dept;
      }
    }
    return dept;
  }

  public static async listDepartments(): Promise<Department[]> {
    if (this.useMemory) {
      return Array.from(this.memoryDepartments.values());
    }
    try {
      const res = await Database.query(
        'SELECT id, name, description, is_active as "isActive", created_at as "createdAt" FROM departments WHERE is_active = TRUE ORDER BY name ASC'
      );
      return res.rows;
    } catch {
      return Array.from(this.memoryDepartments.values());
    }
  }

  // Doctors
  public static async createDoctor(data: Omit<Doctor, 'id' | 'createdAt' | 'updatedAt'>): Promise<Doctor> {
    const id = crypto.randomUUID();
    const now = new Date();
    const doctor: Doctor = {
      id,
      ...data,
      createdAt: now,
      updatedAt: now
    };
    this.memoryDoctors.set(id, doctor);

    if (!this.useMemory) {
      try {
        const res = await Database.query(
          `INSERT INTO doctors (id, user_id, department_id, first_name, last_name, email, phone_number, specialization, qualification, experience_years, consultation_fee, bio, is_available, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
           RETURNING id, user_id as "userId", department_id as "departmentId", first_name as "firstName", last_name as "lastName", email, phone_number as "phoneNumber", specialization, qualification, experience_years as "experienceYears", consultation_fee as "consultationFee", bio, is_available as "isAvailable", created_at as "createdAt", updated_at as "updatedAt"`,
          [
            id,
            doctor.userId,
            doctor.departmentId || null,
            doctor.firstName,
            doctor.lastName,
            doctor.email,
            doctor.phoneNumber,
            doctor.specialization,
            doctor.qualification,
            doctor.experienceYears,
            doctor.consultationFee,
            doctor.bio || null,
            doctor.isAvailable,
            now,
            now
          ]
        );
        return res.rows[0];
      } catch {
        return doctor;
      }
    }
    return doctor;
  }

  public static async findById(id: string): Promise<Doctor | null> {
    if (this.useMemory) {
      const doc = this.memoryDoctors.get(id);
      if (!doc) return null;
      const dept = doc.departmentId ? this.memoryDepartments.get(doc.departmentId) : undefined;
      return { ...doc, departmentName: dept?.name };
    }

    try {
      const res = await Database.query(
        `SELECT d.id, d.user_id as "userId", d.department_id as "departmentId", dep.name as "departmentName", d.first_name as "firstName", d.last_name as "lastName", d.email, d.phone_number as "phoneNumber", d.specialization, d.qualification, d.experience_years as "experienceYears", d.consultation_fee as "consultationFee", d.bio, d.is_available as "isAvailable", d.created_at as "createdAt", d.updated_at as "updatedAt"
         FROM doctors d
         LEFT JOIN departments dep ON d.department_id = dep.id
         WHERE d.id = $1`,
        [id]
      );
      if (res.rows.length === 0) return null;
      return res.rows[0];
    } catch {
      return this.memoryDoctors.get(id) || null;
    }
  }

  public static async findByUserId(userId: string): Promise<Doctor | null> {
    if (this.useMemory) {
      for (const d of this.memoryDoctors.values()) {
        if (d.userId === userId) return d;
      }
      return null;
    }

    try {
      const res = await Database.query(
        `SELECT d.id, d.user_id as "userId", d.department_id as "departmentId", dep.name as "departmentName", d.first_name as "firstName", d.last_name as "lastName", d.email, d.phone_number as "phoneNumber", d.specialization, d.qualification, d.experience_years as "experienceYears", d.consultation_fee as "consultationFee", d.bio, d.is_available as "isAvailable", d.created_at as "createdAt", d.updated_at as "updatedAt"
         FROM doctors d
         LEFT JOIN departments dep ON d.department_id = dep.id
         WHERE d.user_id = $1`,
        [userId]
      );
      if (res.rows.length === 0) return null;
      return res.rows[0];
    } catch {
      for (const d of this.memoryDoctors.values()) {
        if (d.userId === userId) return d;
      }
      return null;
    }
  }

  public static async update(id: string, data: Partial<Doctor>): Promise<Doctor | null> {
    const existing = await this.findById(id);
    if (!existing) return null;

    const updated: Doctor = {
      ...existing,
      ...data,
      updatedAt: new Date()
    };
    this.memoryDoctors.set(id, updated);

    if (!this.useMemory) {
      try {
        const res = await Database.query(
          `UPDATE doctors
           SET department_id = $1, first_name = $2, last_name = $3, phone_number = $4, specialization = $5, qualification = $6, experience_years = $7, consultation_fee = $8, bio = $9, is_available = $10, updated_at = $11
           WHERE id = $12
           RETURNING id, user_id as "userId", department_id as "departmentId", first_name as "firstName", last_name as "lastName", email, phone_number as "phoneNumber", specialization, qualification, experience_years as "experienceYears", consultation_fee as "consultationFee", bio, is_available as "isAvailable", created_at as "createdAt", updated_at as "updatedAt"`,
          [
            updated.departmentId || null,
            updated.firstName,
            updated.lastName,
            updated.phoneNumber,
            updated.specialization,
            updated.qualification,
            updated.experienceYears,
            updated.consultationFee,
            updated.bio || null,
            updated.isAvailable,
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

  public static async listDoctors(query: {
    departmentId?: string;
    specialization?: string;
    search?: string;
  }): Promise<Doctor[]> {
    if (this.useMemory) {
      let docs = Array.from(this.memoryDoctors.values());
      if (query.departmentId) {
        docs = docs.filter((d) => d.departmentId === query.departmentId);
      }
      if (query.specialization) {
        docs = docs.filter((d) => d.specialization.toLowerCase() === query.specialization?.toLowerCase());
      }
      if (query.search) {
        const s = query.search.toLowerCase();
        docs = docs.filter(
          (d) =>
            d.firstName.toLowerCase().includes(s) ||
            d.lastName.toLowerCase().includes(s) ||
            d.specialization.toLowerCase().includes(s)
        );
      }
      return docs;
    }

    try {
      const conditions: string[] = ['1=1'];
      const params: any[] = [];

      if (query.departmentId) {
        params.push(query.departmentId);
        conditions.push(`d.department_id = $${params.length}`);
      }
      if (query.specialization) {
        params.push(`%${query.specialization}%`);
        conditions.push(`d.specialization ILIKE $${params.length}`);
      }
      if (query.search) {
        params.push(`%${query.search}%`);
        conditions.push(`(d.first_name ILIKE $${params.length} OR d.last_name ILIKE $${params.length} OR d.specialization ILIKE $${params.length})`);
      }

      const res = await Database.query(
        `SELECT d.id, d.user_id as "userId", d.department_id as "departmentId", dep.name as "departmentName", d.first_name as "firstName", d.last_name as "lastName", d.email, d.phone_number as "phoneNumber", d.specialization, d.qualification, d.experience_years as "experienceYears", d.consultation_fee as "consultationFee", d.bio, d.is_available as "isAvailable", d.created_at as "createdAt", d.updated_at as "updatedAt"
         FROM doctors d
         LEFT JOIN departments dep ON d.department_id = dep.id
         WHERE ${conditions.join(' AND ')}
         ORDER BY d.first_name ASC`,
        params
      );
      return res.rows;
    } catch {
      return Array.from(this.memoryDoctors.values());
    }
  }

  // Schedules
  public static async setSchedules(doctorId: string, schedules: Omit<DoctorSchedule, 'id' | 'createdAt'>[]): Promise<DoctorSchedule[]> {
    const results: DoctorSchedule[] = [];
    const now = new Date();

    for (const item of schedules) {
      const sched: DoctorSchedule = {
        id: crypto.randomUUID(),
        ...item,
        createdAt: now
      };
      results.push(sched);
    }
    this.memorySchedules.set(doctorId, results);

    if (!this.useMemory) {
      try {
        await Database.query('DELETE FROM doctor_schedules WHERE doctor_id = $1', [doctorId]);
        for (const s of results) {
          await Database.query(
            `INSERT INTO doctor_schedules (id, doctor_id, day_of_week, start_time, end_time, slot_duration_minutes, is_active, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [s.id, doctorId, s.dayOfWeek, s.startTime, s.endTime, s.slotDurationMinutes, s.isActive, now]
          );
        }
      } catch {
        // Kept in memory
      }
    }
    return results;
  }

  public static async getSchedules(doctorId: string): Promise<DoctorSchedule[]> {
    if (this.useMemory) {
      return this.memorySchedules.get(doctorId) || [];
    }

    try {
      const res = await Database.query(
        `SELECT id, doctor_id as "doctorId", day_of_week as "dayOfWeek", start_time as "startTime", end_time as "endTime", slot_duration_minutes as "slotDurationMinutes", is_active as "isActive", created_at as "createdAt"
         FROM doctor_schedules WHERE doctor_id = $1 AND is_active = TRUE ORDER BY day_of_week ASC`,
        [doctorId]
      );
      return res.rows;
    } catch {
      return this.memorySchedules.get(doctorId) || [];
    }
  }

  public static clearMemory(): void {
    this.memoryDepartments.clear();
    this.memoryDoctors.clear();
    this.memorySchedules.clear();
  }
}
