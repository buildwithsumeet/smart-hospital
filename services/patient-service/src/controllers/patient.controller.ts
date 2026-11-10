import { Request, Response, NextFunction } from 'express';
import { PatientService } from '../services/patient.service';

export class PatientController {
  public static async createPatient(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const patient = await PatientService.createPatient({
        ...req.body,
        userId: req.user!.userId
      });
      res.status(201).json({
        success: true,
        message: 'Patient profile created successfully',
        data: patient
      });
    } catch (err) {
      next(err);
    }
  }

  public static async getMyProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const patient = await PatientService.getPatientByUserId(req.user!.userId);
      res.status(200).json({
        success: true,
        data: patient
      });
    } catch (err) {
      next(err);
    }
  }

  public static async updateMyProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const current = await PatientService.getPatientByUserId(req.user!.userId);
      const updated = await PatientService.updatePatient(current.id, req.body);
      res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: updated
      });
    } catch (err) {
      next(err);
    }
  }

  public static async getPatientById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const patient = await PatientService.getPatientById(req.params.id);
      res.status(200).json({
        success: true,
        data: patient
      });
    } catch (err) {
      next(err);
    }
  }

  public static async listPatients(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const search = req.query.search as string | undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;

      const result = await PatientService.listPatients({ search, limit, offset });
      res.status(200).json({
        success: true,
        data: result.patients,
        pagination: {
          total: result.total,
          limit,
          offset
        }
      });
    } catch (err) {
      next(err);
    }
  }

  public static async addMedicalRecord(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const record = await PatientService.addMedicalRecord({
        patientId: req.params.id,
        diagnosis: req.body.diagnosis,
        treatment: req.body.treatment,
        notes: req.body.notes,
        diagnosedDate: req.body.diagnosedDate || new Date().toISOString().split('T')[0],
        doctorId: req.user?.doctorId
      });
      res.status(201).json({
        success: true,
        message: 'Medical record added successfully',
        data: record
      });
    } catch (err) {
      next(err);
    }
  }

  public static async getMedicalHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const history = await PatientService.getMedicalHistory(req.params.id);
      res.status(200).json({
        success: true,
        data: history
      });
    } catch (err) {
      next(err);
    }
  }
}
