import mongoose, { Document, Schema } from 'mongoose';

export interface IFlow extends Document {
  botId: mongoose.Types.ObjectId;
  companyId: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  triggers: Array<{
    type: 'keyword' | 'command' | 'default';
    value: string;
    caseSensitive: boolean;
  }>;
  nodes: Array<{
    id: string;
    type: 'message' | 'question' | 'condition' | 'action';
    content: string;
    options?: Array<{
      text: string;
      nextNodeId: string;
    }>;
    nextNodeId?: string;
  }>;
  isActive: boolean;
  priority: number;
  createdAt: Date;
  updatedAt: Date;
}

const flowSchema = new Schema<IFlow>(
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
    name: {
      type: String,
      required: [true, 'El nombre del flujo es requerido'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    triggers: [
      {
        type: {
          type: String,
          enum: ['keyword', 'command', 'default'],
          required: true,
        },
        value: {
          type: String,
          required: true,
        },
        caseSensitive: {
          type: Boolean,
          default: false,
        },
      },
    ],
    nodes: [
      {
        id: {
          type: String,
          required: true,
        },
        type: {
          type: String,
          enum: ['message', 'question', 'condition', 'action'],
          required: true,
        },
        content: {
          type: String,
          required: true,
        },
        options: [
          {
            text: String,
            nextNodeId: String,
          },
        ],
        nextNodeId: String,
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    priority: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Índices
flowSchema.index({ botId: 1, isActive: 1 });
flowSchema.index({ companyId: 1 });

export default mongoose.model<IFlow>('Flow', flowSchema);
