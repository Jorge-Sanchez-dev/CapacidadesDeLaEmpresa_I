import { Schema, model, Types, Document } from "mongoose";

export interface ICard extends Document {
  owner: Types.ObjectId;       
  account?: Types.ObjectId;  

  alias: string; 
  cardType: "DEBIT" | "CREDIT";
  brand: "VISA" | "MASTERCARD";

  numberLast4: string;     
  expiryMonth: number;      
  expiryYear: number;  
  cvv: string;      
  status: "active" | "blocked" | "expired";

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
