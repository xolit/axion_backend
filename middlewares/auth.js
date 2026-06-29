const User = require("../apis/auth/user.model");

module.exports = async (req, res, next) => {
  try {
    const path = req.path || "";

    if (path.startsWith("/auth") || path.includes("/admin")) {
      return next();
    }

    const expected = process.env.ACCESS_TOKEN;

    const token =
      req.body?.accessToken ||
      req.headers["x-access-token"] ||
      req.query.accessToken;

    const userId = req.body?.userId;

    if (!expected) {
      console.warn("ACCESS_TOKEN not set in environment");
      return res.status(500).json({
        success: false,
        error: "Server not configured",
      });
    }

    if (!token || token !== expected) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized",
      });
    }

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "User ID is required",
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    req.user = user;

    next();
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};
