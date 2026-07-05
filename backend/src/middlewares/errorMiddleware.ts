import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { AppError } from "../utils/appError";
import { logger } from "../utils/logger";

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
) => {
  logger.error(err);

  // Zod request validation error
  if (err instanceof ZodError) {
    const errors = err.errors.map((e) => ({
      field: e.path.join("."),
      message: e.message,
    }));
    return res.status(400).json({
      status: "error",
      message: "Validation Error",
      errors,
    });
  }

  // Application operational error
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      status: "error",
      message: err.message,
    });
  }

  // Prisma unique key violation
  if (err.name === "PrismaClientKnownRequestError") {
    const code = (err as any).code;
    if (code === "P2002") {
      return res.status(409).json({
        status: "error",
        message: `Unique constraint failed on field: ${(err as any).meta?.target || "unknown"}`,
      });
    }
  }

  // JWT error
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({
      status: "error",
      message: "Invalid token. Please log in again.",
    });
  }
  if (err.name === "TokenExpiredError") {
    return res.status(401).json({
      status: "error",
      message: "Token expired. Please log in again.",
    });
  }

  // Default internal server error
  return res.status(500).json({
    status: "error",
    message: process.env.NODE_ENV === "production" ? "Something went wrong!" : err.message,
  });
};
