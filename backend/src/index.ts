import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import { logger } from "./utils/logger";

dotenv.config();

const app = express();

logger.info("🚀 Starting PF-QMS Backend Server", { env: process.env.NODE_ENV });

// CORS configuration - use environment variables
const socketUrl = process.env.SOCKET_URL || "http://localhost:3000";
const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

const allowedOrigins = process.env.NODE_ENV === "production" 
  ? [frontendUrl, `www.${frontendUrl}`]
  : ["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"];

logger.info("CORS Origins configured", { origins: allowedOrigins, socketUrl, frontendUrl });

// Create HTTP server - needed for Socket.IO
const server = http.createServer(app);

export const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true
  }
});
export const prisma = new PrismaClient();

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const user = (req as any).user;
    logger.request(req.method, req.path, res.statusCode, duration, user?.id);
  });
  
  next();
});

// Error handling middleware
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error("Unhandled Error", err, "MIDDLEWARE");
  res.status(500).json({ error: "Internal server error" });
});

// Basic health check route
app.get("/api/health", (_req, res) => {
  logger.info("Health check requested");
  res.json({ status: "OK", timestamp: new Date() });
});

// Setup WebSockets
io.on("connection", (socket) => {
  logger.info("Client connected", { socketId: socket.id }, "SOCKET.IO");

  socket.on("disconnect", () => {
    logger.info("Client disconnected", { socketId: socket.id }, "SOCKET.IO");
  });

  socket.on("error", (error) => {
    logger.error("Socket.IO error", error, "SOCKET.IO");
  });
});

// Import routes
import authRoutes from "./routes/auth.routes";
import queueRoutes from "./routes/queue.routes";
import adminRoutes from "./routes/admin.routes";
import superadminRoutes from "./routes/superadmin.routes";

app.use("/api/auth", authRoutes);
app.use("/api/queue", queueRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/superadmin", superadminRoutes);

logger.info("All routes configured successfully");

// ALWAYS start the server - both for local and Passenger
const PORT = parseInt(process.env.PORT || "3000", 10);

server.listen(PORT, "0.0.0.0", () => {
  logger.info(`✅ Server running on port ${PORT}`, { port: PORT, env: process.env.NODE_ENV });
});

// Handle server errors
server.on("error", (error) => {
  logger.error("Server error", error, "SERVER");
});

// Handle process errors
process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled Rejection", { reason, promise }, "PROCESS");
});

process.on("uncaughtException", (error) => {
  logger.error("Uncaught Exception", error, "PROCESS");
  process.exit(1);
});

// Export app as well (for compatibility)
module.exports = app;
