// index.ts
import express from "express";
import dotenv from "dotenv";
import path from "path";

import { connectMongoDB } from "./mongo";
import authRoutes from "./routes/auth";

dotenv.config();

console.log(">>> Entrando en index.ts");

const app = express();
app.use(express.json());

// servir frontend
app.use(express.static(path.join(process.cwd(), "public")));

// rutas API
app.use("/auth", authRoutes);

const PORT = process.env.PORT || 3000;

(async () => {
  try {
    console.log(">>> Llamando a connectMongoDB...");
    await connectMongoDB();
    console.log(">>> Mongo OK, levantando servidor...");

    app.listen(PORT, () => {
      console.log(`Servidor en http://localhost:${PORT}`);
    });

    app.get('/', (req, res) => {
  res.send('Servidor funcionando ✅');
});

  } catch (err) {
    console.error("Error al iniciar la app:", err);
  }
})();
