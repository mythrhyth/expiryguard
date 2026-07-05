import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { config } from "../config";
import { Role } from "../types/enums";

export interface TokenPayload {
  userId: string;
  email: string;
  role: Role;
}

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 10);
};

export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

export const generateAccessToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, config.jwtAccessSecret, {
    expiresIn: config.jwtAccessExpiry as jwt.SignOptions["expiresIn"],
  });
};

export const generateRefreshToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, config.jwtRefreshSecret, {
    expiresIn: config.jwtRefreshExpiry as jwt.SignOptions["expiresIn"],
  });
};

export const verifyAccessToken = (token: string): TokenPayload => {
  return jwt.verify(token, config.jwtAccessSecret) as TokenPayload;
};

export const verifyRefreshToken = (token: string): TokenPayload => {
  return jwt.verify(token, config.jwtRefreshSecret) as TokenPayload;
};
