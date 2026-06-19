const rateLimit = require("express-rate-limit");

const limiter = rateLimit({
  windowMs: 2 * 60 * 1000, // 2 minutes
  max: 8,
  message: "Too many requests from this IP, please try again after 2 minutes",
});

const limiterForReq = rateLimit({
  windowMs: 2 * 60 * 1000, // 2 minutes
  max: 3,
  message: "Too many requests from this IP, please try again after 2 minutes",
});

module.exports = {
  limiter,
  limiterForReq,
};
