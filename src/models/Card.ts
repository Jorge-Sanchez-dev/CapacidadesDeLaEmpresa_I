// src/models/Card.ts
import { Schema, model, Types, Document } from "mongoose";

export interface ICard extends Document {
  owner: Types.ObjectId;          // usuario dueño de la tarjeta
  account: Types.ObjectId;        // cuenta asociada (Account)

  cardNumber: string;             // encriptado o los últimos 4 dígitos
  last4: string;                  // "1234"
  brand: "VISA" | "MASTERCARD";   // tipo de tarjeta
  type: "DEBIT" | "CREDIT";       // débito o crédito

  expirationMonth: number;        // 1–12
  expirationYear: number;         // 2025, 2026…

  cvvHash: string;                // nunca guardes el CVV real

  status: "active" | "blocked" | "expired";

  creditLimit?: number;           // solo para crédito
  availableCredit?: number;       // opcional
}

const cardSchema = new Schema<ICard>(
  {
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    account: {
      type: Schema.Types.ObjectId,
      ref: "Account",
      required: true,
    },

    cardNumber: { type: String, required: true }, // normalmente encriptado
    last4: { type: String, required: true },      // visible en el panel
    brand: {
      type: String,
      enum: ["VISA", "MASTERCARD"],
      required: true,
    },
    type: {
      type: String,
      enum: ["DEBIT", "CREDIT"],
      required: true,
    },

    expirationMonth: { type: Number, required: true },
    expirationYear: { type: Number, required: true },

    cvvHash: { type: String, required: true }, // NO guardar el CVV real

    status: {
      type: String,
      enum: ["active", "blocked", "expired"],
      default: "active",
    },

    creditLimit: { type: Number },
    availableCredit: { type: Number },
  },
  { timestamps: true }
);

export default model<ICard>("Card", cardSchema);
