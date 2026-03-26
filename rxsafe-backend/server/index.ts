import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();
import { registerRoutes } from "../routes";
import adminCreateRoute from "../routes/adminCreate";
import alertRoutes from "../routes/alertRoutes"; // ✅ ADD THIS
import path from "path";


const app = express();


// -----------------------------------------------------
// 1️⃣ CORS MUST BE FIRST!!
// -----------------------------------------------------
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);




// -----------------------------------------------------
// 2️⃣ BODY PARSING
// -----------------------------------------------------
declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  })
);

app.use(express.urlencoded({ extended: false }));

/* =========================================
   SERVE UPLOADED FILES
========================================= */

const uploadsPath = path.resolve("uploads");

app.use("/uploads", express.static(uploadsPath));

console.log("Serving uploads from:", uploadsPath);
dotenv.config();

// -----------------------------------------------------
// 3️⃣ REQUEST LOGGER
// -----------------------------------------------------
app.use((req, res, next) => {
  const start = Date.now();

  const originalJson = res.json;
  res.json = function (body) {
    const duration = Date.now() - start;
    console.log(
      `[SERVER] ${req.method} ${req.path} ${res.statusCode} in ${duration}ms :: ${JSON.stringify(body).slice(0, 80)}…`
    );
    return originalJson.call(this, body);
  };

  next();
});

// -----------------------------------------------------
// 4️⃣ MONGO CONNECTION
// -----------------------------------------------------
const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error("❌ MONGODB_URI missing in .env");

    await mongoose.connect(uri);
    console.log("[SERVER] MongoDB connected");
  } catch (err: any) {
    console.error("[SERVER] MongoDB error:", err.message);
    process.exit(1);
  }
};

// -----------------------------------------------------
// 5️⃣ START SERVER
// -----------------------------------------------------
(async () => {
  await connectDB();

  // -----------------------------------------------------
  // Admin creation route
  // -----------------------------------------------------
  app.use("/api/admin", adminCreateRoute);

  // -----------------------------------------------------
  // ✅ ALERTS ROUTE (THIS WAS MISSING)
  // -----------------------------------------------------
  app.use("/api/alerts", alertRoutes);

  // -----------------------------------------------------
  // Register all other routes
  // -----------------------------------------------------
  const server = await registerRoutes(app);

  // -----------------------------------------------------
  // GLOBAL ERROR HANDLER
  // -----------------------------------------------------
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error("GLOBAL ERROR:", err);
    res.status(err.status || 500).json({
      success: false,
      error: err.message || "Internal Server Error",
    });
  });

  const port = parseInt(process.env.PORT || "5001", 10);
  server.listen(port, () => {
    console.log(`🔥 Backend running at http://localhost:${port}`);
  });
})();
