import { Router } from "express";
import { AIController } from "../controllers/aiController";
import { authenticate } from "../middlewares/authMiddleware";
import { upload } from "../middlewares/uploadMiddleware";

const router = Router();

// Protect AI endpoints
router.use(authenticate);

router.post("/extract-document", upload.single("file"), AIController.extractDocument);

export default router;
