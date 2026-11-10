import { NotificationRepository, NotificationRecord } from '../repositories/notification.repository';
import { NotificationType } from '../models/notification.model';
import { createLogger, NotFoundError } from '@hospital/common';

const logger = createLogger('NotificationService:Dispatcher');

export class NotificationService {
  public static async dispatchNotification(data: {
    recipientEmail: string;
    recipientName: string;
    notificationType: NotificationType;
    subject: string;
    body: string;
    channel?: 'EMAIL' | 'IN_APP' | 'SMS';
    metadata?: Record<string, any>;
  }): Promise<NotificationRecord> {
    const channel = data.channel || 'EMAIL';

    // Simulate reliable Email Delivery
    logger.info(`[${channel} DISPATCH] To: ${data.recipientEmail} (${data.recipientName}) | Subject: "${data.subject}"`);
    logger.debug(`[${channel} CONTENT]: ${data.body}`);

    const record = await NotificationRepository.create({
      recipientEmail: data.recipientEmail,
      recipientName: data.recipientName,
      notificationType: data.notificationType,
      subject: data.subject,
      body: data.body,
      channel,
      status: 'SENT',
      metadata: data.metadata || {}
    });

    return record;
  }

  public static async getNotificationById(id: string): Promise<NotificationRecord> {
    const record = await NotificationRepository.findById(id);
    if (!record) {
      throw new NotFoundError(`Notification with ID ${id} not found`);
    }
    return record;
  }

  public static async listNotifications(query: {
    recipientEmail?: string;
    notificationType?: NotificationType;
  }): Promise<NotificationRecord[]> {
    return NotificationRepository.listNotifications(query);
  }
}
