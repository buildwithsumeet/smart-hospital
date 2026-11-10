import { Database } from '../database/db';
import { Invoice, Payment, Refund } from '../models/billing.model';
import { InvoiceStatus, PaymentMethod } from '@hospital/common';
import crypto from 'crypto';

export class BillingRepository {
  private static memoryInvoices: Map<string, Invoice> = new Map();
  private static memoryPayments: Map<string, Payment> = new Map();
  private static memoryRefunds: Map<string, Refund> = new Map();
  private static useMemory = false;

  public static setUseMemory(val: boolean): void {
    this.useMemory = val;
  }

  public static async createInvoice(data: {
    appointmentId: string;
    patientId: string;
    totalAmount: number;
    dueDate?: string;
  }): Promise<Invoice> {
    const id = crypto.randomUUID();
    const now = new Date();
    const due = data.dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const invoice: Invoice = {
      id,
      appointmentId: data.appointmentId,
      patientId: data.patientId,
      totalAmount: data.totalAmount,
      status: InvoiceStatus.PENDING,
      dueDate: due,
      createdAt: now,
      updatedAt: now
    };

    this.memoryInvoices.set(id, invoice);

    if (!this.useMemory) {
      try {
        const res = await Database.query(
          `INSERT INTO invoices (id, appointment_id, patient_id, total_amount, status, due_date, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           RETURNING id, appointment_id as "appointmentId", patient_id as "patientId", total_amount as "totalAmount", status, due_date as "dueDate", created_at as "createdAt", updated_at as "updatedAt"`,
          [id, invoice.appointmentId, invoice.patientId, invoice.totalAmount, invoice.status, invoice.dueDate, now, now]
        );
        return res.rows[0];
      } catch {
        return invoice;
      }
    }

    return invoice;
  }

  public static async findInvoiceById(id: string): Promise<Invoice | null> {
    if (this.useMemory) {
      return this.memoryInvoices.get(id) || null;
    }

    try {
      const res = await Database.query(
        `SELECT id, appointment_id as "appointmentId", patient_id as "patientId", total_amount as "totalAmount", status, due_date as "dueDate", created_at as "createdAt", updated_at as "updatedAt"
         FROM invoices WHERE id = $1`,
        [id]
      );
      if (res.rows.length === 0) return null;
      return res.rows[0];
    } catch {
      return this.memoryInvoices.get(id) || null;
    }
  }

  public static async findInvoiceByAppointmentId(appointmentId: string): Promise<Invoice | null> {
    if (this.useMemory) {
      for (const inv of this.memoryInvoices.values()) {
        if (inv.appointmentId === appointmentId) return inv;
      }
      return null;
    }

    try {
      const res = await Database.query(
        `SELECT id, appointment_id as "appointmentId", patient_id as "patientId", total_amount as "totalAmount", status, due_date as "dueDate", created_at as "createdAt", updated_at as "updatedAt"
         FROM invoices WHERE appointment_id = $1`,
        [appointmentId]
      );
      if (res.rows.length === 0) return null;
      return res.rows[0];
    } catch {
      for (const inv of this.memoryInvoices.values()) {
        if (inv.appointmentId === appointmentId) return inv;
      }
      return null;
    }
  }

  public static async updateInvoiceStatus(id: string, status: InvoiceStatus): Promise<Invoice | null> {
    const inv = await this.findInvoiceById(id);
    if (!inv) return null;

    const now = new Date();
    const updated: Invoice = { ...inv, status, updatedAt: now };
    this.memoryInvoices.set(id, updated);

    if (!this.useMemory) {
      try {
        await Database.query('UPDATE invoices SET status = $1, updated_at = $2 WHERE id = $3', [status, now, id]);
      } catch {
        // Updated in memory
      }
    }
    return updated;
  }

  public static async createPayment(data: {
    invoiceId: string;
    patientId: string;
    amount: number;
    paymentMethod: PaymentMethod;
    transactionRef: string;
  }): Promise<Payment> {
    const id = crypto.randomUUID();
    const now = new Date();
    const payment: Payment = {
      id,
      invoiceId: data.invoiceId,
      patientId: data.patientId,
      amount: data.amount,
      paymentMethod: data.paymentMethod,
      transactionRef: data.transactionRef,
      status: 'SUCCESS',
      createdAt: now
    };

    this.memoryPayments.set(id, payment);

    if (!this.useMemory) {
      try {
        const res = await Database.query(
          `INSERT INTO payments (id, invoice_id, patient_id, amount, payment_method, transaction_ref, status, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           RETURNING id, invoice_id as "invoiceId", patient_id as "patientId", amount, payment_method as "paymentMethod", transaction_ref as "transactionRef", status, created_at as "createdAt"`,
          [id, payment.invoiceId, payment.patientId, payment.amount, payment.paymentMethod, payment.transactionRef, payment.status, now]
        );
        return res.rows[0];
      } catch {
        return payment;
      }
    }
    return payment;
  }

