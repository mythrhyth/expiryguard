import { Router } from "express";
import { DepartmentsController } from "../controllers/departmentsController";
import { authenticate, authorizeRoles } from "../middlewares/authMiddleware";
import { Role } from "../types/enums";

const router = Router();

router.use(authenticate);

router.get("/", DepartmentsController.getDepartments);
router.post("/", authorizeRoles(Role.ADMIN, Role.MANAGER), DepartmentsController.createDepartment);
router.delete("/:id", authorizeRoles(Role.ADMIN), DepartmentsController.deleteDepartment);

export default router;
