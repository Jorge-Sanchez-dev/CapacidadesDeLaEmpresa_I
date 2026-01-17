import { Schema, model, Types, Document } from "mongoose";

export interface ICard extends Document {
  owner: Types.ObjectId;           // usuario dueño
  account?: Types.ObjectId;        // (opcional) cuenta asociada

  alias: string;                   // “Débito Pro”, “Joven”...
  cardType: "DEBIT" | "CREDIT";
  brand: "VISA" | "MASTERCARD";

  numberLast4: string;             // solo últimos 4
  expiryMonth: number;             // 1-12
  expiryYear: number;              // 2 dígitos (27, 29) o 4 (2027)
  cvv: string;                     // demo (en real NO lo guardarías así)
  status: "active" | "blocked" | "expired";
  
  // Para tu UI (“Sueldo/saldo: …”)
  // En débito puedes mostrar balance de account; en crédito un “available/limit”
  creditLimit?: number;
}

const cardSchema = new Schema<ICard>(
  {
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true },
    account: { type: Schema.Types.ObjectId, ref: "Account" },

    alias: { type: String, required: true },
    cardType: { type: String, enum: ["DEBIT", "CREDIT"], required: true },
    brand: { type: String, enum: ["VISA", "MASTERCARD"], required: true },

    numberLast4: { type: String, required: true, minlength: 4, maxlength: 4 },
    expiryMonth: { type: Number, required: true, min: 1, max: 12 },
    expiryYear: { type: Number, required: true },
    cvv: { type: String, required: true, minlength: 3, maxlength: 4 },

    status: { type: String, enum: ["active", "blocked", "expired"], default: "active" },

    creditLimit: { type: Number },
  },
  { timestamps: true }
);

export default model<ICard>("Card", cardSchema);
