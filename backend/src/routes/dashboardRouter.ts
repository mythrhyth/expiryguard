import { Router } from "express";
import { DashboardController } from "../controllers/dashboardController";
import { authenticate } from "../middlewares/authMiddleware";

const router = Router();

router.use(authenticate);

router.get("/summary", DashboardController.getSummary);
router.get("/charts", DashboardController.getCharts);
router.get("/activity", DashboardController.getRecentActivity);

export default router;
