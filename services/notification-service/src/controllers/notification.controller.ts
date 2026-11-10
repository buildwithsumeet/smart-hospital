import { Request, Response, NextFunction } from 'express';
import { NotificationService } from '../services/notification.service';

export class NotificationController {
  public static async listNotifications(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { recipientEmail, notificationType } = req.query as any;
      const email = req.user?.role === 'PATIENT' ? req.user.email : recipientEmail;
      const notifications = await NotificationService.listNotifications({
        recipientEmail: email,
        notificationType
      });
      res.status(200).json({ success: true, data: notifications });
    } catch (err) {
      next(err);
    }
  }

  public static async getNotificationById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const notification = await NotificationService.getNotificationById(req.params.id);
      res.status(200).json({ success: true, data: notification });
    } catch (err) {
      next(err);
    }
  }

  public static async sendNotification(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const notification = await NotificationService.dispatchNotification(req.body);
      res.status(201).json({
        success: true,
        message: 'Notification dispatched successfully',
        data: notification
      });
    } catch (err) {
      next(err);
    }
  }
}
