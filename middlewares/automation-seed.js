require("dotenv").config();

const crypto = require("crypto");

module.exports = async (req, res, next) => {
  try {
    const accessHash = req.headers["x-access-token"];

    if (!accessHash) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized: Access token is required",
      });
    }

    const expectedHash = crypto
      .createHash("sha256")
      .update(process.env.ACCESS_TOKEN)
      .digest("hex");

    if (accessHash.trim() !== expectedHash) {
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
