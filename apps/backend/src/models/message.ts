import mongoose, { Document, Schema } from 'mongoose';
import { MESSAGE_TYPES, MESSAGE_DIRECTION } from '../config/constants';

export interface IMessage extends Document {
  conversationId: mongoose.Types.ObjectId;
  botId: mongoose.Types.ObjectId;
  companyId: mongoose.Types.ObjectId;
  content: string;
  type: string;
  direction: string;
  senderId: string;
  senderName: string;
  mediaUrl?: string;
  metadata?: {
    fileName?: string;
    fileSize?: number;
    mimeType?: string;
    duration?: number;
    latitude?: number;
    longitude?: number;
  };
  isRead: boolean;
  deliveredAt?: Date;
  readAt?: Date;
  createdAt: Date;
}

const messageSchema = new Schema<IMessage>(
  {
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
    },
    botId: {
      type: Schema.Types.ObjectId,
      ref: 'Bot',
      required: true,
    },
    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: Object.values(MESSAGE_TYPES),
      default: MESSAGE_TYPES.TEXT,
    },
    direction: {
      type: String,
      enum: Object.values(MESSAGE_DIRECTION),
      required: true,
    },
    senderId: {
      type: String,
      required: true,
    },
    senderName: {
      type: String,
      required: true,
    },
    mediaUrl: String,
    metadata: {
      fileName: String,
      fileSize: Number,
      mimeType: String,
      duration: Number,
      latitude: Number,
      longitude: Number,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    deliveredAt: Date,
    readAt: Date,
  },
  {
    timestamps: true,
  }
);

messageSchema.index({ conversationId: 1, createdAt: -1 });
messageSchema.index({ botId: 1, companyId: 1 });
messageSchema.index({ createdAt: -1 });

export default mongoose.model<IMessage>('Message', messageSchema);