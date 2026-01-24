import { Router } from "express";
import { verifyToken } from "../middleware/verifyToken";
import { requireAdmin } from "../middleware/requireAdmin";
import { adminDashboard, adminListUsers, adminUpdateUser, adminUserSummary} from "../controllers/adminController";
import { adminListLoanRequests, adminApproveLoan, adminRejectLoan } 
from "../controllers/adminLoanController";


const router = Router();

router.use(verifyToken, requireAdmin);

router.get("/users", adminListUsers);
router.get("/users/:id/summary", adminUserSummary);

router.get("/dashboard", adminDashboard);

router.put("/users/:id", adminUpdateUser);
router.patch("/users/:id", adminUpdateUser);

router.get("/loans", adminListLoanRequests); 
router.post("/loans/:id/approve", adminApproveLoan);
router.post("/loans/:id/reject", adminRejectLoan);


export default router;
