import { Response, NextFunction } from "express";
import { AuthService } from "../services/authService";
import { AuthenticatedRequest } from "../types";
import { AppError } from "../utils/appError";

export class AuthController {
  static async register(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await AuthService.register(req.body);
      
      // Set refresh token as httpOnly cookie
      res.cookie("refreshToken", result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.status(201).json({
        status: "success",
        data: {
          user: {
            id: result.user.id,
            fullName: result.user.fullName,
            email: result.user.email,
            role: result.user.role,
            department: result.user.department,
          },
          accessToken: result.accessToken,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async login(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await AuthService.login(req.body);

      // Set refresh token as httpOnly cookie
      res.cookie("refreshToken", result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.status(200).json({
        status: "success",
        data: {
          user: {
            id: result.user.id,
            fullName: result.user.fullName,
            email: result.user.email,
            role: result.user.role,
            department: result.user.department,
          },
          accessToken: result.accessToken,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async refresh(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      // Refresh token can be in cookies or headers (fallback)
      const token = req.cookies?.refreshToken || req.body.refreshToken;

      if (!token) {
        return res.status(401).json({
          status: "error",
          message: "Refresh token is missing",
        });
      }

      const result = await AuthService.refresh(token);

      res.cookie("refreshToken", result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.status(200).json({
        status: "success",
        data: {
          user: {
            id: result.user.id,
            fullName: result.user.fullName,
            email: result.user.email,
            role: result.user.role,
            department: result.user.department,
          },
          accessToken: result.accessToken,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async getMe(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({ status: "error", message: "Unauthorized" });
      }

      const user = await AuthService.getMe(req.user.userId);
      res.status(200).json({
        status: "success",
        data: {
          user: {
            id: user.id,
            fullName: user.fullName,
            email: user.email,
            role: user.role,
            department: user.department,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async logout(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (req.user) {
        await AuthService.logLogout(req.user.userId, req.user.email);
      }
      res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      });
      res.status(200).json({
        status: "success",
        message: "Logged out successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  static async getUsers(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const users = await AuthService.getUsers();
      res.status(200).json({
        status: "success",
        data: { users },
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateUserRole(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { role } = req.body;

      if (!role) {
        throw new AppError("Role is required", 400);
      }

      const user = await AuthService.updateUserRole(id, role);

      res.status(200).json({
        status: "success",
        data: {
          user: {
            id: user.id,
            fullName: user.fullName,
            email: user.email,
            role: user.role,
            department: user.department,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }
}
