import jwt from "jsonwebtoken";

export const verifyToken = async (req, res, next) => {
  try {
    // Always allow OPTIONS requests
    if (req.method === "OPTIONS") {
      return next();
    }

    const token = req.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({ message: "No authentication token" });
    }

    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified;
    next();
  } catch (err) {
    console.error("Token verification failed:", err);
    return res.status(401).json({ message: "Invalid token" });
  }
};