  public static async findPaymentById(id: string): Promise<Payment | null> {
    if (this.useMemory) {
      return this.memoryPayments.get(id) || null;
    }
    try {
      const res = await Database.query(
        `SELECT id, invoice_id as "invoiceId", patient_id as "patientId", amount, payment_method as "paymentMethod", transaction_ref as "transactionRef", status, created_at as "createdAt"
         FROM payments WHERE id = $1`,
        [id]
      );
      if (res.rows.length === 0) return null;
      return res.rows[0];
    } catch {
      return this.memoryPayments.get(id) || null;
    }
  }

  public static async createRefund(data: {
    paymentId: string;
    invoiceId: string;
    amount: number;
    reason: string;
  }): Promise<Refund> {
    const id = crypto.randomUUID();
    const refundRef = `REF-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const now = new Date();
    const refund: Refund = {
      id,
      paymentId: data.paymentId,
      invoiceId: data.invoiceId,
      amount: data.amount,
      reason: data.reason,
      refundRef,
      createdAt: now
    };
    this.memoryRefunds.set(id, refund);

    // Update payment status
    const payment = this.memoryPayments.get(data.paymentId);
    if (payment) payment.status = 'REFUNDED';

    if (!this.useMemory) {
      try {
        await Database.query(
          `INSERT INTO refunds (id, payment_id, invoice_id, amount, reason, refund_ref, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [id, refund.paymentId, refund.invoiceId, refund.amount, refund.reason, refund.refundRef, now]
        );
        await Database.query('UPDATE payments SET status = $1 WHERE id = $2', ['REFUNDED', data.paymentId]);
      } catch {
        // Handled in memory
      }
    }
    return refund;
  }

  public static async listInvoices(query: { patientId?: string; status?: InvoiceStatus }): Promise<Invoice[]> {
    if (this.useMemory) {
      let invs = Array.from(this.memoryInvoices.values());
      if (query.patientId) invs = invs.filter((i) => i.patientId === query.patientId);
      if (query.status) invs = invs.filter((i) => i.status === query.status);
      return invs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    try {
      const conditions: string[] = ['1=1'];
      const params: any[] = [];
      if (query.patientId) {
        params.push(query.patientId);
        conditions.push(`patient_id = $${params.length}`);
      }
      if (query.status) {
        params.push(query.status);
        conditions.push(`status = $${params.length}`);
      }
      const res = await Database.query(
        `SELECT id, appointment_id as "appointmentId", patient_id as "patientId", total_amount as "totalAmount", status, due_date as "dueDate", created_at as "createdAt", updated_at as "updatedAt"
         FROM invoices WHERE ${conditions.join(' AND ')} ORDER BY created_at DESC`,
        params
      );
      return res.rows;
    } catch {
      return Array.from(this.memoryInvoices.values());
    }
  }

  public static async getRevenueAnalytics(): Promise<{
    totalRevenue: number;
    paidInvoicesCount: number;
    pendingInvoicesCount: number;
    totalInvoicesCount: number;
  }> {
    if (this.useMemory) {
      const all = Array.from(this.memoryInvoices.values());
      const paid = all.filter((i) => i.status === InvoiceStatus.PAID);
      const pending = all.filter((i) => i.status === InvoiceStatus.PENDING);
      const totalRevenue = paid.reduce((sum, i) => sum + Number(i.totalAmount), 0);
      return {
        totalRevenue,
        paidInvoicesCount: paid.length,
        pendingInvoicesCount: pending.length,
        totalInvoicesCount: all.length
      };
    }

    try {
      const res = await Database.query(`
        SELECT 
          COALESCE(SUM(CASE WHEN status = 'PAID' THEN total_amount ELSE 0 END), 0) as "totalRevenue",
          COUNT(CASE WHEN status = 'PAID' THEN 1 END) as "paidInvoicesCount",
          COUNT(CASE WHEN status = 'PENDING' THEN 1 END) as "pendingInvoicesCount",
          COUNT(*) as "totalInvoicesCount"
        FROM invoices
      `);
      return {
        totalRevenue: parseFloat(res.rows[0].totalRevenue),
        paidInvoicesCount: parseInt(res.rows[0].paidInvoicesCount, 10),
        pendingInvoicesCount: parseInt(res.rows[0].pendingInvoicesCount, 10),
        totalInvoicesCount: parseInt(res.rows[0].totalInvoicesCount, 10)
      };
    } catch {
      const all = Array.from(this.memoryInvoices.values());
      const paid = all.filter((i) => i.status === InvoiceStatus.PAID);
      const totalRevenue = paid.reduce((sum, i) => sum + Number(i.totalAmount), 0);
      return {
        totalRevenue,
        paidInvoicesCount: paid.length,
        pendingInvoicesCount: all.length - paid.length,
        totalInvoicesCount: all.length
      };
    }
  }

  public static clearMemory(): void {
    this.memoryInvoices.clear();
    this.memoryPayments.clear();
    this.memoryRefunds.clear();
  }
}
