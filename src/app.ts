import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import authRoutes from "./routes/authRoutes";
import courseRoutes from "./routes/courseRoutes";
import aiRoutes from "./routes/aiRoutes";
import dashboardRoutes from "./routes/dashboardRoutes";
import { notFound, errorHandler } from "./middleware/errorHandler";

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:3000", credentials: true }));
app.use(express.json({ limit: "1mb" }));

// Basic abuse protection on auth + AI endpoints (cost/security sensitive)
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 50 });
const aiLimiter = rateLimit({ windowMs: 60 * 1000, max: 20 });

// -------------------------------------------------------------
// Vercel বা ব্রাউজার থেকে সরাসরি ঢুকলে যেন Route Not Found না দেখায়
app.get("/", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Welcome to the E-Learning Platform API Server!",
    status: "Healthy & Running"
  });
});
// -------------------------------------------------------------

app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/ai", aiLimiter, aiRoutes);
app.use("/api/dashboard", dashboardRoutes);

app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

app.use(notFound);
app.use(errorHandler);

export default app;