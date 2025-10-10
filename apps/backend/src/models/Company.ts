import mongoose, { Document, Schema } from 'mongoose';
import { PLAN_TYPES } from '../config/constants';

export interface ICompany extends Document {
  name: string;
  email: string;
  phone?: string;
  plan: string;
  apiKey: string;
  isActive: boolean;
  maxBots: number;
  settings: {
    timezone: string;
    language: string;
    notifications: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

const companySchema = new Schema<ICompany>(
  {
    name: {
      type: String,
      required: [true, 'El nombre de la empresa es requerido'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'El email es requerido'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    plan: {
      type: String,
      enum: Object.values(PLAN_TYPES),
      default: PLAN_TYPES.FREE,
    },
    apiKey: {
      type: String,
      unique: true,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    maxBots: {
      type: Number,
      default: 1,
    },
    settings: {
      timezone: {
        type: String,
        default: 'America/Lima',
      },
      language: {
        type: String,
        default: 'es',
      },
      notifications: {
        type: Boolean,
        default: true,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Índices
companySchema.index({ email: 1 });
companySchema.index({ apiKey: 1 });

export default mongoose.model<ICompany>('Company', companySchema);