import mongoose, { Document, Schema } from 'mongoose';
import { BOT_STATUS } from '../config/constants';

export interface IBot extends Document {
  companyId: mongoose.Types.ObjectId;
  name: string;
  phoneNumber: string;
  status: string;
  qrCode?: string;
  sessionData?: any;
  config: {
    welcomeMessage?: string;
    autoReply: boolean;
    workingHours?: {
      enabled: boolean;
      schedule: Array<{
        day: string;
        start: string;
        end: string;
      }>;
    };
    maxConversations?: number;
  };
  isActive: boolean;
  lastSeen?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const botSchema = new Schema<IBot>(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
    },
    name: {
      type: String,
      required: [true, 'El nombre del bot es requerido'],
      trim: true,
    },
    phoneNumber: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: Object.values(BOT_STATUS),
      default: BOT_STATUS.INACTIVE,
    },
    qrCode: {
      type: String,
    },
    sessionData: {
      type: Schema.Types.Mixed,
    },
    config: {
      welcomeMessage: {
        type: String,
        default: '¡Hola! ¿En qué puedo ayudarte?',
      },
      autoReply: {
        type: Boolean,
        default: true,
      },
      workingHours: {
        enabled: {
          type: Boolean,
          default: false,
        },
        schedule: [
          {
            day: String,
            start: String,
            end: String,
          },
        ],
      },
      maxConversations: {
        type: Number,
        default: 100,
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastSeen: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Índices
botSchema.index({ companyId: 1, isActive: 1 });
botSchema.index({ phoneNumber: 1 }, { unique: true, sparse: true });

export default mongoose.model<IBot>('Bot', botSchema);