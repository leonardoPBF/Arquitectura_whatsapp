import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  number: string;
  name?: string;
  lastMessage?: string;
  createdAt: Date;
}

const userSchema = new Schema<IUser>({
  number: { type: String, required: true, unique: true },
  name: { type: String },
  lastMessage: { type: String },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<IUser>("User", userSchema);
