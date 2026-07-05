import { Response, NextFunction } from "express";
import { DashboardService } from "../services/dashboardService";
import { AuthenticatedRequest } from "../types";

export class DashboardController {
  static async getSummary(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const summary = await DashboardService.getSummary();
      res.status(200).json({
        status: "success",
        data: summary,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getCharts(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const charts = await DashboardService.getCharts();
      res.status(200).json({
        status: "success",
        data: charts,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getRecentActivity(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const activities = await DashboardService.getRecentActivity();
      res.status(200).json({
        status: "success",
        data: { activities },
      });
    } catch (error) {
      next(error);
    }
  }
}
