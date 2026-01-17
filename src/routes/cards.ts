import { Router } from "express";
import { verifyToken } from "../middleware/verifyToken";
import { listMyCards, createCard, deleteCard } from "../controllers/cardController";

const router = Router();

router.get("/", verifyToken, listMyCards);
router.post("/", verifyToken, createCard);
router.delete("/:id", verifyToken, deleteCard);

export default router;
