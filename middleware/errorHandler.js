export const corsErrorHandler = (err, req, res, next) => {
  if (err.message.includes("CORS")) {
    return res.status(403).json({
      message: "CORS error: Origin not allowed",
      allowedOrigins: process.env.CORS_ALLOWED_ORIGINS.split(","),
    });
  }
  next(err);
};

// Add this to index.js after your routes
app.use(corsErrorHandler);
