import { Router } from "express";
import { RecordsController } from "../controllers/recordsController";
import { authenticate, authorizeRoles } from "../middlewares/authMiddleware";
import { upload } from "../middlewares/uploadMiddleware";
import { Role } from "../types/enums";

const router = Router();

// Secure all records endpoints
router.use(authenticate);

router.get("/", RecordsController.getRecords);
router.get("/:id", RecordsController.getRecordById);

// Manager and Admin can create, edit and renew records
router.post(
  "/",
  authorizeRoles(Role.ADMIN, Role.MANAGER),
  upload.single("attachment"),
  RecordsController.createRecord
);

router.put(
  "/:id",
  authorizeRoles(Role.ADMIN, Role.MANAGER),
  upload.single("attachment"),
  RecordsController.updateRecord
);

router.post(
  "/:id/renew",
  authorizeRoles(Role.ADMIN, Role.MANAGER),
  RecordsController.renewRecord
);

// Only admin can delete records
router.delete(
  "/:id",
  authorizeRoles(Role.ADMIN),
  RecordsController.deleteRecord
);

export default router;
