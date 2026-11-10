import { Request, Response, NextFunction } from 'express';
import { DoctorService } from '../services/doctor.service';

export class DoctorController {
  public static async listDepartments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const depts = await DoctorService.listDepartments();
      res.status(200).json({ success: true, data: depts });
    } catch (err) {
      next(err);
    }
  }

  public static async createDepartment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const dept = await DoctorService.createDepartment(req.body);
      res.status(201).json({ success: true, message: 'Department created', data: dept });
    } catch (err) {
      next(err);
    }
  }

  public static async listDoctors(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { departmentId, specialization, search } = req.query as any;
      const doctors = await DoctorService.listDoctors({ departmentId, specialization, search });
      res.status(200).json({ success: true, data: doctors });
    } catch (err) {
      next(err);
    }
  }

  public static async getDoctorById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const doctor = await DoctorService.getDoctorById(req.params.id);
      res.status(200).json({ success: true, data: doctor });
    } catch (err) {
      next(err);
    }
  }

  public static async createDoctor(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const doctor = await DoctorService.createDoctor(req.body);
      res.status(201).json({ success: true, message: 'Doctor profile created', data: doctor });
    } catch (err) {
      next(err);
    }
  }

  public static async updateDoctor(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const doctor = await DoctorService.updateDoctor(req.params.id, req.body);
      res.status(200).json({ success: true, message: 'Doctor profile updated', data: doctor });
    } catch (err) {
      next(err);
    }
  }

  public static async getSchedules(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schedules = await DoctorService.getSchedules(req.params.id);
      res.status(200).json({ success: true, data: schedules });
    } catch (err) {
      next(err);
    }
  }

  public static async setSchedules(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { schedules } = req.body;
      const result = await DoctorService.setSchedules(req.params.id, schedules);
      res.status(200).json({ success: true, message: 'Schedules updated', data: result });
    } catch (err) {
      next(err);
    }
  }

  public static async getAvailableSlots(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const dateStr = req.query.date as string;
      const slots = await DoctorService.getAvailableSlots(req.params.id, dateStr);
      res.status(200).json({ success: true, data: slots });
    } catch (err) {
      next(err);
    }
  }
}
