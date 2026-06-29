const rateLimit = require("express-rate-limit");

const limiter = rateLimit({
  windowMs: 2 * 60 * 1000, // 2 minutes
  max: 8,
  message: "Too many requests from this IP, please try again after 2 minutes",
});

const limiterForReq = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 1,
  message: "Too many requests from this IP, please try again after 1 minute",
});

const limiterForAuth = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 2,
  message: "Too many requests from this IP, please try again after 1 minute",
});

module.exports = {
  limiter,
  limiterForReq,
  limiterForAuth,
};
