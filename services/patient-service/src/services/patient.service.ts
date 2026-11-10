import { PatientRepository } from '../repositories/patient.repository';
import { Patient, MedicalRecord } from '../models/patient.model';
import { NotFoundError, ConflictError } from '@hospital/common';

export class PatientService {
  public static async createPatient(data: Omit<Patient, 'id' | 'createdAt' | 'updatedAt'>): Promise<Patient> {
    const existing = await PatientRepository.findByUserId(data.userId);
    if (existing) {
      throw new ConflictError('A patient profile for this user already exists');
    }
    return PatientRepository.create(data);
  }

  public static async getPatientById(id: string): Promise<Patient> {
    const patient = await PatientRepository.findById(id);
    if (!patient) {
      throw new NotFoundError(`Patient with ID ${id} not found`);
    }
    return patient;
  }

  public static async getPatientByUserId(userId: string): Promise<Patient> {
    const patient = await PatientRepository.findByUserId(userId);
    if (!patient) {
      throw new NotFoundError(`Patient profile for user ${userId} not found`);
    }
    return patient;
  }

  public static async updatePatient(id: string, data: Partial<Patient>): Promise<Patient> {
    const updated = await PatientRepository.update(id, data);
    if (!updated) {
      throw new NotFoundError(`Patient with ID ${id} not found`);
    }
    return updated;
  }

  public static async listPatients(query: {
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ patients: Patient[]; total: number }> {
    return PatientRepository.listPatients(query);
  }

  public static async addMedicalRecord(data: Omit<MedicalRecord, 'id' | 'createdAt'>): Promise<MedicalRecord> {
    // Validate patient exists
    await this.getPatientById(data.patientId);
    return PatientRepository.addMedicalRecord(data);
  }

  public static async getMedicalHistory(patientId: string): Promise<MedicalRecord[]> {
    // Validate patient exists
    await this.getPatientById(patientId);
    return PatientRepository.getMedicalHistory(patientId);
  }
}
