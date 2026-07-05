import { prisma } from "../prisma/client";
import { registerSchema, loginSchema } from "../validators/authValidator";
import { AppError } from "../utils/appError";
import {
  hashPassword,
  comparePassword,
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  TokenPayload,
} from "../utils/auth";
import { Role } from "../types/enums";

export class AuthService {
  static async register(data: any) {
    const parsed = registerSchema.parse(data) as any;

    const existingUser = await prisma.user.findUnique({
      where: { email: parsed.email.toLowerCase() },
    });

    if (existingUser) {
      throw new AppError("Email is already registered", 409);
    }

    const hashedPassword = await hashedPasswordVal(parsed.password);

    const user = await prisma.user.create({
      data: {
        fullName: parsed.fullName,
        email: parsed.email.toLowerCase(),
        passwordHash: hashedPassword,
        role: parsed.role || Role.VIEWER,
        departmentId: parsed.departmentId,
      },
      include: {
        department: true,
      },
    });

    const payload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role as Role,
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    // Create activity log
    await prisma.activityLog.create({
      data: {
        action: "Register",
        userId: user.id,
        userName: user.fullName,
        details: `Registered account with role ${user.role}.`,
      },
    });

    return { user, accessToken, refreshToken };
  }

  static async login(data: any) {
    const parsed = loginSchema.parse(data) as any;

    const user = await prisma.user.findUnique({
      where: { email: parsed.email.toLowerCase() },
      include: { department: true },
    });

    if (!user) {
      throw new AppError("Invalid email or password", 401);
    }

    const isMatch = await comparePassword(parsed.password, user.passwordHash);
    if (!isMatch) {
      throw new AppError("Invalid email or password", 401);
    }

    const payload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role as Role,
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    // Create activity log
    await prisma.activityLog.create({
      data: {
        action: "Login",
        userId: user.id,
        userName: user.fullName,
        details: `User logged in.`,
      },
    });

    return { user, accessToken, refreshToken };
  }

  static async refresh(token: string) {
    try {
      const decoded = verifyRefreshToken(token);
      
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        include: { department: true },
      });

      if (!user) {
        throw new AppError("User not found", 404);
      }

      const payload: TokenPayload = {
        userId: user.id,
        email: user.email,
        role: user.role as Role,
      };

      const accessToken = generateAccessToken(payload);
      const newRefreshToken = generateRefreshToken(payload);

      return { user, accessToken, refreshToken: newRefreshToken };
    } catch (error) {
      throw new AppError("Invalid refresh token", 401);
    }
  }

  static async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { department: true },
    });

    if (!user) {
      throw new AppError("User not found", 404);
    }

    return user;
  }

  static async logLogout(userId: string, userName: string) {
    await prisma.activityLog.create({
      data: {
        action: "Logout",
        userId,
        userName,
        details: `User logged out.`,
      },
    });
  }

  static async getUsers() {
    return prisma.user.findMany({
      select: { id: true, fullName: true, email: true },
      orderBy: { fullName: "asc" },
    });
  }

  static async updateUserRole(userId: string, newRole: string) {
    if (!Object.values(Role).includes(newRole as any)) {
      throw new AppError("Invalid role specified", 400);
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { role: newRole },
      include: { department: true },
    });

    return user;
  }
}

async function hashedPasswordVal(password: string): Promise<string> {
  return hashPassword(password);
}
