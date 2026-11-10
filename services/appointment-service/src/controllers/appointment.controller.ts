import { Request, Response, NextFunction } from 'express';
import { AppointmentService } from '../services/appointment.service';

export class AppointmentController {
  public static async bookAppointment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const patientId = req.user?.patientId || req.body.patientId;
      const appointment = await AppointmentService.bookAppointment({
        ...req.body,
        patientId
      });
      res.status(201).json({
        success: true,
        message: 'Appointment booked successfully',
        data: appointment
      });
    } catch (err) {
      next(err);
    }
  }

  public static async getAppointmentById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const appointment = await AppointmentService.getAppointmentById(req.params.id);
      res.status(200).json({ success: true, data: appointment });
    } catch (err) {
      next(err);
    }
  }

  public static async listAppointments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { patientId, doctorId, status, date } = req.query as any;
      const appointments = await AppointmentService.listAppointments({
        patientId,
        doctorId,
        status,
        date
      });
      res.status(200).json({ success: true, data: appointments });
    } catch (err) {
      next(err);
    }
  }

  public static async updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { status, notes } = req.body;
      const changedBy = `${req.user?.role}: ${req.user?.email || req.user?.userId}`;
      const appointment = await AppointmentService.updateStatus(req.params.id, status, changedBy, notes);
      res.status(200).json({
        success: true,
        message: 'Appointment status updated',
        data: appointment
      });
    } catch (err) {
      next(err);
    }
  }

  public static async cancelAppointment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { reason } = req.body;
      const cancelledBy = `${req.user?.role}: ${req.user?.email || req.user?.userId}`;
      const appointment = await AppointmentService.cancelAppointment(req.params.id, cancelledBy, reason || 'Patient requested');
      res.status(200).json({
        success: true,
        message: 'Appointment cancelled successfully',
        data: appointment
      });
    } catch (err) {
      next(err);
    }
  }

  public static async reschedule(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { newDate, newStartTime, newEndTime } = req.body;
      const appointment = await AppointmentService.reschedule(req.params.id, newDate, newStartTime, newEndTime);
      res.status(200).json({
        success: true,
        message: 'Appointment rescheduled successfully',
        data: appointment
      });
    } catch (err) {
      next(err);
    }
  }
}
