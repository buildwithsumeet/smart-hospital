import {
  EventBus,
  EventTopics,
  AppointmentCreatedEventPayload,
  AppointmentCancelledEventPayload,
  createLogger
} from '@hospital/common';
import { BillingService } from '../services/billing.service';

const logger = createLogger('BillingService:Consumer');

export const registerBillingEventConsumers = async (eventBus: EventBus): Promise<void> => {
  // 1. Consume appointment.created -> Generate Invoice
  await eventBus.subscribe<AppointmentCreatedEventPayload>(
    'billing-service.appointment-created',
    EventTopics.APPOINTMENT_CREATED,
    async (event) => {
      const { data } = event;
      logger.info(`Received ${EventTopics.APPOINTMENT_CREATED} for appointment: ${data.appointmentId}`);
      try {
        await BillingService.createInvoice({
          appointmentId: data.appointmentId,
          patientId: data.patientId,
          totalAmount: data.consultationFee
        });
        logger.info(`Automatically created invoice for appointment: ${data.appointmentId}`);
      } catch (err: any) {
        logger.error(`Error processing appointment.created event in billing: ${err.message}`);
      }
    }
  );

  // 2. Consume appointment.cancelled -> Cancel Invoice
  await eventBus.subscribe<AppointmentCancelledEventPayload>(
    'billing-service.appointment-cancelled',
    EventTopics.APPOINTMENT_CANCELLED,
    async (event) => {
      const { data } = event;
      logger.info(`Received ${EventTopics.APPOINTMENT_CANCELLED} for appointment: ${data.appointmentId}`);
      try {
        await BillingService.cancelInvoice(data.appointmentId);
      } catch (err: any) {
        logger.error(`Error processing appointment.cancelled in billing: ${err.message}`);
      }
    }
  );
};
