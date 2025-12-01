// src/models/User.ts
import { Schema, model, Document } from "mongoose";

export interface IUser extends Document {
  // Datos básicos
  name: string;
  surname: string;
  birthDate: Date;
  dni: string;
  country: string;
  city: string;
  address: string;
  postalCode: string;

  // Contacto
  email: string;
  phone: string;

  // Auth
  password: string;        // aquí guardarás el hash, aunque se llame "password"

  // Configuración financiera
  mainCurrency: string;    // "EUR", "USD", etc.
  monthlySalary?: number;  // sueldo mensual para mostrar en el panel
  payrollDay?: number;     // día habitual de cobro (1–31)

  // Rol (por si luego haces admin)
  role: "USER" | "ADMIN";
}

const userSchema = new Schema<IUser>(
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

    // Configuración financiera
    mainCurrency: { type: String, required: true, default: "EUR" },
    monthlySalary: { type: Number },              // opcional
    payrollDay: { type: Number, min: 1, max: 31 },// opcional

    // Rol
    role: { type: String, enum: ["USER", "ADMIN"], default: "USER" },
  },
  {
    timestamps: true,
  }
);

export default model<IUser>("User", userSchema);
