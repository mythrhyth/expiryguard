import { Router } from "express";
import { ReportsController } from "../controllers/reportsController";
import { authenticate } from "../middlewares/authMiddleware";

const router = Router();

router.use(authenticate);

router.get("/export", ReportsController.exportReport);

export default router;
