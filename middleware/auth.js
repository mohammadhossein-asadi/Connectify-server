import jwt from "jsonwebtoken";

export const verifyToken = async (req, res, next) => {
  try {
    // Always allow OPTIONS requests
    if (req.method === "OPTIONS") {
      return next();
    }

    let token = req.headers.authorization;

    if (!token) {
      return res.status(401).json({ message: "No authentication token" });
    }

    // Properly handle "Bearer " prefix
    if (token.startsWith("Bearer ")) {
      token = token.slice(7);
    }

    if (!token.trim()) {
      return res.status(401).json({ message: "Invalid token format" });
    }

    try {
      const verified = jwt.verify(token, process.env.JWT_SECRET);
      req.user = verified;
      next();
    } catch (jwtError) {
      console.error("JWT verification failed:", jwtError);
      return res.status(401).json({ message: "Invalid or expired token" });
    }
  } catch (err) {
    console.error("Auth middleware error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};
