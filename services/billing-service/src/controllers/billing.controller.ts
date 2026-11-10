import { Request, Response, NextFunction } from 'express';
import { BillingService } from '../services/billing.service';

export class BillingController {
  public static async listInvoices(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { patientId, status } = req.query as any;
      const targetPatientId = req.user?.role === 'PATIENT' ? req.user.patientId : patientId;
      const invoices = await BillingService.listInvoices({ patientId: targetPatientId, status });
      res.status(200).json({ success: true, data: invoices });
    } catch (err) {
      next(err);
    }
  }

  public static async getInvoiceById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const invoice = await BillingService.getInvoiceById(req.params.id);
      res.status(200).json({ success: true, data: invoice });
    } catch (err) {
      next(err);
    }
  }

  public static async processPayment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await BillingService.processPayment({
        invoiceId: req.params.id,
        patientId: req.body.patientId || req.user?.patientId || 'patient-id',
        amount: req.body.amount,
        paymentMethod: req.body.paymentMethod
      });
      res.status(200).json({
        success: true,
        message: 'Payment processed successfully',
        data: result
      });
    } catch (err) {
      next(err);
    }
  }

  public static async processRefund(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const refund = await BillingService.processRefund({
        paymentId: req.params.paymentId,
        reason: req.body.reason
      });
      res.status(200).json({
        success: true,
        message: 'Refund simulation completed successfully',
        data: refund
      });
    } catch (err) {
      next(err);
    }
  }

  public static async getRevenueAnalytics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await BillingService.getRevenueAnalytics();
      res.status(200).json({ success: true, data: stats });
    } catch (err) {
      next(err);
    }
  }
}
