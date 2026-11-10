import { AppointmentStatus } from '../types/appointment';
import { InvoiceStatus, PaymentMethod } from '../types/billing';
import { UserRole } from '../types/roles';

export const HOSPITAL_EXCHANGE = 'hospital.events';
export const HOSPITAL_DLX_EXCHANGE = 'hospital.events.dlx';

export const EventTopics = {
  USER_REGISTERED: 'auth.user.registered',
  APPOINTMENT_CREATED: 'appointment.created',
  APPOINTMENT_RESCHEDULED: 'appointment.rescheduled',
  APPOINTMENT_STATUS_UPDATED: 'appointment.status.updated',
  APPOINTMENT_CANCELLED: 'appointment.cancelled',
  INVOICE_GENERATED: 'billing.invoice.generated',
  PAYMENT_COMPLETED: 'billing.payment.completed',
  NOTIFICATION_DISPATCH: 'notification.dispatch'
} as const;

export interface BaseEvent<T = any> {
  eventId: string;
  topic: string;
  timestamp: string;
  data: T;
}

export interface UserRegisteredEventPayload {
  userId: string;
  email: string;
  role: UserRole;
  firstName: string;
  lastName: string;
}

export interface AppointmentCreatedEventPayload {
  appointmentId: string;
  patientId: string;
  doctorId: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  consultationFee: number;
  reason?: string;
  patientEmail?: string;
  patientName?: string;
  doctorName?: string;
}

export interface AppointmentStatusUpdatedEventPayload {
  appointmentId: string;
  patientId: string;
  doctorId: string;
  previousStatus: AppointmentStatus;
  newStatus: AppointmentStatus;
  updatedBy: string;
  notes?: string;
}

export interface AppointmentCancelledEventPayload {
  appointmentId: string;
  patientId: string;
  doctorId: string;
  cancellationReason: string;
  cancelledBy: string;
}

export interface InvoiceGeneratedEventPayload {
  invoiceId: string;
  appointmentId: string;
  patientId: string;
  totalAmount: number;
  status: InvoiceStatus;
  dueDate: string;
}

export interface PaymentCompletedEventPayload {
  paymentId: string;
  invoiceId: string;
  appointmentId: string;
  patientId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  transactionRef: string;
  paidAt: string;
}

export interface NotificationDispatchEventPayload {
  recipientEmail: string;
  recipientName: string;
  notificationType: 'APPOINTMENT_CONFIRMED' | 'APPOINTMENT_CANCELLED' | 'INVOICE_READY' | 'PAYMENT_RECEIPT' | 'REMINDER';
  subject: string;
  body: string;
  metadata?: Record<string, any>;
}
