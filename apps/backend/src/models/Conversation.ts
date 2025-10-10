import mongoose, { Document, Schema } from 'mongoose';
import { CONVERSATION_STATUS } from '../config/constants';

export interface IConversation extends Document {
  botId: mongoose.Types.ObjectId;
  companyId: mongoose.Types.ObjectId;
  userId: string; // WhatsApp user ID
  userName: string;
  userPhone: string;
  status: string;
  lastMessage?: string;
  lastMessageAt?: Date;
  messagesCount: number;
  metadata?: {
    tags?: string[];
    notes?: string;
    assignedTo?: mongoose.Types.ObjectId;
  };
  createdAt: Date;
  updatedAt: Date;
}

const conversationSchema = new Schema<IConversation>(
  {
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
    userId: {
      type: String,
      required: true,
    },
    userName: {
      type: String,
      required: true,
    },
    userPhone: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(CONVERSATION_STATUS),
      default: CONVERSATION_STATUS.ACTIVE,
    },
    lastMessage: String,
    lastMessageAt: Date,
    messagesCount: {
      type: Number,
      default: 0,
    },
    metadata: {
      tags: [String],
      notes: String,
      assignedTo: {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    },
  },
  {
    timestamps: true,
  }
);

// Índices
conversationSchema.index({ botId: 1, userId: 1 }, { unique: true });
conversationSchema.index({ companyId: 1, status: 1 });
conversationSchema.index({ lastMessageAt: -1 });

export default mongoose.model<IConversation>('Conversation', conversationSchema);
