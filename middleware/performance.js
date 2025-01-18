import { performance } from "perf_hooks";

export const performanceMiddleware = (req, res, next) => {
  const start = performance.now();

  res.on("finish", () => {
    const duration = performance.now() - start;
    console.log(`${req.method} ${req.url} - ${duration.toFixed(2)}ms`);

    // Alert on slow requests
    if (duration > 1000) {
      console.warn(
        `Slow request: ${req.method} ${req.url} took ${duration.toFixed(2)}ms`
      );
    }
  });

  next();
};
