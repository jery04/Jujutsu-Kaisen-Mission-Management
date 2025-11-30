const rateLimit = require('express-rate-limit');

// Middleware de rate limiting configurable.
// Variables de entorno soportadas:
// RATE_LIMIT_WINDOW_MS: ventana base en ms (default 15 min)
// RATE_LIMIT_MAX: requests permitidos por IP en ventana base (default 300)
// RATE_LIMIT_HEAVY_WINDOW_MS: ventana para endpoints pesados (default = window base)
// RATE_LIMIT_HEAVY_MAX: límite para endpoints pesados (default = max/3)
// RATE_LIMIT_SKIP_HEALTH: si "true" omite /health
// RATE_LIMIT_TRUST_PROXY: si "true" activa app.set('trust proxy', 1) (cuando hay reverse proxy)
function createApiRateLimiter(app) {
  const windowMs = Number(process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000);
  const max = Number(process.env.RATE_LIMIT_MAX || 300);
  const heavyWindowMs = Number(process.env.RATE_LIMIT_HEAVY_WINDOW_MS || windowMs);
  const heavyMax = Number(process.env.RATE_LIMIT_HEAVY_MAX || Math.max(1, Math.round(max / 3)));
  const skipHealth = (process.env.RATE_LIMIT_SKIP_HEALTH || 'true').toLowerCase() === 'true';
  const trustProxy = (process.env.RATE_LIMIT_TRUST_PROXY || 'false').toLowerCase() === 'true';

  if (trustProxy) {
    app.set('trust proxy', 1);
  }

  const baseLimiter = rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => skipHealth && req.path === '/health',
    message: {
      error: 'Too Many Requests',
      type: 'rate_limit',
      windowMs,
      max,
      retryAfterMs: windowMs
    }
  });

  const heavyLimiter = rateLimit({
    windowMs: heavyWindowMs,
    max: heavyMax,
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => skipHealth && req.path === '/health',
    message: {
      error: 'Too Many Requests (heavy)',
      type: 'rate_limit_heavy',
      windowMs: heavyWindowMs,
      max: heavyMax,
      retryAfterMs: heavyWindowMs
    }
  });

  return { baseLimiter, heavyLimiter };
}

module.exports = { createApiRateLimiter };
