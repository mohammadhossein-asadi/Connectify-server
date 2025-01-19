import jwt from "jsonwebtoken";

export const verifyToken = async (req, res, next) => {
  try {
    // Always allow OPTIONS requests
    if (req.method === "OPTIONS") {
      return next();
    }

    const token = req.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({
        message: "No authentication token",
        path: req.path,
        method: req.method,
      });
    }

    try {
      const verified = jwt.verify(token, process.env.JWT_SECRET);
      req.user = verified;
      next();
    } catch (err) {
      console.error("Token verification failed:", {
        error: err.message,
        path: req.path,
        token: token.substring(0, 10) + "...", // Log part of token for debugging
      });
      return res.status(401).json({ message: "Invalid token" });
    }
  } catch (err) {
    console.error("Auth middleware error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
