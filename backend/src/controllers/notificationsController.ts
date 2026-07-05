import { Response, NextFunction } from "express";
import { prisma } from "../prisma/client";
import { AuthenticatedRequest } from "../types";

export class NotificationsController {
  static async getNotifications(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({ status: "error", message: "Unauthorized" });
      }

      const notifications = await prisma.notification.findMany({
        where: { userId: req.user.userId },
        orderBy: { createdAt: "desc" },
      });

      res.status(200).json({
        status: "success",
        data: { notifications },
      });
    } catch (error) {
      next(error);
    }
  }

  static async markAsRead(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({ status: "error", message: "Unauthorized" });
      }

      const notification = await prisma.notification.update({
        where: {
          id: req.params.id,
          userId: req.user.userId,
        },
        data: { read: true },
      });

      res.status(200).json({
        status: "success",
        data: { notification },
      });
    } catch (error) {
      next(error);
    }
  }

  static async markAllAsRead(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({ status: "error", message: "Unauthorized" });
      }

      await prisma.notification.updateMany({
        where: {
          userId: req.user.userId,
          read: false,
        },
        data: { read: true },
      });

      res.status(200).json({
        status: "success",
        message: "All notifications marked as read",
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteNotification(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({ status: "error", message: "Unauthorized" });
      }

      await prisma.notification.delete({
        where: {
          id: req.params.id,
          userId: req.user.userId,
        },
      });

      res.status(200).json({
        status: "success",
        message: "Notification deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  }
}
