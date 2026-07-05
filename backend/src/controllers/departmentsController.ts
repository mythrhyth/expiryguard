import { Response, NextFunction } from "express";
import { prisma } from "../prisma/client";
import { departmentSchema } from "../validators/generalValidator";
import { AppError } from "../utils/appError";
import { AuthenticatedRequest } from "../types";

export class DepartmentsController {
  static async getDepartments(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const departments = await prisma.department.findMany({
        orderBy: { name: "asc" },
      });
      res.status(200).json({
        status: "success",
        data: { departments },
      });
    } catch (error) {
      next(error);
    }
  }

  static async createDepartment(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const parsed = departmentSchema.parse(req.body);

      const department = await prisma.department.create({
        data: {
          name: parsed.name,
        },
      });

      res.status(201).json({
        status: "success",
        data: { department },
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteDepartment(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      // Check if users or records are associated
      const userCount = await prisma.user.count({
        where: { departmentId: req.params.id },
      });
      const recordCount = await prisma.record.count({
        where: { departmentId: req.params.id },
      });

      if (userCount > 0 || recordCount > 0) {
        throw new AppError("Cannot delete department with associated users or records", 400);
      }

      await prisma.department.delete({
        where: { id: req.params.id },
      });

      res.status(200).json({
        status: "success",
        message: "Department deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  }
}
