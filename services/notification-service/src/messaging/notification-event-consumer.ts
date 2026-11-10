import {
  EventBus,
  EventTopics,
  AppointmentCreatedEventPayload,
  AppointmentCancelledEventPayload,
  InvoiceGeneratedEventPayload,
  PaymentCompletedEventPayload,
  NotificationDispatchEventPayload,
  createLogger
} from '@hospital/common';
import { NotificationService } from '../services/notification.service';

const logger = createLogger('NotificationService:Consumer');

export const registerNotificationEventConsumers = async (eventBus: EventBus): Promise<void> => {
  // 1. Appointment Created
  await eventBus.subscribe<AppointmentCreatedEventPayload>(
    'notification-service.appointment-created',
    EventTopics.APPOINTMENT_CREATED,
    async (event) => {
      const { data } = event;
      logger.info(`Received ${EventTopics.APPOINTMENT_CREATED} for appointment ${data.appointmentId}`);
      await NotificationService.dispatchNotification({
        recipientEmail: data.patientEmail || 'patient@hospital.com',
        recipientName: data.patientName || 'Valued Patient',
        notificationType: 'APPOINTMENT_CONFIRMED',
        subject: 'Hospital Appointment Confirmed',
        body: `Your appointment on ${data.appointmentDate} from ${data.startTime} to ${data.endTime} has been confirmed. Consultation Fee: $${data.consultationFee}.`,
        metadata: { appointmentId: data.appointmentId, doctorId: data.doctorId }
      });
    }
  );

  // 2. Appointment Cancelled
  await eventBus.subscribe<AppointmentCancelledEventPayload>(
    'notification-service.appointment-cancelled',
    EventTopics.APPOINTMENT_CANCELLED,
    async (event) => {
      const { data } = event;
      logger.info(`Received ${EventTopics.APPOINTMENT_CANCELLED} for appointment ${data.appointmentId}`);
      await NotificationService.dispatchNotification({
        recipientEmail: 'patient@hospital.com',
        recipientName: 'Valued Patient',
        notificationType: 'APPOINTMENT_CANCELLED',
        subject: 'Appointment Cancellation Notice',
        body: `Your appointment (${data.appointmentId}) has been cancelled. Reason: ${data.cancellationReason}.`,
        metadata: { appointmentId: data.appointmentId }
      });
    }
  );

  // 3. Invoice Generated
  await eventBus.subscribe<InvoiceGeneratedEventPayload>(
    'notification-service.invoice-generated',
    EventTopics.INVOICE_GENERATED,
    async (event) => {
      const { data } = event;
      logger.info(`Received ${EventTopics.INVOICE_GENERATED} for invoice ${data.invoiceId}`);
      await NotificationService.dispatchNotification({
        recipientEmail: 'patient@hospital.com',
        recipientName: 'Valued Patient',
        notificationType: 'INVOICE_READY',
        subject: 'New Hospital Invoice Ready',
        body: `An invoice for your consultation has been generated. Amount: $${data.totalAmount}. Due Date: ${data.dueDate}.`,
        metadata: { invoiceId: data.invoiceId, appointmentId: data.appointmentId }
      });
    }
  );

  // 4. Payment Completed
  await eventBus.subscribe<PaymentCompletedEventPayload>(
    'notification-service.payment-completed',
    EventTopics.PAYMENT_COMPLETED,
    async (event) => {
      const { data } = event;
      logger.info(`Received ${EventTopics.PAYMENT_COMPLETED} for invoice ${data.invoiceId}`);
      await NotificationService.dispatchNotification({
        recipientEmail: 'patient@hospital.com',
        recipientName: 'Valued Patient',
        notificationType: 'PAYMENT_RECEIPT',
        subject: 'Payment Receipt: Payment Confirmed',
        body: `We have received your payment of $${data.amount} via ${data.paymentMethod}. Transaction Ref: ${data.transactionRef}.`,
        metadata: { paymentId: data.paymentId, invoiceId: data.invoiceId }
      });
    }
  );

  // 5. Generic Notification Dispatch
  await eventBus.subscribe<NotificationDispatchEventPayload>(
    'notification-service.generic-dispatch',
    EventTopics.NOTIFICATION_DISPATCH,
    async (event) => {
      const { data } = event;
      await NotificationService.dispatchNotification({
        recipientEmail: data.recipientEmail,
        recipientName: data.recipientName,
        notificationType: data.notificationType,
        subject: data.subject,
        body: data.body,
        metadata: data.metadata
      });
    }
  );
};
