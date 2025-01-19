import jwt from "jsonwebtoken";

export const verifyToken = async (req, res, next) => {
  try {
    let token = req.header("Authorization");
    console.log("Received token:", token); // Debug log

    if (!token) {
      console.log("No token provided"); // Debug log
      return res.status(403).send("Access Denied");
    }

    if (token.startsWith("Bearer ")) {
      token = token.slice(7, token.length).trimLeft();
    }

    const verified = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Token verified:", verified); // Debug log
    req.user = verified;
    next();
  } catch (err) {
    console.error("Token verification error:", err); // Detailed error log
    res.status(500).json({ error: err.message });
  }
};
