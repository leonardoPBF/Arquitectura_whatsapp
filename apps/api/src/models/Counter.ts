import { Schema, model } from "mongoose";

const CounterSchema = new Schema({
  name: { type: String, required: true, unique: true },
  seq: { type: Number, default: 0 },
});

export const Counter = model("Counter", CounterSchema);