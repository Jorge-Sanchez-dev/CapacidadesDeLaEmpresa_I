//mongo.ts
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

export const connectMongoDB = async () => {
  console.log(">>> connectMongoDB llamado");
  try {
    const mongoUrl = "mongodb+srv://jsanchezl5:125343Jj@jorge-nebrija.jwrpu.mongodb.net/?appName=Jorge-Nebrija";

    console.log(">>> Intentando conectar a Mongo...");
    await mongoose.connect(mongoUrl);

    console.log("MongoDB conectado con Mongoose ✔");
  } catch (error) {
    console.error("Error conectando a MongoDB:", error);
  }
};
