const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 2 * 60 * 1000,
  max: 8,
  message: 'Too many requests from this IP, please try again after 2 minutes',
});

module.exports = limiter;