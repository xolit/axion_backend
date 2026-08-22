require("dotenv").config();

module.exports = async (req, res, next) => {
  try {
    let accessHash = req.headers["x-access-token"];
    accessHash = accessHash.trim();
    const expectedHash = process.env.ACCESS_TOKEN;

    if (!accessHash) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized: Access token is required",
      });
    }

    if (accessHash !== expectedHash) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized: Invalid access token",
      });
    }

    next();
  } catch (error) {
    console.error("Error in automation seed middleware:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};
