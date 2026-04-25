const requestLog = new Map();

function rateLimiter({ windowMs = 60_000, maxRequests = 20 } = {}) {
  return (req, res, next) => {
    const ip = req.ip;
    const now = Date.now();

    const timestamps = requestLog.get(ip) || [];

    const recent = timestamps.filter(ts => now - ts < windowMs);

    if (recent.length >= maxRequests) {
      const retryAfterSec = Math.ceil((recent[0] + windowMs - now) / 1000);
      res.set('Retry-After', String(retryAfterSec));
      return res.status(429).render('error', {
        message: `You're searching too quickly. Please wait ${retryAfterSec} seconds and try again.`,
        canRetry: true,
        query: req.query.q || ''
      });
    }

    recent.push(now);
    requestLog.set(ip, recent);

    if (Math.random() < 0.01) {
      for (const [key, value] of requestLog.entries()) {
        const cleaned = value.filter(ts => now - ts < windowMs);
        if (cleaned.length === 0) {
          requestLog.delete(key);
        } else {
          requestLog.set(key, cleaned);
        }
      }
    }

    next();
  };
}

module.exports = rateLimiter;
