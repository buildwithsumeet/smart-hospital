import { NotificationModel, INotification, NotificationType } from '../models/notification.model';
import crypto from 'crypto';

export interface NotificationRecord {
  id: string;
  recipientEmail: string;
  recipientName: string;
  notificationType: NotificationType;
  subject: string;
  body: string;
  channel: 'EMAIL' | 'IN_APP' | 'SMS';
  status: 'PENDING' | 'SENT' | 'FAILED';
  metadata: Record<string, any>;
  createdAt: Date;
}

export class NotificationRepository {
  private static memoryNotifications: Map<string, NotificationRecord> = new Map();
  private static useMemory = false;

  public static setUseMemory(val: boolean): void {
    this.useMemory = val;
  }

  public static async create(data: Omit<NotificationRecord, 'id' | 'createdAt'>): Promise<NotificationRecord> {
    const id = crypto.randomUUID();
    const now = new Date();
    const record: NotificationRecord = {
      id,
      ...data,
      createdAt: now
    };
    this.memoryNotifications.set(id, record);

    if (!this.useMemory) {
      try {
        const doc = await NotificationModel.create({
          recipientEmail: data.recipientEmail,
          recipientName: data.recipientName,
          notificationType: data.notificationType,
          subject: data.subject,
          body: data.body,
          channel: data.channel,
          status: data.status,
          metadata: data.metadata,
          createdAt: now
        });
        return {
          id: doc._id.toString(),
          recipientEmail: doc.recipientEmail,
          recipientName: doc.recipientName,
          notificationType: doc.notificationType,
          subject: doc.subject,
          body: doc.body,
          channel: doc.channel,
          status: doc.status,
          metadata: doc.metadata,
          createdAt: doc.createdAt
        };
      } catch {
        return record;
      }
    }

    return record;
  }

  public static async findById(id: string): Promise<NotificationRecord | null> {
    if (this.useMemory) {
      return this.memoryNotifications.get(id) || null;
    }

    try {
      const doc = await NotificationModel.findById(id);
      if (!doc) return null;
      return {
        id: doc._id.toString(),
        recipientEmail: doc.recipientEmail,
        recipientName: doc.recipientName,
        notificationType: doc.notificationType,
        subject: doc.subject,
        body: doc.body,
        channel: doc.channel,
        status: doc.status,
        metadata: doc.metadata,
        createdAt: doc.createdAt
      };
    } catch {
      return this.memoryNotifications.get(id) || null;
    }
  }

  public static async listNotifications(query: {
    recipientEmail?: string;
    notificationType?: NotificationType;
  }): Promise<NotificationRecord[]> {
    if (this.useMemory) {
      let list = Array.from(this.memoryNotifications.values());
      if (query.recipientEmail) {
        list = list.filter((n) => n.recipientEmail.toLowerCase() === query.recipientEmail?.toLowerCase());
      }
      if (query.notificationType) {
        list = list.filter((n) => n.notificationType === query.notificationType);
      }
      return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    try {
      const filter: any = {};
      if (query.recipientEmail) filter.recipientEmail = query.recipientEmail.toLowerCase();
      if (query.notificationType) filter.notificationType = query.notificationType;

      const docs = await NotificationModel.find(filter).sort({ createdAt: -1 });
      return docs.map((doc: any) => ({
        id: doc._id.toString(),
        recipientEmail: doc.recipientEmail,
        recipientName: doc.recipientName,
        notificationType: doc.notificationType,
        subject: doc.subject,
        body: doc.body,
        channel: doc.channel,
        status: doc.status,
        metadata: doc.metadata,
        createdAt: doc.createdAt
      }));
    } catch {
      return Array.from(this.memoryNotifications.values());
    }
  }

  public static clearMemory(): void {
    this.memoryNotifications.clear();
  }
}
