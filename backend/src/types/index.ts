import { Request } from "express";
import { Role } from "./enums";

export interface UserContext {
  userId: string;
  email: string;
  role: Role;
}

export interface AuthenticatedRequest extends Request {
  user?: UserContext;
  file?: Express.Multer.File;
}
