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
import { prisma } from "./prisma/client";

const app = express();

// Apply security headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Configure dynamic CORS origins
const allowedOrigins = typeof config.clientUrl === "string"
  ? config.clientUrl.split(",").map((url) => url.trim()).filter(Boolean)
  : [];

// Default to localhost in development if not already present
if (process.env.NODE_ENV !== "production" && !allowedOrigins.includes("http://localhost:5173")) {
  allowedOrigins.push("http://localhost:5173");
}

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. mobile apps, server-to-server, curl)
    if (!origin) {
      return callback(null, true);
    }

    // Check if origin matches allowed list
    const isAllowed = allowedOrigins.some((allowed) => allowed === origin);

    // Check if origin matches Vercel preview domain pattern
    const isVercelPreview = /^https:\/\/expiryguard-[a-zA-Z0-9-]+\.vercel\.app$/.test(origin);

    if (isAllowed || isVercelPreview) {
      callback(null, true);
    } else {
      logger.warn(`Blocked by CORS: origin ${origin} not allowed. Allowed: ${allowedOrigins.join(", ")}`);
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

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

const connectWithRetry = async (retries = 5, delay = 5000) => {
  for (let i = 0; i < retries; i++) {
    try {
      await prisma.$connect();
      logger.info("Successfully connected to Neon PostgreSQL database.");
      return;
    } catch (err) {
      logger.error(`Database connection failed (attempt ${i + 1}/${retries}): ${err}`);
      if (i < retries - 1) {
        logger.info(`Retrying database connection in ${delay / 1000}s...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      } else {
        throw new Error("Unable to connect to the database after maximum retries.");
      }
    }
  }
};

// Start server and cron scan
const PORT = config.port;
app.listen(PORT, async () => {
  logger.info(`ExpiryGuard Server running on port ${PORT}`);
  
  try {
    await connectWithRetry();
    // Initialize Cron Job Scanner
    initNotificationsCron();

    // Run a one-time immediate scan on startup to initialize notifications for seeded data
    await scanAndGenerateNotifications();
  } catch (error) {
    logger.error("Failed to start background services:", error);
    process.exit(1);
  }
});

export default app;
