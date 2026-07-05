import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import path from "path";
import { config } from "./config";
import { logger } from "./utils/logger";
import { errorHandler } from "./middlewares/errorMiddleware";
import authRouter from "./routes/authRouter";
import recordsRouter from "./routes/recordsRouter";
import dashboardRouter from "./routes/dashboardRouter";
import categoriesRouter from "./routes/categoriesRouter";
import departmentsRouter from "./routes/departmentsRouter";
import notificationsRouter from "./routes/notificationsRouter";
import reportsRouter from "./routes/reportsRouter";
import aiRouter from "./routes/aiRouter";
import { initNotificationsCron, scanAndGenerateNotifications } from "./notifications/cron";

const app = express();

// Apply security headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Configure CORS
app.use(
  cors({
    origin: config.clientUrl,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Rate limiting to prevent abuse
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // limit each IP to 300 requests per window
  message: "Too many requests from this IP, please try again after 15 minutes",
});
app.use("/api", limiter);

// Request parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve file uploads statically
const uploadDir = path.resolve(__dirname, "../../", config.uploadDir);
app.use("/uploads", express.static(uploadDir));

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", timestamp: new Date() });
});

// Parse cookie manual helper middleware to inject req.cookies
app.use((req: any, res, next) => {
  const cookiesStr = req.headers.cookie || "";
  const cookies: Record<string, string> = {};
  cookiesStr.split(";").forEach((cookie) => {
    const parts = cookie.split("=");
    if (parts.length === 2) {
      cookies[parts[0].trim()] = decodeURIComponent(parts[1].trim());
    }
  });
  req.cookies = cookies;
  next();
});

// API Routes
app.use("/api/auth", authRouter);
app.use("/api/records", recordsRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/categories", categoriesRouter);
app.use("/api/departments", departmentsRouter);
app.use("/api/notifications", notificationsRouter);
app.use("/api/reports", reportsRouter);
app.use("/api/ai", aiRouter);

// Global Error Handler
app.use(errorHandler);

// Start server and cron scan
const PORT = config.port;
app.listen(PORT, async () => {
  logger.info(`ExpiryGuard Server running on port ${PORT}`);
  
  // Initialize Cron Job Scanner
  initNotificationsCron();

  // Run a one-time immediate scan on startup to initialize notifications for seeded data
  await scanAndGenerateNotifications();
});

export default app;
