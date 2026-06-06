function cacheMiddleware(keyFn, ttl = 60) {
  return async (req, res, next) => {
    try {
      const client = req.app.locals.redis;
      if (!client) return next();
      const key = typeof keyFn === 'function' ? keyFn(req) : keyFn;
      const cached = await client.get(key);
      if (cached) {
        res.setHeader('X-Cache', 'HIT');
        return res.json(JSON.parse(cached));
      }
      // capture send
      const originalJson = res.json.bind(res);
      res.json = async (body) => {
        try { await client.setEx(key, ttl, JSON.stringify(body)); } catch (e) { /* ignore */ }
        res.setHeader('X-Cache', 'MISS');
        return originalJson(body);
      };
      next();
    } catch (err) {
      next();
    }
  };
}

module.exports = cacheMiddleware;
