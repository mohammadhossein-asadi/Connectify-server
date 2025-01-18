const cache = new Map();
const DEFAULT_TTL = 300000; // 5 minutes in milliseconds

export const cacheMiddleware = (duration = DEFAULT_TTL) => {
  return (req, res, next) => {
    if (req.method !== "GET") {
      return next();
    }

    const key = `__express__${req.originalUrl}`;
    const cached = cache.get(key);

    if (cached && cached.expiry > Date.now()) {
      return res.json(cached.data);
    }

    res.originalJson = res.json;
    res.json = (body) => {
      cache.set(key, {
        data: body,
        expiry: Date.now() + duration,
      });
      res.originalJson(body);
    };
    next();
  };
};

export const clearCache = (pattern) => {
  for (const [key] of cache) {
    if (!pattern || key.includes(pattern)) {
      cache.delete(key);
    }
  }
};

// Clean expired cache entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of cache) {
    if (value.expiry <= now) {
      cache.delete(key);
    }
  }
}, 300000);
