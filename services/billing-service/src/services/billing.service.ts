import { BillingRepository } from '../repositories/billing.repository';
import { Invoice, Payment, Refund } from '../models/billing.model';
import {
  InvoiceStatus,
  PaymentMethod,
  NotFoundError,
  BadRequestError,
  ConflictError,
  EventBus,
  EventTopics,
  InvoiceGeneratedEventPayload,
  PaymentCompletedEventPayload
} from '@hospital/common';

export class BillingService {
  public static async createInvoice(data: {
    appointmentId: string;
    patientId: string;
    totalAmount: number;
    dueDate?: string;
  }): Promise<Invoice> {
    const existing = await BillingRepository.findInvoiceByAppointmentId(data.appointmentId);
    if (existing) {
      return existing;
    }

    const invoice = await BillingRepository.createInvoice(data);

    // Publish event: billing.invoice.generated
    const eventBus = EventBus.getInstance();
    const eventPayload: InvoiceGeneratedEventPayload = {
      invoiceId: invoice.id,
      appointmentId: invoice.appointmentId,
      patientId: invoice.patientId,
      totalAmount: invoice.totalAmount,
      status: invoice.status,
      dueDate: invoice.dueDate
    };
    await eventBus.publish(EventTopics.INVOICE_GENERATED, eventPayload);

    return invoice;
  }

  public static async getInvoiceById(id: string): Promise<Invoice> {
    const invoice = await BillingRepository.findInvoiceById(id);
    if (!invoice) {
      throw new NotFoundError(`Invoice with ID ${id} not found`);
    }
    return invoice;
  }

  public static async listInvoices(query: { patientId?: string; status?: InvoiceStatus }): Promise<Invoice[]> {
    return BillingRepository.listInvoices(query);
  }

  /**
   * Process a simulated/mock payment for an invoice.
   */
  public static async processPayment(data: {
    invoiceId: string;
    patientId: string;
    amount: number;
    paymentMethod: PaymentMethod;
  }): Promise<{ invoice: Invoice; payment: Payment }> {
    const invoice = await this.getInvoiceById(data.invoiceId);

    if (invoice.status === InvoiceStatus.PAID) {
      throw new ConflictError('This invoice has already been fully paid');
    }
    if (invoice.status === InvoiceStatus.CANCELLED) {
      throw new BadRequestError('Cannot pay a cancelled invoice');
    }

    // Mock payment gateway transaction token
    const transactionRef = `TXN-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const payment = await BillingRepository.createPayment({
      invoiceId: invoice.id,
      patientId: data.patientId,
      amount: data.amount,
      paymentMethod: data.paymentMethod,
      transactionRef
    });

    const updatedInvoice = await BillingRepository.updateInvoiceStatus(invoice.id, InvoiceStatus.PAID);

    // Publish event: billing.payment.completed
    const eventBus = EventBus.getInstance();
    const eventPayload: PaymentCompletedEventPayload = {
      paymentId: payment.id,
      invoiceId: invoice.id,
      appointmentId: invoice.appointmentId,
      patientId: invoice.patientId,
      amount: payment.amount,
      paymentMethod: payment.paymentMethod,
      transactionRef: payment.transactionRef,
      paidAt: payment.createdAt.toISOString()
    };
    await eventBus.publish(EventTopics.PAYMENT_COMPLETED, eventPayload);

    return {
      invoice: updatedInvoice!,
      payment
    };
  }

  /**
   * Process a refund for a previously paid invoice.
   */
  public static async processRefund(data: {
    paymentId: string;
    reason: string;
  }): Promise<Refund> {
    const payment = await BillingRepository.findPaymentById(data.paymentId);
    if (!payment) {
      throw new NotFoundError(`Payment record ${data.paymentId} not found`);
    }
    if (payment.status === 'REFUNDED') {
      throw new ConflictError('This payment has already been refunded');
    }

    const refund = await BillingRepository.createRefund({
      paymentId: payment.id,
      invoiceId: payment.invoiceId,
      amount: payment.amount,
      reason: data.reason
    });

    await BillingRepository.updateInvoiceStatus(payment.invoiceId, InvoiceStatus.REFUNDED);

    return refund;
  }

  public static async cancelInvoice(appointmentId: string): Promise<void> {
    const invoice = await BillingRepository.findInvoiceByAppointmentId(appointmentId);
    if (invoice && invoice.status === InvoiceStatus.PENDING) {
      await BillingRepository.updateInvoiceStatus(invoice.id, InvoiceStatus.CANCELLED);
    }
  }

  public static async getRevenueAnalytics() {
    return BillingRepository.getRevenueAnalytics();
  }
}
