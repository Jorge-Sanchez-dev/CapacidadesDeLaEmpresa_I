import { Schema, model } from "mongoose";

const userSchema = new Schema(
  {
    // Datos básicos
    name: { type: String, required: true },
    surname: { type: String, required: true },
    birthDate: { type: Date, required: true },
    dni: { type: String, required: true, unique: true },
    country: { type: String, required: true },
    city: { type: String, required: true },
    address: { type: String, required: true },
    postalCode: { type: String, required: true },

    // Contacto
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true },

    // Auth
    password: { type: String, required: true },

    // Moneda
    mainCurrency: { type: String, required: true }, // "EUR", "USD", etc.
  },
  {
    timestamps: true,
  }
);

export default model("User", userSchema);
