import { Schema, model, Types } from "mongoose";

const accountSchema = new Schema(
  {
    owner: { type: Types.ObjectId, ref: "User", required: true },

    iban: { type: String, required: true, unique: true },
    accountNumber: { type: String, required: true, unique: true },

    currency: { type: String, required: true, default: "EUR" }, // ya encaja con mainCurrency del user
    balance: { type: Number, required: true, default: 0 },

    alias: { type: String }, // "Cuenta nómina", "Ahorros", etc.

    status: {
      type: String,
      enum: ["active", "blocked", "closed"],
      default: "active",
    },
  },
  {
    timestamps: true,
  }
);

export default model("Account", accountSchema);
