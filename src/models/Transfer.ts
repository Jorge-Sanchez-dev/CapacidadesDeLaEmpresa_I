// src/models/Transfer.ts
import { Schema, model, Types, Document } from "mongoose";

export interface ITransfer extends Document {
  fromAccount: Types.ObjectId;
  toAccount?: Types.ObjectId;
  amount: number;
  currency: string;
  concept: string;
  date: Date;
  status: "pending" | "completed" | "failed";
  direction: "IN" | "OUT";
  counterpartName?: string;
  counterpartIban?: string;
}

const transferSchema = new Schema<ITransfer>(
  {
    fromAccount: {
      type: Schema.Types.ObjectId,   // 👈 CAMBIO AQUÍ
      ref: "Account",
      required: true,
    },
    toAccount: {
      type: Schema.Types.ObjectId,   // 👈 Y AQUÍ
      ref: "Account",
    },

    amount: { type: Number, required: true },
    currency: { type: String, required: true, default: "EUR" },

    concept: { type: String, required: true },
    date: { type: Date, default: Date.now },

    status: {
      type: String,
      enum: ["pending", "completed", "failed"],
      default: "completed",
    },

    direction: {
      type: String,
      enum: ["IN", "OUT"],
      required: true,
    },

    counterpartName: { type: String },
    counterpartIban: { type: String },
  },
  { timestamps: true }
);

export default model<ITransfer>("Transfer", transferSchema);
