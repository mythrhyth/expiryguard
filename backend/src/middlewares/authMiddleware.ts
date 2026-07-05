import { Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/auth";
import { AppError } from "../utils/appError";
import { AuthenticatedRequest } from "../types";
import { Role } from "../types/enums";

export const authenticate = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    let token = "";
    
    // Check Authorization Header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }
    
    // Fallback: Check Query Parameter (for report exports / static links)
    if (!token && req.query.token) {
      token = req.query.token as string;
    }

    if (!token) {
      throw new AppError("Authentication token is missing", 401);
    }

    const decoded = verifyAccessToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    next(error);
  }
};

export const authorizeRoles = (...roles: Role[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError("User context not found", 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(new AppError("You do not have permission to perform this action", 403));
    }

    next();
  };
};
