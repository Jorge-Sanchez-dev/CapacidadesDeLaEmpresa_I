import { Router } from "express";
import { createBizum, listMyBizums } from "../controllers/bizumController";
import { verifyToken } from "../middleware/verifyToken";

const router = Router();

router.post("/", verifyToken, createBizum);
router.get("/", verifyToken, listMyBizums);

export default router;
