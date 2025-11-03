import { Router } from "express";
import { getDb } from "./mongo";
import { ObjectId } from "mongodb";

const router = Router();
const coleccion = () => getDb().collection("Banco");

router.get("/", async (req, res) => {
  try {
    const personas = await coleccion().find().toArray(); 
    res.json(personas);
  } catch (err) {
    res.status(404).json(err);
  }
});

export default router;