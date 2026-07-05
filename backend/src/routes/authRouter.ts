import { Router } from "express";
import { AuthController } from "../controllers/authController";
import { authenticate, authorizeRoles } from "../middlewares/authMiddleware";
import { validateBody } from "../middlewares/validationMiddleware";
import { registerSchema, loginSchema } from "../validators/authValidator";
import { Role } from "../types/enums";

const router = Router();

router.post("/register", validateBody(registerSchema), AuthController.register);
router.post("/login", validateBody(loginSchema), AuthController.login);
router.post("/refresh", AuthController.refresh);
router.post("/logout", authenticate, AuthController.logout);
router.get("/me", authenticate, AuthController.getMe);
router.get("/users", authenticate, AuthController.getUsers);
router.put("/users/:id/role", authenticate, authorizeRoles(Role.ADMIN), AuthController.updateUserRole);

export default router;
