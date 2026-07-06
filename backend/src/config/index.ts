import dotenv from "dotenv";
import path from "path";

// Support loading env from multiple locations depending on run context (workspace root vs backend folder)
dotenv.config({ path: path.resolve(process.cwd(), ".env") });
dotenv.config({ path: path.join(__dirname, "../../../.env") });
dotenv.config({ path: path.join(__dirname, "../../.env") });
dotenv.config({ path: path.join(__dirname, "../.env") });
dotenv.config({ path: path.join(__dirname, "./.env") });

export const config = {
  port: process.env.PORT || 5000,
  databaseUrl: process.env.DATABASE_URL,
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET || "expiryguard_access_secret_key_12345",
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || "expiryguard_refresh_secret_key_67890",
  jwtAccessExpiry: process.env.JWT_ACCESS_EXPIRY || "15m",
  jwtRefreshExpiry: process.env.JWT_REFRESH_EXPIRY || "7d",
  uploadDir: process.env.UPLOAD_DIR || "uploads",
  clientUrl: process.env.CLIENT_URL || "http://localhost:5173",
};
