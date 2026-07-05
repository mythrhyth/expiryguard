import { Router } from "express";
import { CategoriesController } from "../controllers/categoriesController";
import { authenticate, authorizeRoles } from "../middlewares/authMiddleware";
import { Role } from "../types/enums";

const router = Router();

router.use(authenticate);

router.get("/", CategoriesController.getCategories);
router.post("/", authorizeRoles(Role.ADMIN, Role.MANAGER), CategoriesController.createCategory);
router.put("/:id", authorizeRoles(Role.ADMIN, Role.MANAGER), CategoriesController.updateCategory);
router.delete("/:id", authorizeRoles(Role.ADMIN), CategoriesController.deleteCategory);

export default router;
