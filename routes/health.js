import express from "express";
import mongoose from "mongoose";

const router = express.Router();

router.get("/health", async (req, res) => {
  try {
    const dbStatus = mongoose.connection.readyState === 1;
    const uptime = process.uptime();
    const memoryUsage = process.memoryUsage();

    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime,
      database: {
        connected: dbStatus,
        host: mongoose.connection.host,
      },
      memory: {
        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024) + "MB",
        heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024) + "MB",
      },
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

export default router;
