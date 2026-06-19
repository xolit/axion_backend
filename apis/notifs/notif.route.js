const express = require("express");
const Notification = require("../movies/notif.model");
const { limiter } = require("../../service/limiter");

const router = express.Router();

// Helper function to get admin credentials
function getAdminCredentials(req) {
  return {
    accessToken: req.query.accessToken,
    adminPass: req.query.adminPass,
  };
}

// Helper function to check admin authentication
function ensureAdmin(req, res, next) {
  const { adminPass } = getAdminCredentials(req);
  const expectedPass = process.env.ADMIN_PASS;

  if (!expectedPass) {
    return res
      .status(500)
      .json({ error: "Server missing ADMIN_PASS configuration" });
  }

  if (!adminPass || adminPass !== expectedPass) {
    return res.status(401).json({ error: "Unauthorized admin access" });
  }

  next();
}

// GET /notifs - Get all notifications (for frontend)
router.get("/", limiter, async (req, res, next) => {
  try {
    const auth_query = req.query.accessToken;
    const expectedToken = process.env.ACCESS_TOKEN;

    if (expectedToken && auth_query !== expectedToken) {
      return res.status(401).json({ error: "Unauthorized access" });
    }

    const notifications = await Notification.find()
      .sort({ createdAt: -1 })
      .lean();
    return res.json({
      ok: true,
      data: notifications,
    });
  } catch (err) {
    next(err);
  }
});

// GET /notifs/admin - Get all notifications (admin only)
router.get("/admin", ensureAdmin, async (req, res, next) => {
  try {
    const notifications = await Notification.find()
      .sort({ createdAt: -1 })
      .lean();
    return res.json({
      ok: true,
      data: notifications,
    });
  } catch (err) {
    next(err);
  }
});

// POST /notifs/admin/add - Add notification (admin only)
router.post("/admin/add", ensureAdmin, async (req, res, next) => {
  try {
    const title = (req.body.title || "").trim();
    const description = (req.body.description || "").trim();

    if (!title) {
      return res.status(400).json({ error: "Title is required." });
    }

    const notification = new Notification({
      title,
      description,
    });

    await notification.save();
    return res.json({
      ok: true,
      message: "Notification added successfully.",
      data: notification,
    });
  } catch (err) {
    if (err.name === "ValidationError") {
      return res.status(400).json({ error: "Invalid notification data." });
    }
    next(err);
  }
});

// DELETE /notifs/admin/delete/:id - Delete notification (admin only)
router.delete("/admin/delete/:id", ensureAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const deletedNotif = await Notification.findByIdAndDelete(id);

    if (!deletedNotif) {
      return res.status(404).json({ error: "Notification not found." });
    }

    return res.json({
      ok: true,
      message: "Notification deleted successfully.",
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
