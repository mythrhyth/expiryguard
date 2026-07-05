import { Response, NextFunction } from "express";
import { prisma } from "../prisma/client";
import { categorySchema } from "../validators/generalValidator";
import { AppError } from "../utils/appError";
import { AuthenticatedRequest } from "../types";

export class CategoriesController {
  static async getCategories(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const categories = await prisma.category.findMany({
        orderBy: { name: "asc" },
        include: {
          _count: { select: { records: true } },
        },
      });
      res.status(200).json({
        status: "success",
        data: { categories },
      });
    } catch (error) {
      next(error);
    }
  }

  static async createCategory(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const parsed = categorySchema.parse(req.body);

      const category = await prisma.category.create({
        data: {
          name: parsed.name,
          description: parsed.description,
          color: parsed.color || "#6B7280",
        },
      });

      res.status(201).json({
        status: "success",
        data: { category },
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateCategory(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const parsed = categorySchema.partial().parse(req.body);

      const category = await prisma.category.update({
        where: { id: req.params.id },
        data: parsed,
      });

      res.status(200).json({
        status: "success",
        data: { category },
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteCategory(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      // Check if any records are associated
      const recordCount = await prisma.record.count({
        where: { categoryId: req.params.id },
      });

      if (recordCount > 0) {
        throw new AppError("Cannot delete category with associated records", 400);
      }

      await prisma.category.delete({
        where: { id: req.params.id },
      });

      res.status(200).json({
        status: "success",
        message: "Category deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  }
}
