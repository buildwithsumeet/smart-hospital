export const NotificationMongoSchemaDefinition = {
  recipientEmail: { type: String, required: true, index: true },
  recipientName: { type: String, required: true },
  notificationType: {
    type: String,
    enum: ['APPOINTMENT_CONFIRMED', 'APPOINTMENT_CANCELLED', 'INVOICE_READY', 'PAYMENT_RECEIPT', 'REMINDER'],
    required: true
  },
  subject: { type: String, required: true },
  body: { type: String, required: true },
  channel: { type: String, enum: ['EMAIL', 'IN_APP', 'SMS'], default: 'EMAIL' },
  status: { type: String, enum: ['PENDING', 'SENT', 'FAILED'], default: 'SENT', index: true },
  metadata: { type: Object, default: {} },
  createdAt: { type: Date, default: Date.now, index: true }
};
