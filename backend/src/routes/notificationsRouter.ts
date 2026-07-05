import { Router } from "express";
import { NotificationsController } from "../controllers/notificationsController";
import { authenticate } from "../middlewares/authMiddleware";

const router = Router();

router.use(authenticate);

router.get("/", NotificationsController.getNotifications);
router.put("/read-all", NotificationsController.markAllAsRead);
router.put("/:id/read", NotificationsController.markAsRead);
router.delete("/:id", NotificationsController.deleteNotification);

export default router;
