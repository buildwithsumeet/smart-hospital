import { InvoiceStatus, PaymentMethod } from '@hospital/common';

export interface Invoice {
  id: string;
  appointmentId: string;
  patientId: string;
  totalAmount: number;
  status: InvoiceStatus;
  dueDate: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Payment {
  id: string;
  invoiceId: string;
  patientId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  transactionRef: string;
  status: 'SUCCESS' | 'FAILED' | 'REFUNDED';
  createdAt: Date;
}

export interface Refund {
  id: string;
  paymentId: string;
  invoiceId: string;
  amount: number;
  reason: string;
  refundRef: string;
  createdAt: Date;
}
