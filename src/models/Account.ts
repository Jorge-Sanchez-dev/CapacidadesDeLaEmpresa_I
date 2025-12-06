// src/models/Account.ts
import { Schema, model, Types, Document } from "mongoose";

export interface IAccount extends Document {
  owner: Types.ObjectId;
  iban: string;
  accountNumber: string;
  currency: string;
  balance: number;
  alias?: string;
  status: "active" | "blocked" | "closed";
  type: "NOMINA" | "AHORRO" | "CORRIENTE";
  isMain: boolean;
}


const accountSchema = new Schema<IAccount>(
  {
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    iban: { type: String, required: true, unique: true },
    accountNumber: { type: String, required: true, unique: true },

    currency: { type: String, required: true, default: "EUR" },
    balance: { type: Number, required: true, default: 0 },

    alias: { type: String },

    status: {
      type: String,
      enum: ["active", "blocked", "closed"],
      default: "active",
    },

    type: {
      type: String,
      enum: ["NOMINA", "AHORRO", "CORRIENTE"],
      default: "CORRIENTE",
    },

    isMain: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export default model<IAccount>("Account", accountSchema);
