import { Schema, model, Document } from 'mongoose';

export interface IPayment extends Document {
  orderId: Schema.Types.ObjectId;
  orderNumber: string;
  customerId: Schema.Types.ObjectId;
  amount: number;
  gateway: 'culqi';
  culqiOrderId?: string;
  attemptId?: string;
  attemptStartedAt?: Date;
  tokenFingerprint?: string;
  deviceId?: string;
  orderSynced?: boolean;
  checkoutUrl: string;
  method: 'card' | 'billetera_movil' | 'pagoefectivo';
  status: 'pending' | 'requires_action' | 'processing' | 'review' | 'completed' | 'failed' | 'refunded' | 'expired';
  transactionId?: string;
  receiptUrl?: string;
  gatewayResponse?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema({
  orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true },
  orderNumber: { type: String, required: true },
  customerId: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
  amount: { type: Number, required: true, min: 0 },
  gateway: { type: String, enum: ['culqi'], default: 'culqi', required: true },
  culqiOrderId: { type: String },
  attemptId: String,
  attemptStartedAt: Date,
  tokenFingerprint: String,
  deviceId: String,
  orderSynced: Boolean,
  checkoutUrl: { type: String, required: true },
  method: { 
    type: String, 
    enum: ['card', 'billetera_movil', 'pagoefectivo'],
    required: true
  },
  status: { 
    type: String, 
    enum: ['pending', 'requires_action', 'processing', 'review', 'completed', 'failed', 'refunded', 'expired'],
    default: 'pending'
  },
  transactionId: { type: String },
  receiptUrl: { type: String },
  gatewayResponse: { type: Object },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
}, { autoIndex: false });

PaymentSchema.index({ culqiOrderId: 1 }, { unique: true, partialFilterExpression: { culqiOrderId: { $type: 'string' } } });
export const Payment = model<IPayment>('Payment', PaymentSchema);

// The previous unique index allowed only ONE payment without a provider order.
export async function migratePaymentIndex() {
  const indexes = await Payment.collection.indexes().catch((error: { code?: number }) => {
    if (error.code === 26) return [];
    throw error;
  });
  const previous = indexes.find(index => index.name === 'culqiOrderId_1');
  if (previous && !previous.partialFilterExpression) await Payment.collection.dropIndex('culqiOrderId_1');
  await Payment.collection.createIndex({ culqiOrderId: 1 }, {
    unique: true, partialFilterExpression: { culqiOrderId: { $type: 'string' } },
  });
}
