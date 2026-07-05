import { Response, NextFunction } from "express";
import { RecordsService } from "../services/recordsService";
import { AuthenticatedRequest } from "../types";

export class RecordsController {
  static async getRecords(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await RecordsService.getRecords(req.query);
      res.status(200).json({
        status: "success",
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getRecordById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const record = await RecordsService.getRecordById(req.params.id);
      res.status(200).json({
        status: "success",
        data: { record },
      });
    } catch (error) {
      next(error);
    }
  }

  static async createRecord(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({ status: "error", message: "Unauthorized" });
      }

      // If a file was uploaded by multer, set the attachment url
      if (req.file) {
        req.body.attachmentUrl = `/uploads/${req.file.filename}`;
      }

      const record = await RecordsService.createRecord(
        req.body,
        req.user.userId,
        req.user.email
      );

      res.status(201).json({
        status: "success",
        data: { record },
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateRecord(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({ status: "error", message: "Unauthorized" });
      }

      // If a file was uploaded by multer, update attachment URL
      if (req.file) {
        req.body.attachmentUrl = `/uploads/${req.file.filename}`;
      }

      const record = await RecordsService.updateRecord(
        req.params.id,
        req.body,
        req.user.userId,
        req.user.email
      );

      res.status(200).json({
        status: "success",
        data: { record },
      });
    } catch (error) {
      next(error);
    }
  }

  static async renewRecord(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({ status: "error", message: "Unauthorized" });
      }

      const record = await RecordsService.renewRecord(
        req.params.id,
        req.body,
        req.user.userId,
        req.user.email
      );

      res.status(200).json({
        status: "success",
        data: { record },
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteRecord(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({ status: "error", message: "Unauthorized" });
      }

      const deleted = await RecordsService.deleteRecord(
        req.params.id,
        req.user.userId,
        req.user.email
      );

      res.status(200).json({
        status: "success",
        message: `Record ${deleted.name} was deleted successfully.`,
        data: { id: deleted.id },
      });
    } catch (error) {
      next(error);
    }
  }
}
