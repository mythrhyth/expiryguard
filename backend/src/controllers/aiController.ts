import { Response, NextFunction } from "express";
import { AIService } from "../services/aiService";
import { AuthenticatedRequest } from "../types";
import { AppError } from "../utils/appError";

export class AIController {
  static async extractDocument(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        throw new AppError("No document file was uploaded.", 400);
      }

      // Process document extraction
      const extracted = await AIService.extractDocument(req.file);

      res.status(200).json({
        status: "success",
        data: { extracted },
      });
    } catch (error) {
      next(error);
    }
  }
}
