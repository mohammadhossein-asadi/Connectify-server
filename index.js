import express from "express";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import multer from "multer";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

// Import routes
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import postRoutes from "./routes/posts.js";
import healthRoutes from "./routes/health.js";

// Import controllers
import { register } from "./controllers/auth.js";
import { createPost } from "./controllers/posts.js";

// Import middleware
import { verifyToken } from "./middleware/auth.js";
import { cacheMiddleware } from "./middleware/cache.js";
import { authLimiter, apiLimiter } from "./middleware/rateLimiter.js";
import { performanceMiddleware } from "./middleware/performance.js";
import { validatePost } from "./middleware/validator.js";

// Initialize error tracking if Sentry is configured
const initErrorTracking = async () => {
  if (process.env.SENTRY_DSN) {
    const Sentry = await import("@sentry/node");
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV,
      tracesSampleRate: 1.0,
    });
  }
};

/* CONFIGURATIONS */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config();

// Only initialize error tracking if SENTRY_DSN is provided
if (process.env.SENTRY_DSN) {
  initErrorTracking();
}

const app = express();

/* MIDDLEWARE */
app.use(express.json());
app.use(morgan("dev"));
app.use(bodyParser.json({ limit: "30mb", extended: true }));
app.use(bodyParser.urlencoded({ limit: "30mb", extended: true }));
app.use(performanceMiddleware);

// CORS configuration - Must be first middleware
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = process.env.CORS_ALLOWED_ORIGINS?.split(",") || [
      "http://localhost:5173",
      "http://localhost:3001",
      "https://connectifysocial.vercel.app",
      "https://connectify-client.vercel.app",
    ];

    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin || process.env.NODE_ENV === "development") {
      return callback(null, true);
    }

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Accept", "Origin"],
  exposedHeaders: ["Content-Length", "Content-Type"],
  maxAge: 86400,
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));

// Security
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
    contentSecurityPolicy: false,
  })
);

// Rate limiting
app.use("/auth/login", authLimiter);
app.use("/api", apiLimiter);

// Static files
app.use("/assets", express.static(path.join(__dirname, "public/assets")));

/* FILE STORAGE */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Create directory if it doesn't exist
    const dir = "public/assets";
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only images are allowed"));
    }
    cb(null, true);
  },
});

/* ROUTES */
// Health check
app.use("/", healthRoutes);

// Auth routes
app.post("/auth/register", upload.single("picture"), register);
app.use("/auth", authRoutes);

// Protected routes with caching
app.use("/posts", verifyToken, cacheMiddleware(300), postRoutes);
app.use("/users", verifyToken, cacheMiddleware(300), userRoutes);

// Post creation with validation
app.post(
  "/posts",
  verifyToken,
  upload.single("picture"),
  validatePost,
  createPost
);

// Add after CORS middleware
app.use((req, res, next) => {
  // Set global timeout of 30 seconds
  req.setTimeout(30000, () => {
    res.status(408).json({ message: "Request timeout" });
  });
  next();
});

/* ERROR HANDLING */
app.use((err, req, res, next) => {
  console.error("Error:", {
    method: req.method,
    url: req.url,
    body: req.body,
    error: err.message,
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });

  if (err.message.includes("CORS")) {
    return res.status(403).json({
      error: "CORS Error",
      message: "Origin not allowed",
    });
  }

  res.status(err.status || 500).json({
    error: err.message || "Internal Server Error",
  });
});

/* MONGOOSE SETUP */
const PORT = process.env.PORT || 6001;
mongoose.set("debug", process.env.NODE_ENV === "development");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
      keepAlive: true,
      keepAliveInitialDelay: 300000,
    });

    console.log("MongoDB Connected");

    app.listen(PORT, () => {
      console.log(`Server running on port: ${PORT}`);
    });
  } catch (error) {
    console.error("Database connection failed:", error);
    process.exit(1);
  }
};

connectDB();

// Graceful shutdown
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

async function shutdown() {
  console.log("Received kill signal, shutting down gracefully");
  try {
    await mongoose.connection.close();
    console.log("MongoDB connection closed");
    process.exit(0);
  } catch (err) {
    console.error("Error during shutdown:", err);
    process.exit(1);
  }
}

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});
